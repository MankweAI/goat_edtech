/**
 * Homework Processing Logic
 * GOAT Bot 2.0
 * Updated: 2025-08-24 13:18:00 UTC
 * Developer: DithetoMokgabudi
 */

const { processHomeworkImage, imageProcessing } = require("./image-ocr");
const { generateHomeworkHint } = require("./hint-system");
const { generateHomeworkAnswer, detectFollowUpIntent } = require("./answering");
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
  CONVERSATION: "conversation",
  FOLLOW_UP: "follow_up",
};

// ... downloadImageAsBase64, footer/reply, helpers unchanged ...

// Store conversation turn
function pushConversation(user, role, content) {
  user.context.conversation = user.context.conversation || [];
  user.context.conversation.push({ role, content });
  if (user.context.conversation.length > 12) {
    user.context.conversation = user.context.conversation.slice(-12);
  }
}

// Increment progressive explanation depth for confused/explain_more follow-ups
function maybeIncrementDepth(user, latestText) {
  const intent = detectFollowUpIntent(latestText || "");
  if (
    intent === "confused" ||
    intent === "explain_more" ||
    intent === "steps" ||
    intent === "example"
  ) {
    user.context.explain_depth = (user.context.explain_depth || 0) + 1;
    // Cap depth to 3
    if (user.context.explain_depth > 3) user.context.explain_depth = 3;
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

    try {
      let user = this.getOrCreateUser(userId);
      user.current_menu = "homework_help";

      // IMAGE PATH (unchanged) ...
      if (imageData || imageUrl) {
        // ... validation and download as before ...

        return await this.handleImageUpload(user, base64Data, res);
      }

      // TEXT FLOW
      if (text) {
        // Global nav (unchanged)
        const nav = this.detectGlobalNav(text);
        if (nav) {
          if (nav.action === "menu") {
            user.context = {};
            user.current_menu = "welcome";
            return this.reply(res, {
              message: this.getMainMenuMessage(),
              status: "success",
              echo: this.getMainMenuMessage(),
            });
          }
          if (nav.action === "switch") {
            return this.reply(res, {
              message:
                "🔄 What would you like to switch to?\n\n1️⃣ Exam/Test Prep\n2️⃣ Homework Help\n3️⃣ Memory Hacks\n\nType a number or 'menu' to go back.",
              status: "success",
              echo: "🔄 What would you like to switch to?\n\n1️⃣ Exam/Test Prep\n2️⃣ Homework Help\n3️⃣ Memory Hacks\n\nType a number or 'menu' to go back.",
            });
          }
          if (nav.action === "go_exam") {
            user.current_menu = "exam_prep_conversation";
            return this.reply(res, {
              message:
                "🎯 Switching to Exam/Test Prep. Tell me your subject and grade, or type 'menu' to go back.",
              status: "success",
              echo: "🎯 Switching to Exam/Test Prep. Tell me your subject and grade, or type 'menu' to go back.",
            });
          }
          if (nav.action === "go_memory") {
            user.current_menu = "memory_hacks_active";
            return this.reply(res, {
              message:
                "🧠 Switching to Memory Hacks. Tell me a subject/topic, or type 'menu' to go back.",
              status: "success",
              echo: "🧠 Switching to Memory Hacks. Tell me a subject/topic, or type 'menu' to go back.",
            });
          }
        }

        // Conversation follow-up: use base selectedQuestion and escalate depth for confused/explain
        if (
          user.context?.state === HOMEWORK_STATES.CONVERSATION &&
          user.context.selectedQuestion
        ) {
          maybeIncrementDepth(user, text);
          pushConversation(user, "user", text);
          const { answer } = await generateHomeworkAnswer(text, user.context);
          pushConversation(user, "assistant", answer);
          user.lastActive = new Date().toISOString();

          return this.reply(res, {
            message: answer,
            status: "success",
            echo: answer,
          });
        }

        // Selection from OCR list
        if (user.context?.state === HOMEWORK_STATES.QUESTIONS_DETECTED) {
          const questionNumber = parseInt(text);
          if (questionNumber && user.context.questions[questionNumber - 1]) {
            const selected = user.context.questions[questionNumber - 1];
            user.context.selectedQuestion = selected;
            user.context.state = HOMEWORK_STATES.CONVERSATION;
            user.context.explain_depth = 0;

            pushConversation(user, "user", selected.text);
            const { answer } = await generateHomeworkAnswer(
              selected.text,
              user.context
            );
            pushConversation(user, "assistant", answer);

            return this.reply(res, {
              message: answer,
              status: "success",
              echo: answer,
            });
          }
        }

        // New typed question → start conversation immediately
        if (this.isDirectQuestion(text) || this.isHomeworkQuestion(text)) {
          const classification = this.classifyQuestion(text);
          user.context.selectedQuestion = { text, type: classification };
          user.context.state = HOMEWORK_STATES.CONVERSATION;
          user.context.explain_depth = 0;
          user.context.lastActivity = "direct_question";
          user.context.timestamp = new Date().toISOString();

          pushConversation(user, "user", text);
          const { answer } = await generateHomeworkAnswer(text, user.context);
          pushConversation(user, "assistant", answer);

          return this.reply(res, {
            message: answer,
            status: "success",
            echo: answer,
          });
        }

        // If they say "I don't understand" outside conversation but we have a selected question, route to hint or deeper explanation
        if (user.context?.selectedQuestion) {
          const intent = this.classifyUserIntent(text);
          if (intent.isHelpRequest || intent.isStruggle) {
            // Prefer conversational deepening
            user.context.state = HOMEWORK_STATES.CONVERSATION;
            maybeIncrementDepth(user, text);
            pushConversation(user, "user", text);
            const { answer } = await generateHomeworkAnswer(text, user.context);
            pushConversation(user, "assistant", answer);

            return this.reply(res, {
              message: answer,
              status: "success",
              echo: answer,
            });
          }
        }

        // Default help prompt inside homework
        return this.reply(res, {
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
      return this.reply(res, {
        message: "Sorry, I encountered an error. Please try again.",
        status: "error",
        echo: "Sorry, I encountered an error. Please try again.",
      });
    }
  }

  async handleImageUpload(user, imageData, res) {
    try {
      const result = await processHomeworkImage(imageData, user.id);
      if (!result.success) {
        user.context = {
          ocrError: result.error,
          state: HOMEWORK_STATES.AWAITING_QUESTION,
          ocrAttempts: (user.context?.ocrAttempts || 0) + 1,
        };

        return this.reply(res, {
          message:
            "📸 **Image processing failed.** Please try typing your question instead.",
          status: "error",
          echo: "📸 **Image processing failed.** Please try typing your question instead.",
        });
      }

      const extractedText = result.text;
      const confidence = result.confidence;
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

      if (questions.length === 1) {
        const q = questions[0];
        user.context.selectedQuestion = q;
        user.context.state = HOMEWORK_STATES.CONVERSATION;
        user.context.explain_depth = 0;

        pushConversation(user, "user", q.text);
        const { answer } = await generateHomeworkAnswer(q.text, user.context);
        pushConversation(user, "assistant", answer);

        return this.reply(res, {
          message: answer,
          status: "success",
          echo: answer,
        });
      }

      if (questions.length > 1) {
        user.context.state = HOMEWORK_STATES.QUESTIONS_DETECTED;
        return this.reply(res, {
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

      user.context.state = HOMEWORK_STATES.AWAITING_QUESTION;
      return this.reply(res, {
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

      return this.reply(res, {
        message: errorMessage,
        status: "error",
        echo: errorMessage,
      });
    }
  }

  // ===== Helpers moved to class to avoid duplication across earlier versions =====
  getMainMenuMessage() {
    return `**Welcome to The GOAT.** I'm here help you study with calm and clarity.

**What do you need right now?**

1️⃣ 📅 Exam/Test coming 😰
2️⃣ 📚 Homework Help 🫶 ⚡  
3️⃣ 🧮 Tips & Hacks

Just pick a number! ✨`;
  }

  detectGlobalNav(text) {
    const t = text.trim().toLowerCase();
    if (
      t === "menu" ||
      t === "main menu" ||
      t === "back" ||
      t === "exit" ||
      t === "home"
    )
      return { action: "menu" };
    if (t.includes("switch") || t.includes("change topic"))
      return { action: "switch" };
    if (t.includes("exam")) return { action: "go_exam" };
    if (t.includes("memory")) return { action: "go_memory" };
    if (t.includes("homework")) return { action: "go_homework" };
    return null;
  }

  isDirectQuestion(text) {
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

  appendFooter(message) {
    const footer =
      "\n\n—\n🏠 Type 'menu' for Main Menu • ❓ Ask another question anytime";
    return `${message}${footer}`;
  }

  reply(res, data) {
    const payload = { ...data };
    if (payload.message) payload.message = this.appendFooter(payload.message);
    if (payload.echo) payload.echo = this.appendFooter(payload.echo);
    return res.json(payload);
  }

  sendWelcomeMessage(res) {
    const message =
      "📚 **Homework Help Ready!**\n\n• 📸 Upload homework image\n• 📝 Type your question\n• 💭 Tell me what you're stuck on\n\nHow can I help you get unstuck?";
    return this.reply(res, { message, status: "success", echo: message });
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
      return this.reply(res, { message: msg, status: "success", echo: msg });
    } catch (error) {
      console.error("Hint generation error:", error);
      const msg =
        "💡 **General Approach:**\n\n1. **Identify** what you need to find\n2. **List** what information you have\n3. **Choose** the right formula or method\n4. **Work** step by step\n\n🔍 **Check your textbook** for similar examples!";
      return this.reply(res, { message: msg, status: "success", echo: msg });
    }
  }
}

module.exports = {
  ConsolidatedHomeworkHelp,
  HOMEWORK_STATES,
};
