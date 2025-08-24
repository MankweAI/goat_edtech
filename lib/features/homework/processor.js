/**
 * Homework Processing Logic
 * GOAT Bot 2.0
 * Updated: 2025-08-24 13:35:00 UTC
 * Developer: DithetoMokgabudi
 *
 * Change: Homework is image-only. Typed questions are NOT supported.
 */

const { processHomeworkImage, imageProcessing } = require("./image-ocr");
const { generateHomeworkAnswer } = require("./answering");
const { questionDetector } = require("../../utils/question-detector");
const https = require("https");
const { URL } = require("url");

// User state management (scoped to this feature)
const userStates = new Map();

// Homework state constants
const HOMEWORK_STATES = {
  AWAITING_IMAGE: "awaiting_image",
  QUESTIONS_DETECTED: "questions_detected",
  ANSWER_READY: "answer_ready",
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

// Footer utilities
function appendFooter(message) {
  const footer =
    "\n\n—\n📸 Please upload a photo of your homework • 🏠 Type 'menu' for Main Menu";
  return `${message}${footer}`;
}

function reply(res, data) {
  const payload = { ...data };
  if (payload.message) payload.message = appendFooter(payload.message);
  if (payload.echo) payload.echo = appendFooter(payload.echo);
  return res.json(payload);
}

// Main class
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

    let user = this.getOrCreateUser(userId);
    user.current_menu = "homework_help";

    try {
      // IMAGE PATH ONLY
      if (imageData || imageUrl) {
        // FIX: define and populate base64Data before using it
        let base64Data = imageData || null;

        if (!base64Data && imageUrl) {
          try {
            base64Data = await downloadImageAsBase64(imageUrl);
          } catch (fetchErr) {
            console.error("📸 Image download error:", fetchErr);
            return reply(res, {
              message:
                "📸 I couldn't download the image from the link sent. Please resend a clearer image.",
              status: "error",
              echo: "📸 I couldn't download the image from the link sent. Please resend a clearer image.",
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
            message: `📸 **Image issue:** ${validation.reason}\n\nPlease try uploading again with a clearer image.`,
            status: "error",
            echo: `📸 **Image issue:** ${validation.reason}\n\nPlease try uploading again with a clearer image.`,
          });
        }

        return await this.handleImageUpload(user, base64Data, res);
      }

      // TEXT PATH DISABLED (except numeric selection/menu)
      if (text) {
        // Menu escape
        const t = text.toLowerCase();
        if (t === "menu" || t === "main menu" || t === "home" || t === "back") {
          user.context = {};
          user.state = HOMEWORK_STATES.AWAITING_IMAGE;
          return reply(res, {
            message: this.getMainMenuMessage(),
            status: "success",
            echo: this.getMainMenuMessage(),
          });
        }

        // If we previously detected multiple questions, allow numeric selection only
        if (user.state === HOMEWORK_STATES.QUESTIONS_DETECTED) {
          const num = parseInt(text, 10);
          const list = user.context?.questions || [];
          if (Number.isInteger(num) && list[num - 1]) {
            const selected = list[num - 1];
            user.context.selectedQuestion = selected;
            user.state = HOMEWORK_STATES.ANSWER_READY;

            // Generate immediate answer/explanation
            const { answer } = await generateHomeworkAnswer(selected.text, {
              selectedQuestion: { text: selected.text, type: selected.type },
              conversation: [],
            });

            return reply(res, {
              message: `📚 ${answer}`,
              status: "success",
              echo: `📚 ${answer}`,
            });
          }
        }

        // Otherwise, instruct to upload an image
        return reply(res, {
          message:
            "📸 Homework is image-only. Please upload a clear photo of your homework question.",
          status: "success",
          echo: "📸 Homework is image-only. Please upload a clear photo of your homework question.",
        });
      }

      // Default prompt
      return this.sendUploadPrompt(res);
    } catch (error) {
      console.error("Homework help error:", error);
      return reply(res, {
        message:
          "Sorry, I encountered an error while processing your homework. Please try again.",
        status: "error",
        echo: "Sorry, I encountered an error while processing your homework. Please try again.",
      });
    }
  }

  async handleImageUpload(user, imageData, res) {
    try {
      const result = await processHomeworkImage(imageData, user.id);

      if (!result.success) {
        user.state = HOMEWORK_STATES.AWAITING_IMAGE;
        user.context.ocrError = result.error;
        return reply(res, {
          message:
            "📸 **Image processing failed.** Please try a clearer photo (good lighting, steady camera, fill the frame).",
          status: "error",
          echo: "📸 **Image processing failed.** Please try a clearer photo (good lighting, steady camera, fill the frame).",
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
        imageHash: result.imageHash,
        timestamp: new Date().toISOString(),
      };

      if (questions.length === 0) {
        user.state = HOMEWORK_STATES.AWAITING_IMAGE;
        return reply(res, {
          message:
            "📸 I couldn't find a clear question in the image. Please retake the photo closer to the question and try again.",
          status: "no_questions",
          echo: "📸 I couldn't find a clear question in the image. Please retake the photo closer to the question and try again.",
        });
      }

      if (questions.length === 1) {
        const q = questions[0];
        user.context.selectedQuestion = q;
        user.state = HOMEWORK_STATES.ANSWER_READY;

        // Immediate explanation/answer
        const { answer } = await generateHomeworkAnswer(q.text, {
          selectedQuestion: { text: q.text, type: q.type },
          conversation: [],
        });

        return reply(res, {
          message: `📚 ${answer}`,
          status: "success",
          echo: `📚 ${answer}`,
        });
      }

      // Multiple questions -> ask for number only
      user.state = HOMEWORK_STATES.QUESTIONS_DETECTED;
      return reply(res, {
        message: `📚 **Found ${
          questions.length
        } questions!**\n\n${this.formatQuestionList(
          questions
        )}\n\nReply with the question number only.`,
        status: "success",
        echo: `📚 **Found ${
          questions.length
        } questions!**\n\n${this.formatQuestionList(
          questions
        )}\n\nReply with the question number only.`,
      });
    } catch (error) {
      console.error("OCR processing error:", error);

      user.state = HOMEWORK_STATES.AWAITING_IMAGE;
      let errorMessage =
        "📸 **Image processing failed.** Please try a clearer photo.";

      if (error.message.includes("timeout")) {
        errorMessage =
          "📸 **Image processing timed out.** Please try again with a clearer photo.";
      } else if (error.message.includes("quota")) {
        errorMessage =
          "📸 **Service temporarily busy.** Please try again in a moment.";
      } else if (error.code === 7) {
        errorMessage =
          "📸 **Vision API permission error.** Image recognition is unavailable for now.";
      }

      return reply(res, {
        message: errorMessage,
        status: "error",
        echo: errorMessage,
      });
    }
  }

  // Helpers
  getOrCreateUser(userId) {
    if (!userStates.has(userId)) {
      userStates.set(userId, {
        id: userId,
        context: {},
        state: HOMEWORK_STATES.AWAITING_IMAGE,
        lastActive: new Date().toISOString(),
      });
    }
    const user = userStates.get(userId);
    user.lastActive = new Date().toISOString();
    return user;
  }

  formatQuestionList(questions) {
    return questions
      .map((q, i) => `**${q.number || i + 1}.** ${q.text.substring(0, 60)}...`)
      .join("\n\n");
  }

  sendUploadPrompt(res) {
    const message =
      "📚 **Homework Help**\n\nPlease upload a clear photo of your homework question. Text questions are not supported.";
    return reply(res, { message, status: "success", echo: message });
  }

  getMainMenuMessage() {
    return `**Welcome to The GOAT.** I'm here help you study with calm and clarity.

**What do you need right now?**

1️⃣ 📅 Exam/Test coming 😰
2️⃣ 📚 Homework Help 🫶 ⚡  
3️⃣ 🧮 Tips & Hacks

Just pick a number! ✨`;
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
    console.log(`🧹 Cleaned up ${expiredCount} inactive homework sessions`);
  }
}, 60 * 60 * 1000).unref();

module.exports = {
  ConsolidatedHomeworkHelp,
  HOMEWORK_STATES,
};
