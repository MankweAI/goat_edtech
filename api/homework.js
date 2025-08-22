/**
 * Consolidated Homework Help System
 * All functionality in single file for Vercel deployment
 * User: sophoniagoat
 * Created: 2025-08-22 12:19:41 UTC
 */

const vision = require("@google-cloud/vision");
const OpenAI = require("openai");

// Initialize APIs
const visionClient = new vision.ImageAnnotatorClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// User state management
const userStates = new Map();

class ConsolidatedHomeworkHelp {
  constructor() {
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
    };
  }

  async processHomeworkRequest(req, res) {
    const { psid, message, imageData, user_input } = req.body;
    const userId = psid || "anonymous";
    const text = message || user_input || "";

    try {
      let user = this.getOrCreateUser(userId);

      // Handle image upload
      if (imageData) {
        return await this.handleImageUpload(user, imageData, res);
      }

      // Handle text input
      if (text) {
        return await this.handleTextInput(user, text, res);
      }

      // Default welcome
      return this.sendWelcomeMessage(res);
    } catch (error) {
      console.error("Homework help error:", error);
      return res.json({
        message: "Sorry, something went wrong. Please try again.",
        status: "error",
      });
    }
  }

  async handleImageUpload(user, imageData, res) {
    try {
      console.log("Processing homework image...");

      // OCR with Google Vision
      const imageBuffer = Buffer.from(imageData, "base64");
      const [result] = await visionClient.textDetection({
        image: { content: imageBuffer },
      });

      const extractedText = result.fullTextAnnotation?.text || "";
      const confidence = this.calculateOCRConfidence(result);

      if (confidence < 0.6) {
        return res.json({
          message:
            "📸 **Image quality could be better!**\n\nTry:\n• Better lighting\n• Hold camera steady\n• Get closer to text\n\nOr type your question directly.",
          status: "low_confidence",
        });
      }

      // Detect questions in text
      const questions = this.detectQuestions(extractedText);

      user.context = {
        extractedText: extractedText,
        questions: questions,
        state: "questions_detected",
      };

      if (questions.length === 1) {
        user.context.selectedQuestion = questions[0];
        user.context.state = "ready_for_help";

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
      console.error("OCR processing error:", error);
      return res.json({
        message:
          "📸 **Image processing failed.** Please try typing your question instead.",
        status: "error",
      });
    }
  }

  async handleTextInput(user, text, res) {
    const lowerText = text.toLowerCase().trim();

    // Check if user is selecting a question number
    if (user.context?.state === "questions_detected") {
      const questionNumber = parseInt(text);
      if (questionNumber && user.context.questions[questionNumber - 1]) {
        user.context.selectedQuestion =
          user.context.questions[questionNumber - 1];
        user.context.state = "ready_for_help";

        return res.json({
          message: `📚 **Question ${questionNumber} selected!**\n\n"${user.context.selectedQuestion.text.substring(
            0,
            100
          )}..."\n\n**What specifically are you stuck on?**`,
          status: "success",
        });
      }
    }

    // Check if user needs help with current question
    if (
      user.context?.state === "ready_for_help" &&
      user.context.selectedQuestion
    ) {
      return await this.generateHint(user, text, res);
    }

    // Handle direct question input
    if (this.isHomeworkQuestion(lowerText)) {
      const questionType = this.classifyQuestion(text);
      user.context = {
        selectedQuestion: { text: text, type: questionType },
        state: "ready_for_help",
      };

      return await this.generateHint(user, text, res);
    }

    // General help
    return res.json({
      message:
        "📚 **Homework Help Ready!**\n\n• 📸 Upload homework image\n• 📝 Type your question\n• 💭 Tell me what you're stuck on\n\nHow can I help you get unstuck?",
      status: "success",
    });
  }

  async generateHint(user, struggle, res) {
    try {
      const question = user.context.selectedQuestion;
      const questionType = question.type || "general";

      // Try instant hint first
      const instantHint = this.instantHints[questionType];
      if (instantHint) {
        return res.json({
          message: `💡 **Quick Hint:**\n\n${instantHint.hint}\n\n**Example:** ${instantHint.example}\n\n✅ **Apply this to your homework and keep going!**`,
          status: "success",
        });
      }

      // Generate AI hint
      const aiHint = await this.generateAIHint(question, struggle);

      return res.json({
        message: `💡 **Educational Hint:**\n\n${aiHint}\n\n✅ **Use this guidance to work through your problem!**`,
        status: "success",
      });
    } catch (error) {
      console.error("Hint generation error:", error);

      // Fallback hint
      return res.json({
        message: `💡 **General Approach:**\n\n1. **Identify** what you need to find\n2. **List** what information you have\n3. **Choose** the right formula or method\n4. **Work** step by step\n\n🔍 **Check your textbook** for similar examples!`,
        status: "success",
      });
    }
  }

  async generateAIHint(question, struggle) {
    try {
      const response = await openai.chat.completions.create({
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

      return response.choices[0].message.content.trim();
    } catch (error) {
      throw error;
    }
  }

  detectQuestions(text) {
    const questions = [];

    // Pattern 1: Numbered questions (1. 2. 3.)
    const numberedPattern = /(\d+)[\.\)]\s*([^]*?)(?=\d+[\.\)]|$)/g;
    let match;

    while ((match = numberedPattern.exec(text)) !== null) {
      const questionNumber = parseInt(match[1]);
      const questionText = match[2].trim();

      if (questionText.length > 10) {
        questions.push({
          number: questionNumber,
          text: questionText,
          type: this.classifyQuestion(questionText),
        });
      }
    }

    // If no numbered questions, treat as single question
    if (questions.length === 0 && text.length > 10) {
      questions.push({
        number: 1,
        text: text.trim(),
        type: this.classifyQuestion(text),
      });
    }

    return questions;
  }

  classifyQuestion(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes("solve") && lowerText.includes("x"))
      return "linear_equation";
    if (lowerText.includes("area") && lowerText.includes("triangle"))
      return "triangle_area";
    if (lowerText.includes("area") && lowerText.includes("circle"))
      return "circle_area";
    if (lowerText.includes("quadratic") || lowerText.includes("x²"))
      return "quadratic_equation";
    if (lowerText.includes("factor")) return "factoring";
    if (
      lowerText.includes("sin") ||
      lowerText.includes("cos") ||
      lowerText.includes("tan")
    )
      return "trigonometry";

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

  sendWelcomeMessage(res) {
    return res.json({
      message:
        "📚 **Homework Help Ready!**\n\n• 📸 Upload homework image\n• 📝 Type your question\n• 💭 Tell me what you're stuck on\n\nHow can I help you get unstuck?",
      status: "success",
    });
  }
}

// Main export function
module.exports = async (req, res) => {
  const homeworkHelper = new ConsolidatedHomeworkHelp();
  return await homeworkHelper.processHomeworkRequest(req, res);
};
