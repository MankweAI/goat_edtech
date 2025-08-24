/**
 * Homework Processing Logic
 * GOAT Bot 2.0
 * Updated: 2025-08-24 12:22:00 UTC
 * Developer: DithetoMokgabudi
 */

const { processHomeworkImage, imageProcessing } = require("./image-ocr");
const { generateHomeworkHint } = require("./hint-system");
const { questionDetector } = require("../../utils/question-detector");
const https = require("https");
const { URL } = require("url");

// User state management
const userStates = new Map();

// Homework state constants for consistency
const HOMEWORK_STATES = {
  WELCOME: "welcome",
  AWAITING_QUESTION: "awaiting_question",
  QUESTIONS_DETECTED: "questions_detected",
  READY_FOR_HELP: "ready_for_help",
  PROVIDING_HINT: "providing_hint",
  FOLLOW_UP: "follow_up",
};

// Download an image URL and return base64 string
async function downloadImageAsBase64(imageUrl) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(imageUrl);
      const options = {
        method: "GET",
        headers: {
          "User-Agent":
            "GOATBot/2.0 (+https://github.com/MankweAI/goat_edtech)",
        },
      };

      const req = https.request(parsed, options, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode} fetching image URL`));
        }

        const contentType = res.headers["content-type"] || "";
        if (!contentType.startsWith("image/")) {
          return reject(
            new Error(
              `URL did not return an image content-type: ${contentType}`
            )
          );
        }

        const contentLength = parseInt(
          res.headers["content-length"] || "0",
          10
        );
        const MAX = 5 * 1024 * 1024; // 5MB
        if (contentLength && contentLength > MAX) {
          return reject(new Error("Image too large (max 5MB)"));
        }

        const chunks = [];
        let total = 0;
        res.on("data", (chunk) => {
          total += chunk.length;
          if (total > MAX) {
            req.destroy(new Error("Image too large (max 5MB)"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer.toString("base64"));
        });
      });

      req.setTimeout(10000, () => {
        req.destroy(new Error("Image download timeout"));
      });

      req.on("error", (err) => reject(err));
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Footer utilities: ensure every message carries escape routes
function appendFooter(message) {
  const footer =
    "\n\n—\n🏠 Type 'menu' for Main Menu • ❓ Ask another question anytime";
  return `${message}${footer}`;
}

function reply(res, data) {
  const payload = { ...data };
  if (payload.message) payload.message = appendFooter(payload.message);
  if (payload.echo) payload.echo = appendFooter(payload.echo);
  return res.json(payload);
}

// Helpers: intent and question detection
function getMainMenuMessage() {
  return `**Welcome to The GOAT.** I'm here help you study with calm and clarity.

**What do you need right now?**

1️⃣ 📅 Exam/Test coming 😰
2️⃣ 📚 Homework Help 🫶 ⚡  
3️⃣ 🧮 Tips & Hacks

