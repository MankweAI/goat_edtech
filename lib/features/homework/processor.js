/**
 * Homework Processing Logic
 * GOAT Bot 2.0
 * Updated: 2025-08-24 12:45:00 UTC
 * Developer: DithetoMokgabudi
 */

const { processHomeworkImage, imageProcessing } = require("./image-ocr");
const { generateHomeworkHint } = require("./hint-system");
const { generateHomeworkAnswer } = require("./answering");
const { questionDetector } = require("../../utils/question-detector");
const https = require("https");
const { URL } = require("url");

// User state management
const userStates = new Map();

// Homework state constants
const HOMEWORK_STATES = {
  WELCOME: "welcome",
  AWAITING_QUESTION: "awaiting_question",
  QUESTIONS_DETECTED: "questions_detected",
  READY_FOR_HELP: "ready_for_help",
  PROVIDING_HINT: "providing_hint",
  CONVERSATION: "conversation", // NEW: full AI conversation mode
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

  if (
    t === "menu" ||
    t === "main menu" ||
    t === "back" ||
    t === "exit" ||
    t === "home"
  ) {
    return { action: "menu" };
  }

  if (t.includes("switch") || t.includes("change topic"))
    return { action: "switch" };
  if (t.includes("exam")) return { action: "go_exam" };
  if (t.includes("memory")) return { action: "go_memory" };
  if (t.includes("homework")) return { action: "go_homework" };

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

  return qWords || t.endsWith("?");
}

