/**
 * Consolidated Homework Help System - Production Ready
 * GOAT Bot 2.0 - SA Student Companion
 * User: DithetoMokgabudi
 * Updated: 2025-08-23 11:26:17 UTC
 * PHASE 3: Optimized Vision API integration & enhanced response generation
 */

const vision = require("@google-cloud/vision");
const OpenAI = require("openai");
const crypto = require("crypto");

// Production-ready Vision API initialization
let visionClient;
try {
  console.log("📸 Initializing Vision API with credentials file");
  visionClient = new vision.ImageAnnotatorClient({
    keyFilename:
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      "./google-vision-credentials.json",
  });
  console.log("✅ Vision API client initialized successfully");
} catch (error) {
  console.error("❌ Vision API initialization error:", error);
  throw new Error("Vision API initialization failed. Check credentials file.");
}

// OCR Result caching system to reduce API calls
const ocrCache = new Map(); // imageHash -> OCR result
const OCR_CACHE_MAX_SIZE = 100; // Limit cache size
const OCR_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// OpenAI initialization with proper error handling
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OpenAI API key not found, using mock implementation");
    // Create mock OpenAI client with predefined responses
    openai = {
      chat: {
        completions: {
          create: async ({ messages }) => {
            console.log("📝 Using mock OpenAI response");
            // Extract the question type from the message to provide relevant hints
            const message = messages[0]?.content || "";
            let mockResponse =
              "Focus on understanding the key concepts and applying the right formula.";

            if (message.includes("linear_equation")) {
              mockResponse =
                "Move all variables to one side and constants to the other side. Then solve for the variable.";
            } else if (message.includes("triangle_area")) {
              mockResponse =
                "Remember that the area of a triangle is (1/2) × base × height.";
            } else if (message.includes("quadratic")) {
              mockResponse =
                "Try factoring or using the quadratic formula: x = (-b ± √(b² - 4ac)) ÷ 2a.";
            }

            return {
              choices: [{ message: { content: mockResponse } }],
              usage: { total_tokens: 0 },
            };
          },
        },
      },
    };
  } else {
    console.log("🔄 Initializing OpenAI with API key");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (error) {
  console.error("❌ OpenAI initialization error:", error);
  // Create mock OpenAI client as fallback
  openai = {
    chat: {
      completions: {
        create: async () => {
          console.log("📝 Using fallback response due to initialization error");
          return {
            choices: [
              {
                message: {
                  content:
                    "Look for similar examples in your textbook and follow the same steps for this problem.",
                },
              },
            ],
            usage: { total_tokens: 0 },
          };
        },
      },
    },
  };
}

// Homework state constants for consistency
const HOMEWORK_STATES = {
  WELCOME: "welcome",
  AWAITING_QUESTION: "awaiting_question",
  QUESTIONS_DETECTED: "questions_detected",
  READY_FOR_HELP: "ready_for_help",
  PROVIDING_HINT: "providing_hint",
  FOLLOW_UP: "follow_up",
};

// User state management
const userStates = new Map();

// Image processing utilities
const imageProcessing = {
  // Generate SHA-256 hash of image data for caching
  hashImage: function (imageData) {
    return crypto.createHash("sha256").update(imageData).digest("hex");
  },

  // Check if image is already in cache
  checkCache: function (imageHash) {
    const cached = ocrCache.get(imageHash);
    if (cached) {
      // Check if cache entry is still valid
      if (Date.now() - cached.timestamp < OCR_CACHE_TTL) {
        console.log("📸 OCR cache hit for image:", imageHash.substring(0, 8));
        return cached.result;
      } else {
        // Clear expired entry
        ocrCache.delete(imageHash);
      }
    }
    return null;
  },

  // Add result to cache
  cacheResult: function (imageHash, result) {
    // Implement LRU eviction if cache is full
    if (ocrCache.size >= OCR_CACHE_MAX_SIZE) {
      const oldestKey = ocrCache.keys().next().value;
      ocrCache.delete(oldestKey);
    }

    ocrCache.set(imageHash, {
      result,
      timestamp: Date.now(),
    });

    console.log("📸 Cached OCR result for image:", imageHash.substring(0, 8));
  },

  // Validate image before processing
  validateImage: function (imageData) {
    if (!imageData) return { valid: false, reason: "No image data provided" };

    try {
      // Check if it's a valid base64 string
      const buffer = Buffer.from(imageData, "base64");

      // Basic size validation
      if (buffer.length < 100) {
        return { valid: false, reason: "Image too small or invalid" };
      }

      if (buffer.length > 5000000) {
        // ~5MB
        return { valid: false, reason: "Image too large (max 5MB)" };
      }

      return { valid: true, buffer };
    } catch (error) {
      console.error("Image validation error:", error);
      return { valid: false, reason: "Invalid image format" };
    }
  },

  // Optimize image for OCR processing
  optimizeForOCR: function (imageBuffer) {
    // In a full implementation, this would use a library like Sharp
    // to resize and optimize the image before OCR
    // For now, we'll just return the buffer as-is
    return imageBuffer;
  },
};

class ConsolidatedHomeworkHelp {
  constructor() {
    // Expanded instant hints with comprehensive coverage
    this.instantHints = {
      // Linear equations
      linear_equation: {
        hint: "Move numbers to one side, x to the other",
        example: "If 2x + 5 = 15, then 2x = 10, so x = 5",
      },
      // Triangle area
      triangle_area: {
        hint: "Area = ½ × base × height",
        example: "Base = 6, Height = 4 → Area = ½ × 6 × 4 = 12",
      },
      // Circle area
      circle_area: {
        hint: "Area = π × radius²",
        example: "radius = 3 → Area = π × 3² = 9π ≈ 28.3",
      },
      // Quadratic equations
      quadratic_equation: {
        hint: "Factor or use the quadratic formula: x = (-b ± √(b² - 4ac)) ÷ 2a",
        example:
          "For x² + 5x + 6 = 0, a=1, b=5, c=6, leading to x = -2 or x = -3",
      },
      // Factoring
      factoring: {
        hint: "Find numbers that multiply to give c and add to give b in ax² + bx + c",
        example:
          "x² + 7x + 12 factors to (x + 3)(x + 4) because 3×4=12 and 3+4=7",
      },
      // Trigonometry
      trigonometry: {
        hint: "Remember the key ratios: sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent",
        example:
          "In a right triangle with hypotenuse 5 and opposite side 3, sin(θ) = 3/5 = 0.6",
      },
      // Rectangle area
      rectangle_area: {
        hint: "Area = length × width",
        example: "Length = 7, Width = 4 → Area = 7 × 4 = 28",
      },
      // Perimeter
      perimeter: {
        hint: "Add all sides of the shape",
        example:
          "Rectangle with length 5 and width 3: Perimeter = 2(5 + 3) = 16",
      },
      // Geometry angles
      geometry_angles: {
        hint: "In a triangle, angles add to 180°. In a quadrilateral, angles add to 360°",
        example:
          "If two angles in a triangle are 45° and 60°, the third angle is 180° - 45° - 60° = 75°",
      },
      // Statistics
      statistics: {
        hint: "Mean = sum of values ÷ number of values; Median = middle value when arranged in order",
        example:
          "For data [3,7,8,9,12]: Mean = (3+7+8+9+12)/5 = 7.8, Median = 8",
      },
      // Probability
      probability: {
        hint: "Probability = favorable outcomes ÷ total possible outcomes",
        example: "Probability of rolling a 6 on a die = 1 ÷ 6 = 0.167",
      },
    };
  }

  async processHomeworkRequest(req, res) {
    // Standardize on message and imageData parameters
    const { psid, message, imageData, user_input } = req.body;
    const userId = psid || "anonymous";
    const text = message || user_input || "";

    const formatResponse = (message, status = "success") => {
      return {
        message,
        status,
        echo: message, // Add the required echo field for ManyChat
      };
    };
    try {
      let user = this.getOrCreateUser(userId);

      // Ensure consistent menu state
      user.current_menu = "homework_help";

      // Handle image upload with validation
      if (imageData) {
        console.log(
          `📸 Processing image data for user ${userId} (${(
            imageData.length / 1024
          ).toFixed(1)}KB)`
        );
        const validation = imageProcessing.validateImage(imageData);

        if (!validation.valid) {
          return res.json({
            message: `📸 **Image issue:** ${validation.reason}\n\nPlease try uploading again with a clearer image or type your question directly.`,
            status: "error",
          });
        }

        try {
          return await this.handleImageUpload(
            user,
            imageData,
            res,
            formatResponse
          );
        } catch (imageError) {
          console.error("📸 Image processing error:", imageError);
          return res.json(
            formatResponse(
              "Sorry, I had trouble processing your image. Could you try sending a clearer photo or type your question?",
              "error"
            )
          );
        }
      }

      // Handle text input
      if (text) {
        return await this.handleTextInput(user, text, res, formatResponse);
      }

      // Default welcome
      return this.sendWelcomeMessage(res, formatResponse);
    } catch (error) {
      console.error("Homework help error:", error);
      return res.json(
        formatResponse(
          "Sorry, something went wrong. Please try again.",
          "error"
        )
      );
    }
  }

  async handleImageUpload(user, imageData, res) {
    try {
      console.log(`Processing homework image for user ${user.id}...`);

      // Generate image hash for caching
      const imageHash = imageProcessing.hashImage(imageData);

      // Check cache first
      const cachedResult = imageProcessing.checkCache(imageHash);
      let result;

      if (cachedResult) {
        console.log("Using cached OCR result");
        result = cachedResult;
      } else {
        // Prepare image for OCR
        const imageBuffer = Buffer.from(imageData, "base64");
        const optimizedBuffer = imageProcessing.optimizeForOCR(imageBuffer);

        // Process with Vision API with timeout
        const ocrPromise = visionClient.textDetection({
          image: { content: optimizedBuffer },
        });

        // Add timeout to prevent hanging on slow OCR
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("OCR processing timeout")), 15000);
        });

        // Race between OCR and timeout
        [result] = await Promise.race([ocrPromise, timeoutPromise]);

        // Cache the result
        imageProcessing.cacheResult(imageHash, result);
      }

      const extractedText = result.fullTextAnnotation?.text || "";
      const confidence = this.calculateOCRConfidence(result);

      console.log(
        `OCR confidence: ${confidence.toFixed(2)}, text length: ${
          extractedText.length
        }`
      );

      // Handle low confidence OCR results
      if (confidence < 0.6) {
        user.context = {
          extractedText,
          partialConfidence: confidence,
          state: HOMEWORK_STATES.AWAITING_QUESTION,
          ocrAttempts: (user.context?.ocrAttempts || 0) + 1,
        };

        return res.json({
          message:
            "📸 **Image quality could be better!**\n\n" +
            `I detected some text but with low confidence (${(
              confidence * 100
            ).toFixed(0)}%).\n\n` +
            "Try:\n• Better lighting\n• Hold camera steady\n• Get closer to text\n\n" +
            "Or type your question directly.",
          status: "low_confidence",
        });
      }

      // Detect questions in text
      const questions = this.detectQuestions(extractedText);

      user.context = {
        extractedText: extractedText,
        questions: questions,
        state:
          questions.length > 1
            ? HOMEWORK_STATES.QUESTIONS_DETECTED
            : HOMEWORK_STATES.READY_FOR_HELP,
        ocrConfidence: confidence,
        lastActivity: "image_upload",
        imageHash: imageHash, // Store hash for potential re-analysis
        timestamp: new Date().toISOString(),
      };

      if (questions.length === 0) {
        return res.json({
          message:
            "📸 **I couldn't find any clear homework questions in this image.**\n\n" +
            "Could you try:\n" +
            "• Taking a clearer photo\n" +
            "• Typing your question directly\n" +
            "• Making sure it's a homework question",
          status: "no_questions",
        });
      }

      if (questions.length === 1) {
        user.context.selectedQuestion = questions[0];
        user.context.state = HOMEWORK_STATES.READY_FOR_HELP;

        return res.json({
          message: `📚 **Found your question!**\n\n"${questions[0].text.substring(
            0,
            100
          )}..."\n\n**What specifically are you stuck on?**`,
          status: "success",
        });
      } else {
        return res.json({
          message: `📚 **Found ${
            questions.length
          } questions!**\n\n${this.formatQuestionList(
            questions
          )}\n\n**Which question do you need help with?** (Type the number)`,
          status: "success",
        });
      }
    } catch (error) {
      // Enhanced error handling with specific error messages
      console.error("OCR processing error:", error);

      // Update error tracking in user context
      user.context = {
        ...user.context,
        ocrAttempts: (user.context?.ocrAttempts || 0) + 1,
        lastOcrError: error.message,
        state: HOMEWORK_STATES.AWAITING_QUESTION,
        timestamp: new Date().toISOString(),
      };

      let errorMessage =
        "📸 **Image processing failed.** Please try typing your question instead.";

      if (error.message.includes("timeout")) {
        errorMessage =
          "📸 **Image processing timed out.** Please try a clearer image or type your question directly.";
      } else if (error.message.includes("quota")) {
        errorMessage =
          "📸 **Service temporarily busy.** Please try again in a moment or type your question directly.";
      } else if (error.code === 7) {
        errorMessage =
          "📸 **Vision API permission error.** Our image recognition is temporarily unavailable. Please type your question directly.";
      }

      return res.json({
        message: errorMessage,
        status: "error",
      });
    }
  }

  async handleTextInput(user, text, res) {
    const lowerText = text.toLowerCase().trim();

    // Check if user is selecting a question number
    if (user.context?.state === HOMEWORK_STATES.QUESTIONS_DETECTED) {
      const questionNumber = parseInt(text);
      if (questionNumber && user.context.questions[questionNumber - 1]) {
        user.context.selectedQuestion =
          user.context.questions[questionNumber - 1];
        user.context.state = HOMEWORK_STATES.READY_FOR_HELP;

        return res.json({
          message: `📚 **Question ${questionNumber} selected!**\n\n"${user.context.selectedQuestion.text.substring(
            0,
            100
          )}..."\n\n**What specifically are you stuck on?**`,
          status: "success",
        });
      }
    }

    // Check if user needs help with current question using intent classification
    if (
      user.context?.state === HOMEWORK_STATES.READY_FOR_HELP &&
      user.context.selectedQuestion
    ) {
      const intent = this.classifyUserIntent(text);

      if (intent.isHelpRequest || intent.isStruggle) {
        user.context.state = HOMEWORK_STATES.PROVIDING_HINT;
        user.context.userStruggle = text;

        // Track specific struggle type for better future responses
        if (intent.struggleType) {
          user.context.struggleType = intent.struggleType;
        }

        return await this.generateHint(user, text, res);
      } else if (intent.isAnswer) {
        // Handle answer verification feedback
        return res.json({
          message:
            "Great attempt! Would you like me to verify your approach or provide a hint instead?",
          status: "success",
        });
      } else if (intent.isFeedback) {
        // Handle feedback on hints
        return res.json({
          message:
            "Thanks for the feedback! Would you like another hint or a different explanation?",
          status: "success",
        });
      } else {
        // For ambiguous intent, still provide help
        user.context.state = HOMEWORK_STATES.PROVIDING_HINT;
        user.context.userStruggle = text;
        return await this.generateHint(user, text, res);
      }
    }

    // Handle direct question input
    if (this.isHomeworkQuestion(lowerText)) {
      const questionType = this.classifyQuestion(text);

      // Use consistent state constants
      user.context = {
        selectedQuestion: { text: text, type: questionType },
        state: HOMEWORK_STATES.READY_FOR_HELP,
        lastActivity: "direct_question",
        timestamp: new Date().toISOString(),
      };

      return res.json({
        message: `📚 **Got your question!**\n\n"${text.substring(
          0,
          100
        )}..."\n\n**What specifically are you stuck on?**`,
        status: "success",
      });
    }

    // General help
    return res.json({
      message:
        "📚 **Homework Help Ready!**\n\n• 📸 Upload homework image\n• 📝 Type your question\n• 💭 Tell me what you're stuck on\n\nHow can I help you get unstuck?",
      status: "success",
    });
  }

  // Enhanced intent classification with more specific struggle types
  classifyUserIntent(text) {
    const lowerText = text.toLowerCase();

    // Base intent classification
    const helpTerms = [
      "help",
      "hint",
      "stuck",
      "don't understand",
      "don't know",
      "confused",
      "not sure",
      "explain",
      "how to",
    ];
    const isHelpRequest = helpTerms.some((term) => lowerText.includes(term));

    const struggleTerms = [
      "difficult",
      "hard",
      "can't",
      "cannot",
      "struggling",
      "lost",
      "trouble",
      "problem with",
      "issue with",
    ];
    const isStruggle = struggleTerms.some((term) => lowerText.includes(term));

    const answerIndicators = [
      "answer is",
      "solution is",
      "i got",
      "i think",
      "my answer",
      "it equals",
      "equals",
      "result",
      "i found",
      "x =",
    ];
    const isAnswer = answerIndicators.some((term) => lowerText.includes(term));

    const feedbackTerms = [
      "thanks",
      "thank you",
      "got it",
      "makes sense",
      "helpful",
      "not helpful",
      "didn't help",
      "still confused",
      "better",
    ];
    const isFeedback = feedbackTerms.some((term) => lowerText.includes(term));

    // Identify specific struggle types
    let struggleType = null;

    // Formula-related struggles
    if (
      lowerText.includes("formula") ||
      lowerText.includes("equation") ||
      lowerText.includes("don't know how to")
    ) {
      struggleType = "formula_knowledge";
    }

    // Calculation struggles
    else if (
      lowerText.includes("calculation") ||
      lowerText.includes("compute") ||
      lowerText.includes("arithmetic")
    ) {
      struggleType = "calculation";
    }

    // Conceptual struggles
    else if (
      lowerText.includes("concept") ||
      lowerText.includes("understand") ||
      lowerText.includes("meaning")
    ) {
      struggleType = "conceptual";
    }

    // Approach struggles
    else if (
      lowerText.includes("approach") ||
      lowerText.includes("method") ||
      lowerText.includes("strategy") ||
      lowerText.includes("start")
    ) {
      struggleType = "approach";
    }

    return {
      isHelpRequest,
      isStruggle,
      isAnswer,
      isFeedback,
      struggleType,
    };
  }

  async generateHint(user, struggle, res) {
    try {
      const question = user.context.selectedQuestion;
      const questionType = question.type || "general";

      // Use struggle type to personalize hints
      const struggleType = user.context.struggleType || "general";

      // Try instant hint first
      const instantHint = this.instantHints[questionType];
      if (instantHint) {
        // Track user question types for better future responses
        user.context.lastQuestionTypes = [
          ...(user.context.lastQuestionTypes || []),
          questionType,
        ].slice(-5); // Keep last 5

        // Customize hint based on struggle type
        let customizedHint = instantHint.hint;
        let customizedExample = instantHint.example;

        if (struggleType === "formula_knowledge") {
          customizedHint = `**Formula:** ${instantHint.hint}`;
        } else if (struggleType === "calculation") {
          customizedExample = `**Step-by-step:** ${instantHint.example}`;
        } else if (struggleType === "conceptual") {
          customizedHint = `**Concept:** ${instantHint.hint}\n\nThink of it as a pattern or rule to follow.`;
        }

        // Update user state to track hint provided
        user.context.lastHint = {
          type: "instant",
          hintProvided: customizedHint,
          example: customizedExample,
          timestamp: new Date().toISOString(),
          struggleType,
        };

        return res.json({
          message: `💡 **Quick Hint:**\n\n${customizedHint}\n\n**Example:** ${customizedExample}\n\n✅ **Apply this to your homework and keep going!**`,
          status: "success",
        });
      }

      // Hierarchical fallbacks for hint generation
      // First try AI hint if OpenAI is available
      let aiHint;
      try {
        aiHint = await this.generateAIHint(question, struggle);
      } catch (aiError) {
        console.log(
          "AI hint generation failed, using fallback:",
          aiError.message
        );
        // Fall back to dynamic hint generation
        aiHint = this.generateDynamicHint(question, struggle);
      }

      // Update user state to track hint provided
      user.context.lastHint = {
        type: aiHint.source || "ai",
        hintProvided: aiHint.hint || aiHint,
        timestamp: new Date().toISOString(),
        struggleType,
      };

      return res.json({
        message: `💡 **Educational Hint:**\n\n${
          aiHint.hint || aiHint
        }\n\n✅ **Use this guidance to work through your problem!**`,
        status: "success",
      });
    } catch (error) {
      console.error("Hint generation error:", error);

      // Update user state even for fallback
      user.context.lastHint = {
        type: "fallback",
        timestamp: new Date().toISOString(),
        error: error.message,
      };

      // Fallback hint
      return res.json({
        message: `💡 **General Approach:**\n\n1. **Identify** what you need to find\n2. **List** what information you have\n3. **Choose** the right formula or method\n4. **Work** step by step\n\n🔍 **Check your textbook** for similar examples!`,
        status: "success",
      });
    }
  }

  async generateAIHint(question, struggle) {
    try {
      // Add timeout and better error handling
      const generatePromise = openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Student is stuck on: "${struggle}"
Question: "${question.text}"
Question type: ${question.type}

Generate a brief educational hint that guides them toward the solution WITHOUT giving the direct answer. Focus on the method or approach they should use. Maximum 40 words.`,
          },
        ],
        max_tokens: 60,
        temperature: 0.1,
      });

      // Add timeout for API
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("AI hint generation timeout")),
          10000
        );
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("AI hint generation error:", error);
      if (error.message.includes("timeout")) {
        return "Focus on identifying the key information and applying the relevant formula. Break down the problem into smaller steps.";
      }
      throw error;
    }
  }

  // Dynamic hint generation for uncovered types
  generateDynamicHint(question, struggle) {
    const questionText = question.text.toLowerCase();
    const struggleText = struggle.toLowerCase();
    let hint = "";
    let source = "dynamic";

    // Analyze question for key patterns
    if (
      questionText.includes("solve") &&
      (questionText.includes("=") || questionText.includes("equation"))
    ) {
      hint =
        "Isolate the variable by performing the same operations on both sides of the equation. Remember to reverse operations (addition becomes subtraction, etc).";
    } else if (
      questionText.includes("area") ||
      questionText.includes("perimeter") ||
      questionText.includes("volume")
    ) {
      hint =
        "Identify the shape and use the appropriate formula. Make sure your units are consistent throughout your calculation.";
    } else if (questionText.includes("factor")) {
      hint =
        "Look for the greatest common factor first. Then try to arrange terms to identify patterns like difference of squares or perfect trinomials.";
    } else if (questionText.includes("graph")) {
      hint =
        "Start by finding key points like x-intercepts (where y=0), y-intercepts (where x=0), and any vertices or asymptotes if applicable.";
    } else {
      // Generic hint based on struggle
      if (
        struggleText.includes("formula") ||
        struggleText.includes("don't know how")
      ) {
        hint =
          "Try to identify what type of problem this is, then recall the relevant formula. Look for keywords in the question that indicate the formula needed.";
      } else if (struggleText.includes("start")) {
        hint =
          "Start by writing down what you know and what you need to find. Then identify the connection between them - what formula or method links them?";
      } else {
        hint =
          "Break the problem into smaller steps. Identify the information given and what you're trying to find, then work step-by-step toward the solution.";
      }
    }

    return {
      hint,
      source,
    };
  }

  detectQuestions(text) {
    const questions = [];

    // Pattern 1: Numbered questions (1. 2. 3.)
    const numberedPattern = /(\d+)[\.\)]\s*([^]*?)(?=\d+[\.\)]|$)/g;
    let match;

    while ((match = numberedPattern.exec(text)) !== null) {
      const questionNumber = parseInt(match[1]);
      const questionText = match[2].trim();

      if (questionText.length > 5) {
        // Reduced minimum length
        questions.push({
          number: questionNumber,
          text: questionText,
          type: this.classifyQuestion(questionText),
          numbers: this.extractNumbers(questionText),
        });
      }
    }

    // If no numbered questions, check if it's a math equation
    if (questions.length === 0) {
      // Special case for equations (contains = sign or math operators)
      const isMathEquation = /[=\+\-\*\/\^x]/.test(text);

      // Lower threshold for equations, higher for general text
      const minLength = isMathEquation ? 5 : 10;

      if (text.length >= minLength) {
        questions.push({
          number: 1,
          text: text.trim(),
          type: this.classifyQuestion(text),
          numbers: this.extractNumbers(text),
        });
      }
    }

    return questions;
  }

  classifyQuestion(text) {
    const lowerText = text.toLowerCase();

    // Enhanced classification with more question types
    if (lowerText.includes("solve") && lowerText.includes("x"))
      return "linear_equation";
    if (lowerText.includes("area") && lowerText.includes("triangle"))
      return "triangle_area";
    if (lowerText.includes("area") && lowerText.includes("circle"))
      return "circle_area";
    if (lowerText.includes("area") && lowerText.includes("rectangle"))
      return "rectangle_area";
    if (lowerText.includes("perimeter")) return "perimeter";
    if (lowerText.includes("quadratic") || lowerText.includes("x²"))
      return "quadratic_equation";
    if (lowerText.includes("factor")) return "factoring";
    if (
      lowerText.includes("sin") ||
      lowerText.includes("cos") ||
      lowerText.includes("tan")
    )
      return "trigonometry";
    if (lowerText.includes("angle")) return "geometry_angles";
    if (
      lowerText.includes("mean") ||
      lowerText.includes("median") ||
      lowerText.includes("mode")
    )
      return "statistics";
    if (lowerText.includes("probability") || lowerText.includes("chance"))
      return "probability";

    return "general_math";
  }

  isHomeworkQuestion(text) {
    const indicators = [
      "solve",
      "find",
      "calculate",
      "determine",
      "area",
      "perimeter",
      "equation",
      "triangle",
      "circle",
      "help with",
      "stuck on",
      "don't understand",
      "confused about",
    ];

    return indicators.some((indicator) => text.includes(indicator));
  }

  calculateOCRConfidence(visionResult) {
    if (!visionResult.textAnnotations?.length) return 0;

    const annotations = visionResult.textAnnotations.slice(1);
    if (annotations.length === 0) return 0.5;

    const avgConfidence =
      annotations.reduce(
        (sum, annotation) => sum + (annotation.confidence || 0.7),
        0
      ) / annotations.length;

    return Math.max(0, Math.min(1, avgConfidence));
  }

  formatQuestionList(questions) {
    return questions
      .map(
        (q, index) =>
          `**${q.number || index + 1}.** ${q.text.substring(0, 60)}...`
      )
      .join("\n\n");
  }

  getOrCreateUser(userId) {
    if (!userStates.has(userId)) {
      userStates.set(userId, {
        id: userId,
        context: {},
        lastActive: new Date().toISOString(),
      });
    }

    const user = userStates.get(userId);
    user.lastActive = new Date().toISOString();
    return user;
  }

  sendWelcomeMessage(res, formatResponse) {
    const message =
      "📚 **Homework Help Ready!**\n\n• 📸 Upload homework image\n• 📝 Type your question\n• 💭 Tell me what you're stuck on\n\nHow can I help you get unstuck?";
    return res.json(formatResponse(message));
  }

  extractNumbers(questionText) {
    const numbers = {};

    // Pattern 1: Common formats like "base = 10"
    const patterns = {
      base: /base\s*[=:]\s*(\d+)/i,
      height: /height\s*[=:]\s*(\d+)/i,
      length: /length\s*[=:]\s*(\d+)/i,
      width: /width\s*[=:]\s*(\d+)/i,
      radius: /radius\s*[=:]\s*(\d+)/i,
      area: /area\s*[=:]\s*(\d+)/i,
      coefficient: /(\d+)x/,
      constant: /[\+\-]\s*(\d+)(?!\s*x)/,
      equals: /=\s*(\d+)/,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = questionText.match(pattern);
      if (match) {
        numbers[key] = parseInt(match[1]);
      }
    }

    return numbers;
  }
}

class ManyCompatResponse {
  constructor(originalRes) {
    this.originalRes = originalRes;
  }

  // Intercept all JSON responses to ensure they have the echo field
  json(data) {
    // Ensure data is an object
    const responseData =
      typeof data === "object" ? data : { message: String(data) };

    // Ensure required fields exist
    if (!responseData.hasOwnProperty("status")) {
      responseData.status = responseData.error ? "error" : "success";
    }

    // CRITICAL: Add echo field for ManyChat
    if (
      !responseData.hasOwnProperty("echo") &&
      responseData.hasOwnProperty("message")
    ) {
      responseData.echo = responseData.message;
    }

    // Add timestamp if not present
    if (!responseData.hasOwnProperty("timestamp")) {
      responseData.timestamp = new Date().toISOString();
    }

    // Log the formatted response for debugging
    console.log(
      `🔄 Sending formatted response: ${JSON.stringify(responseData).substring(
        0,
        100
      )}...`
    );

    // Send the enhanced response
    return this.originalRes.json(responseData);
  }

  // Forward status method
  status(code) {
    this.originalRes.status(code);
    return this;
  }
}

// Memory management to prevent leaks
setInterval(() => {
  const now = Date.now();
  const expirationTime = 8 * 60 * 60 * 1000; // 8 hours
  let expiredCount = 0;

  for (const [userId, userData] of userStates.entries()) {
    const lastActiveTime = new Date(userData.lastActive).getTime();
    if (now - lastActiveTime > expirationTime) {
      userStates.delete(userId);
      expiredCount++;
    }
  }

  if (expiredCount > 0) {
    console.log(`🧹 Cleaned up ${expiredCount} inactive user sessions`);
  }

  // Also clean up expired cache entries
  let expiredCache = 0;
  for (const [hash, cacheData] of ocrCache.entries()) {
    if (now - cacheData.timestamp > OCR_CACHE_TTL) {
      ocrCache.delete(hash);
      expiredCache++;
    }
  }

  if (expiredCache > 0) {
    console.log(`🧹 Cleaned up ${expiredCache} expired OCR cache entries`);
  }
}, 60 * 60 * 1000); // Run cleanup every hour






module.exports = async (req, res) => {
  try {
    // Create interceptor that adds ManyChat compatibility
    const manyCompatRes = new ManyCompatResponse(res);

    // CRITICAL FIX: Track current menu state in ManyChat tracking
    const subscriberId =
      req.body.psid || req.body.subscriber_id || "default_user";
    if (global.MANYCHAT_STATES && subscriberId) {
      global.MANYCHAT_STATES.lastMenu.set(subscriberId, {
        menu: "homework_help",
        timestamp: Date.now(),
      });
      console.log(
        `🔄 Homework.js updated menu state: ${subscriberId} -> homework_help`
      );
    }

    // Process request with interceptor
    const homeworkHelper = new ConsolidatedHomeworkHelp();
    await homeworkHelper.processHomeworkRequest(req, manyCompatRes);

    return true; // Signal that we've handled the response
  } catch (finalError) {
    // Last-resort error handler with proper formatting
    console.error("CRITICAL ERROR:", finalError);

    // Even in case of critical error, format properly for ManyChat
    res.json({
      message: "Sorry, something went wrong. Please try again later.",
      status: "error",
      echo: "Sorry, something went wrong. Please try again later.",
      error: finalError.message,
    });

    return true; // Signal that error was handled
  }
};