Just pick a number! ✨`;
}

function detectGlobalNav(text) {
  const t = text.trim().toLowerCase();

  // Back to main menu
  if (
    t === "menu" ||
    t === "main menu" ||
    t === "back" ||
    t === "exit" ||
    t === "home"
  ) {
    return { action: "menu" };
  }

  // Quick switches (soft, handled upstream on next request)
  if (t.includes("switch") || t.includes("change topic")) {
    return { action: "switch" };
  }

  if (t.includes("exam")) {
    return { action: "go_exam" };
  }
  if (t.includes("memory")) {
    return { action: "go_memory" };
  }
  if (t.includes("homework")) {
    return { action: "go_homework" };
  }

  return null;
}

// A broader detector for typed questions (not only math)
function isDirectQuestion(text) {
  const t = text.trim().toLowerCase();
  if (!t) return false;

  const qWords =
    t.startsWith("what ") ||
    t.startsWith("what's ") ||
    t.startsWith("who ") ||
    t.startsWith("where ") ||
    t.startsWith("when ") ||
    t.startsWith("why ") ||
    t.startsWith("how ") ||
    t.startsWith("explain ") ||
    t.startsWith("define ") ||
    t.startsWith("describe ") ||
    t.startsWith("compare ") ||
    t.includes("difference between");

  const hasQuestionMark = t.endsWith("?");

  return qWords || hasQuestionMark;
}

class ConsolidatedHomeworkHelp {
  constructor() {}

  async processHomeworkRequest(req, res) {
    const {
      psid,
      message,
      imageData,
      imageInfo,
      user_input,
      has_image,
      imageUrl,
    } = req.body;
    const userId = psid || "anonymous";
    const text = (message || user_input || "").trim();

    if (has_image || imageData || imageInfo || imageUrl) {
      console.log(
        `📸 Homework processor received image request for user ${userId}`
      );
      if (imageInfo)
        console.log(`📸 Image type: ${imageInfo?.type || "unknown"}`);
      if (imageData)
        console.log(
          `📸 Image data length: ${
            typeof imageData === "string" ? imageData.length : "non-string"
          }`
        );
      if (imageUrl) {
        console.log(
          `📸 Image URL provided: ${String(imageUrl).substring(0, 120)}`
        );
      }
    } else {
      console.log(
        `📝 Homework processor received text: "${text.substring(0, 30)}..."`
      );
    }

    try {
      let user = this.getOrCreateUser(userId);
      user.current_menu = "homework_help";

      // Handle image via URL (download and convert), or direct base64
      if (imageData || imageUrl) {
        let base64Data = imageData;

        if (!base64Data && imageUrl) {
          try {
            base64Data = await downloadImageAsBase64(imageUrl);
          } catch (fetchErr) {
            console.error("📸 Image download error:", fetchErr);
            return reply(res, {
              message:
                "📸 I couldn't download the image from the link sent. Please resend a clearer image, or type your question.",
              status: "error",
              echo: "📸 I couldn't download the image from the link sent. Please resend a clearer image, or type your question.",
            });
          }
        }

        if (!base64Data) {
          return reply(res, {
            message:
              "📸 I received an image indicator but no usable image data. Please try sending again.",
            status: "error",
            echo: "📸 I received an image indicator but no usable image data. Please try sending again.",
          });
        }

        console.log(
          `📸 Processing image data for user ${userId} (${(
            base64Data.length / 1024
          ).toFixed(1)}KB)`
        );
        const validation = imageProcessing.validateImage(base64Data);

        if (!validation.valid) {
          return reply(res, {
            message: `📸 **Image issue:** ${validation.reason}\n\nPlease try uploading again with a clearer image or type your question directly.`,
            status: "error",
            echo: `📸 **Image issue:** ${validation.reason}\n\nPlease try uploading again with a clearer image or type your question directly.`,
          });
        }

        try {
          return await this.handleImageUpload(user, base64Data, res);
        } catch (imageError) {
          console.error("📸 Image processing error:", imageError);
          return reply(res, {
            message:
              "Sorry, I had trouble processing your image. Could you try sending a clearer photo or type your question?",
            status: "error",
            echo: "Sorry, I had trouble processing your image. Could you try sending a clearer photo or type your question?",
          });
        }
      }

      // TEXT FLOW
      if (text) {
        // 1) Global navigation intents (menu/switch)
        const nav = detectGlobalNav(text);
        if (nav) {
          if (nav.action === "menu") {
            // Reset to welcome
            user.context = {};
            user.current_menu = "welcome";
            return reply(res, {
              message: getMainMenuMessage(),
              status: "success",
              echo: getMainMenuMessage(),
            });
          }

          if (nav.action === "switch") {
            return reply(res, {
              message:
                "🔄 What would you like to switch to?\n\n1️⃣ Exam/Test Prep\n2️⃣ Homework Help\n3️⃣ Memory Hacks\n\nType a number or 'menu' to go back.",
              status: "success",
              echo: "🔄 What would you like to switch to?\n\n1️⃣ Exam/Test Prep\n2️⃣ Homework Help\n3️⃣ Memory Hacks\n\nType a number or 'menu' to go back.",
            });
          }

          if (nav.action === "go_exam") {
            user.current_menu = "exam_prep_conversation";
            return reply(res, {
              message:
                "🎯 Switching to Exam/Test Prep. Tell me your subject and grade, or type 'menu' to go back.",
              status: "success",
              echo: "🎯 Switching to Exam/Test Prep. Tell me your subject and grade, or type 'menu' to go back.",
            });
          }

          if (nav.action === "go_memory") {
            user.current_menu = "memory_hacks_active";
            return reply(res, {
              message:
                "🧠 Switching to Memory Hacks. Tell me a subject/topic, or type 'menu' to go back.",
              status: "success",
              echo: "🧠 Switching to Memory Hacks. Tell me a subject/topic, or type 'menu' to go back.",
            });
          }

          if (nav.action === "go_homework") {
            user.current_menu = "homework_help";
            // fall through
          }
        }

        // 2) PRIORITIZE follow-ups within an active question before treating as new question
        if (
          (user.context?.state === HOMEWORK_STATES.READY_FOR_HELP ||
            user.context?.state === HOMEWORK_STATES.PROVIDING_HINT) &&
          user.context.selectedQuestion
        ) {
          const intent = this.classifyUserIntent(text);

          if (intent.isHelpRequest || intent.isStruggle) {
            user.context.state = HOMEWORK_STATES.PROVIDING_HINT;
            user.context.userStruggle = text;

            if (intent.struggleType) {
              user.context.struggleType = intent.struggleType;
            }

            return await this.generateHint(user, text, res);
          } else if (intent.isAnswer) {
            return reply(res, {
              message:
                "Great attempt! Would you like me to verify your approach or provide a hint instead?",
              status: "success",
              echo: "Great attempt! Would you like me to verify your approach or provide a hint instead?",
            });
          } else if (intent.isFeedback) {
            return reply(res, {
              message:
                "Thanks for the feedback! Would you like another hint or a different explanation?",
              status: "success",
              echo: "Thanks for the feedback! Would you like another hint or a different explanation?",
            });
          } else {
            // Ambiguous input -> still try to help
            user.context.state = HOMEWORK_STATES.PROVIDING_HINT;
            user.context.userStruggle = text;
            return await this.generateHint(user, text, res);
          }
        }

        // 3) If user types a new question at any time, accept it
        if (this.isHomeworkQuestion(text) || isDirectQuestion(text)) {
          const questionType = this.classifyQuestion(text);

          user.context = {
            selectedQuestion: { text, type: questionType },
            state: HOMEWORK_STATES.READY_FOR_HELP,
            lastActivity: "direct_question",
            timestamp: new Date().toISOString(),
          };

          return reply(res, {
            message: `📚 **Got your question!**\n\n"${text.substring(
              0,
              100
            )}..."\n\n**What specifically are you stuck on?**`,
            status: "success",
            echo: `📚 **Got your question!**\n\n"${text.substring(
              0,
              100
            )}..."\n\n**What specifically are you stuck on?**`,
          });
        }

        // 4) Question selection path (if still in detection list)
        if (user.context?.state === HOMEWORK_STATES.QUESTIONS_DETECTED) {
          const questionNumber = parseInt(text);
          if (questionNumber && user.context.questions[questionNumber - 1]) {
            user.context.selectedQuestion =
              user.context.questions[questionNumber - 1];
            user.context.state = HOMEWORK_STATES.READY_FOR_HELP;

            return reply(res, {
              message: `📚 **Question ${questionNumber} selected!**\n\n"${user.context.selectedQuestion.text.substring(
                0,
                100
              )}..."\n\n**What specifically are you stuck on?**`,
              status: "success",
              echo: `📚 **Question ${questionNumber} selected!**\n\n"${user.context.selectedQuestion.text.substring(
                0,
                100
              )}..."\n\n**What specifically are you stuck on?**`,
            });
          }
        }

        // Default help prompt inside homework
        return reply(res, {
          message:
            "📚 **Homework Help Ready!**\n\n• 📸 Upload homework image\n• 📝 Type your question\n• 💭 Tell me what you're stuck on\n\nHow can I help you get unstuck?",
          status: "success",
          echo: "📚 **Homework Help Ready!**\n\n• 📸 Upload homework image\n• 📝 Type your question\n• 💭 Tell me what you're stuck on\n\nHow can I help you get unstuck?",
        });
      }

      // Default welcome
      return this.sendWelcomeMessage(res);
    } catch (error) {
      console.error("Homework help error:", error);
      return reply(res, {
        message: "Sorry, I encountered an error. Please try again.",
        status: "error",
        echo: "Sorry, I encountered an error. Please try again.",
      });
    }
  }

  async handleImageUpload(user, imageData, res) {
    try {
      console.log(`Processing homework image for user ${user.id}...`);

      const result = await processHomeworkImage(imageData, user.id);

      if (!result.success) {
        user.context = {
          ocrError: result.error,
          state: HOMEWORK_STATES.AWAITING_QUESTION,
          ocrAttempts: (user.context?.ocrAttempts || 0) + 1,
        };

        return reply(res, {
          message:
            "📸 **Image processing failed.** Please try typing your question instead.",
          status: "error",
          echo: "📸 **Image processing failed.** Please try typing your question instead.",
        });
      }

      const extractedText = result.text;
      const confidence = result.confidence;

      console.log(
        `OCR confidence: ${confidence.toFixed(2)}, text length: ${
          extractedText.length
        }`
      );

      if (confidence < 0.6) {
        user.context = {
          extractedText,
          partialConfidence: confidence,
          state: HOMEWORK_STATES.AWAITING_QUESTION,
          ocrAttempts: (user.context?.ocrAttempts || 0) + 1,
        };

        return reply(res, {
          message:
            "📸 **Image quality could be better!**\n\n" +
            `I detected some text but with low confidence (${(
              confidence * 100
            ).toFixed(0)}%).\n\n` +
            "Try:\n• Better lighting\n• Hold camera steady\n• Get closer to text\n\n" +
            "Or type your question directly.",
          status: "low_confidence",
          echo:
            "📸 **Image quality could be better!**\n\n" +
            `I detected some text but with low confidence (${(
              confidence * 100
            ).toFixed(0)}%).\n\n` +
            "Try:\n• Better lighting\n• Hold camera steady\n• Get closer to text\n\n" +
            "Or type your question directly.",
        });
      }

      const questions = questionDetector.detectQuestions(
        extractedText,
        confidence
      );

      user.context = {
        extractedText: extractedText,
        questions: questions,
        state:
          questions.length > 1
            ? HOMEWORK_STATES.QUESTIONS_DETECTED
            : HOMEWORK_STATES.READY_FOR_HELP,
        ocrConfidence: confidence,
        lastActivity: "image_upload",
        imageHash: result.imageHash,
        timestamp: new Date().toISOString(),
      };

      if (questions.length === 0) {
        return reply(res, {
          message:
            "📸 **I couldn't find any clear homework questions in this image.**\n\n" +
            "Could you try:\n" +
            "• Taking a clearer photo\n" +
            "• Typing your question directly\n" +
            "• Making sure it's a homework question",
          status: "no_questions",
          echo:
            "📸 **I couldn't find any clear homework questions in this image.**\n\n" +
            "Could you try:\n" +
            "• Taking a clearer photo\n" +
            "• Typing your question directly\n" +
            "• Making sure it's a homework question",
        });
      }

      if (questions.length === 1) {
        user.context.selectedQuestion = questions[0];
        user.context.state = HOMEWORK_STATES.READY_FOR_HELP;

        return reply(res, {
          message: `📚 **Found your question!**\n\n"${questions[0].text.substring(
            0,
            100
          )}..."\n\n**What specifically are you stuck on?**`,
          status: "success",
          echo: `📚 **Found your question!**\n\n"${questions[0].text.substring(
            0,
            100
          )}..."\n\n**What specifically are you stuck on?**`,
        });
      } else {
        return reply(res, {
          message: `📚 **Found ${
            questions.length
          } questions!**\n\n${this.formatQuestionList(
            questions
          )}\n\n**Which question do you need help with?** (Type the number)`,
          status: "success",
          echo: `📚 **Found ${
            questions.length
          } questions!**\n\n${this.formatQuestionList(
            questions
          )}\n\n**Which question do you need help with?** (Type the number)`,
        });
      }
    } catch (error) {
      console.error("OCR processing error:", error);

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

      return reply(res, {
        message: errorMessage,
        status: "error",
        echo: errorMessage,
      });
    }
  }

  // Broadened: include general question words, not just math
  isHomeworkQuestion(text) {
    const t = text.toLowerCase();

    const indicators = [
      // Math/problem verbs
      "solve",
      "find",
      "calculate",
      "determine",
      "evaluate",
      "area",
      "perimeter",
      "equation",
      "triangle",
      "circle",
      // General academic questions
      "what is",
      "what's",
      "define",
      "explain",
      "describe",
      "why",
      "how",
      "difference between",
      "compare",
      "discuss",
      "state",
      "identify",
      "?",
    ];

    return indicators.some((indicator) => t.includes(indicator));
  }

  classifyQuestion(text) {
    return questionDetector.classifyQuestion(text);
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
    const message =
      "📚 **Homework Help Ready!**\n\n• 📸 Upload homework image\n• 📝 Type your question\n• 💭 Tell me what you're stuck on\n\nHow can I help you get unstuck?";
    return reply(res, {
      message,
      status: "success",
      echo: message,
    });
  }

  // Intent classification
  classifyUserIntent(text) {
    const lowerText = text.toLowerCase();

    const helpTerms = [
      "help",
      "hint",
      "stuck",
      "don't understand",
      "dont understand",
      "don't know",
      "dont know",
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

    let struggleType = null;

    if (
      lowerText.includes("formula") ||
      lowerText.includes("equation") ||
      lowerText.includes("don't know how to") ||
      lowerText.includes("dont know how to")
    ) {
      struggleType = "formula_knowledge";
    } else if (
      lowerText.includes("calculation") ||
      lowerText.includes("compute") ||
      lowerText.includes("arithmetic")
    ) {
      struggleType = "calculation";
    } else if (
      lowerText.includes("concept") ||
      lowerText.includes("understand") ||
      lowerText.includes("meaning") ||
      lowerText.startsWith("what is") ||
      lowerText.startsWith("define")
    ) {
      struggleType = "conceptual";
    } else if (
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
      const struggleType = user.context.struggleType || "general";

      const hintResult = await generateHomeworkHint(
        question,
        struggle,
        struggleType
      );

      user.context.lastQuestionTypes = [
        ...(user.context.lastQuestionTypes || []),
        questionType,
      ].slice(-5);

      user.context.lastHint = {
        type: hintResult.type,
        hintProvided: hintResult.hint,
        timestamp: new Date().toISOString(),
        struggleType,
      };

      return reply(res, {
        message: `💡 **Educational Hint:**\n\n${hintResult.hint}\n\n✅ **Use this guidance to work through your problem!**`,
        status: "success",
        echo: `💡 **Educational Hint:**\n\n${hintResult.hint}\n\n✅ **Use this guidance to work through your problem!**`,
      });
    } catch (error) {
      console.error("Hint generation error:", error);

      user.context.lastHint = {
        type: "fallback",
        timestamp: new Date().toISOString(),
        error: error.message,
      };

      return reply(res, {
        message: `💡 **General Approach:**\n\n1. **Identify** what you need to find\n2. **List** what information you have\n3. **Choose** the right formula or method\n4. **Work** step by step\n\n🔍 **Check your textbook** for similar examples!`,
        status: "success",
        echo: `💡 **General Approach:**\n\n1. **Identify** what you need to find\n2. **List** what information you have\n3. **Choose** the right formula or method\n4. **Work** step by step\n\n🔍 **Check your textbook** for similar examples!`,
      });
    }
  }
}

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
}, 60 * 60 * 1000).unref();

module.exports = {
  ConsolidatedHomeworkHelp,
  HOMEWORK_STATES,
};