// Store conversation turn
function pushConversation(user, role, content) {
  user.context.conversation = user.context.conversation || [];
  user.context.conversation.push({ role, content });
  if (user.context.conversation.length > 12) {
    user.context.conversation = user.context.conversation.slice(-12);
  }
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
    } else {
      console.log(
        `📝 Homework processor received text: "${text.substring(0, 30)}..."`
      );
    }

    try {
      let user = this.getOrCreateUser(userId);
      user.current_menu = "homework_help";

      // Handle image path
      if (imageData || imageUrl) {
        let base64Data = imageData;
        if (!base64Data && imageUrl) {
          try {
            base64Data = await downloadImageAsBase64(imageUrl);
          } catch (err) {
            console.error("📸 Image download error:", err);
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

        const validation = imageProcessing.validateImage(base64Data);
        if (!validation.valid) {
          return reply(res, {
            message: `📸 **Image issue:** ${validation.reason}\n\nPlease try uploading again with a clearer image or type your question directly.`,
            status: "error",
            echo: `📸 **Image issue:** ${validation.reason}\n\nPlease try uploading again with a clearer image or type your question directly.`,
          });
        }

        return await this.handleImageUpload(user, base64Data, res);
      }

      // Text flow
      if (text) {
        // Global nav
        const nav = detectGlobalNav(text);
        if (nav) {
          if (nav.action === "menu") {
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
        }

        // If in conversation mode, treat as follow-up
        if (
          user.context?.state === HOMEWORK_STATES.CONVERSATION &&
          user.context.selectedQuestion
        ) {
          pushConversation(user, "user", text);
          const { answer } = await generateHomeworkAnswer(text, user.context);
          pushConversation(user, "assistant", answer);
          user.lastActive = new Date().toISOString();

          return reply(res, {
            message: answer,
            status: "success",
            echo: answer,
          });
        }

        // If user selects from detected list
        if (user.context?.state === HOMEWORK_STATES.QUESTIONS_DETECTED) {
          const questionNumber = parseInt(text);
          if (questionNumber && user.context.questions[questionNumber - 1]) {
            const selected = user.context.questions[questionNumber - 1];
            user.context.selectedQuestion = selected;
            user.context.state = HOMEWORK_STATES.CONVERSATION;

            // Start conversation with an immediate answer/explanation
            pushConversation(user, "user", selected.text);
            const { answer } = await generateHomeworkAnswer(
              selected.text,
              user.context
            );
            pushConversation(user, "assistant", answer);

            return reply(res, {
              message: answer,
              status: "success",
              echo: answer,
            });
          }
        }

        // Treat typed input as a new question → immediate answer (AI conversational)
        if (isDirectQuestion(text) || this.isHomeworkQuestion(text)) {
          const classification = this.classifyQuestion(text);
          user.context.selectedQuestion = { text, type: classification };
          user.context.state = HOMEWORK_STATES.CONVERSATION;
          user.context.lastActivity = "direct_question";
          user.context.timestamp = new Date().toISOString();

          pushConversation(user, "user", text);
          const { answer } = await generateHomeworkAnswer(text, user.context);
          pushConversation(user, "assistant", answer);

          return reply(res, {
            message: answer,
            status: "success",
            echo: answer,
          });
        }

        // If they say things like "I don't understand" and we have a selected question, provide a hint
        if (user.context?.selectedQuestion) {
          const intent = this.classifyUserIntent(text);
          if (intent.isHelpRequest || intent.isStruggle) {
            user.context.state = HOMEWORK_STATES.PROVIDING_HINT;
            const hint = await this.generateHint(user, text, res);
            return hint; // already replied
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

      // Detect questions in OCR
      const questions = questionDetector.detectQuestions(
        extractedText,
        confidence
      );

      user.context = {
        extractedText,
        questions,
        ocrConfidence: confidence,
        lastActivity: "image_upload",
        imageHash: result.imageHash,
        timestamp: new Date().toISOString(),
      };

      // If exactly one question -> answer immediately (conversational)
      if (questions.length === 1) {
        const q = questions[0];
        user.context.selectedQuestion = q;
        user.context.state = HOMEWORK_STATES.CONVERSATION;

        pushConversation(user, "user", q.text);
        const { answer } = await generateHomeworkAnswer(q.text, user.context);
        pushConversation(user, "assistant", answer);

        return reply(res, {
          message: answer,
          status: "success",
          echo: answer,
        });
      }

      if (questions.length > 1) {
        user.context.state = HOMEWORK_STATES.QUESTIONS_DETECTED;
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

      // No clear questions -> prompt user to type
      user.context.state = HOMEWORK_STATES.AWAITING_QUESTION;
      return reply(res, {
        message:
          "📸 **I couldn't find a clear question in the image.**\nTry retaking the photo or type your question directly.",
        status: "no_questions",
        echo: "📸 **I couldn't find a clear question in the image.**\nTry retaking the photo or type your question directly.",
      });
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

  // Keep isHomeworkQuestion broad
  isHomeworkQuestion(text) {
    const t = text.toLowerCase();
    const indicators = [
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
    return indicators.some((i) => t.includes(i));
  }

  classifyQuestion(text) {
    return questionDetector.classifyQuestion(text);
  }

  formatQuestionList(questions) {
    return questions
      .map((q, i) => `**${q.number || i + 1}.** ${q.text.substring(0, 60)}...`)
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
    return reply(res, { message, status: "success", echo: message });
  }

  classifyUserIntent(text) {
    const lower = text.toLowerCase();
    const isHelpRequest = [
      "help",
      "hint",
      "stuck",
      "don't understand",
      "dont understand",
      "confused",
      "not sure",
      "explain",
      "how to",
    ].some((t) => lower.includes(t));
    const isStruggle = [
      "difficult",
      "hard",
      "can't",
      "cannot",
      "struggling",
      "lost",
      "trouble",
      "problem with",
      "issue with",
    ].some((t) => lower.includes(t));
    const isAnswer = [
      "answer is",
      "solution is",
      "i got",
      "i think",
      "my answer",
      "equals",
      "result",
      "i found",
      "x =",
    ].some((t) => lower.includes(t));
    const isFeedback = [
      "thanks",
      "thank you",
      "got it",
      "makes sense",
      "helpful",
      "not helpful",
      "didn't help",
      "still confused",
      "better",
    ].some((t) => lower.includes(t));

    let struggleType = null;
    if (
      lower.includes("formula") ||
      lower.includes("equation") ||
      lower.includes("don't know how to") ||
      lower.includes("dont know how to")
    ) {
      struggleType = "formula_knowledge";
    } else if (
      lower.includes("calculation") ||
      lower.includes("compute") ||
      lower.includes("arithmetic")
    ) {
      struggleType = "calculation";
    } else if (
      lower.includes("concept") ||
      lower.includes("understand") ||
      lower.includes("meaning") ||
      lower.startsWith("what is") ||
      lower.startsWith("define")
    ) {
      struggleType = "conceptual";
    } else if (
      lower.includes("approach") ||
      lower.includes("method") ||
      lower.includes("strategy") ||
      lower.includes("start")
    ) {
      struggleType = "approach";
    }

    return { isHelpRequest, isStruggle, isAnswer, isFeedback, struggleType };
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
      user.context.lastHint = {
        type: hintResult.type,
        hintProvided: hintResult.hint,
        timestamp: new Date().toISOString(),
        struggleType,
      };

      const msg = `💡 **Educational Hint:**\n\n${hintResult.hint}\n\n✅ **Use this guidance to work through your problem!**`;
      return reply(res, { message: msg, status: "success", echo: msg });
    } catch (error) {
      console.error("Hint generation error:", error);
      const msg =
        "💡 **General Approach:**\n\n1. **Identify** what you need to find\n2. **List** what information you have\n3. **Choose** the right formula or method\n4. **Work** step by step\n\n🔍 **Check your textbook** for similar examples!";
      return reply(res, { message: msg, status: "success", echo: msg });
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
