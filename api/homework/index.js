/**
 * Homework Help Main Controller
 * GOAT Bot 2.0 - Phase 4 Integration
 * User: sophoniagoat
 * Created: 2025-08-22 09:31:22 UTC
 * Location: /api/homework/index.js
 */

const { homeworkOCR } = require("./core");
const { questionDetector } = require("./question-detector");
const { homeworkIntelligence } = require("./intelligence");
const { painpointAnalyzer } = require("./painpoint");
const { quickHintGenerator } = require("./hints");
const { integrityValidator } = require("./integrity");
const { hintDeliverySystem } = require("./hint-delivery");
const { workflowManager } = require("./workflow");

// Homework Intelligence States
const HW_INTEL_STATES = {
  AWAITING_UPLOAD: "hw_awaiting_upload",
  IMAGE_PROCESSING: "hw_image_processing",
  LOW_CONFIDENCE_RETRY: "hw_low_confidence_retry",
  TEXT_INPUT_MODE: "hw_text_input_mode",
  QUESTION_SELECTION: "hw_question_selection",
  PAINPOINT_EXCAVATION: "hw_painpoint_excavation",
  PAINPOINT_CONFIRMATION: "hw_painpoint_confirmation",
  HINT_GENERATION: "hw_hint_generation",
  HINT_DELIVERED: "hw_hint_delivered",
  INTELLIGENCE_FAILED: "hw_intelligence_failed",
};

class HomeworkHelpController {
  constructor() {
    this.sessionMetrics = {
      totalSessions: 0,
      successfulHints: 0,
      averageSessionTime: [],
      userRetention: 0,
    };
  }

  async handleHomeworkRequest(req, res) {
    const startTime = Date.now();
    const { query, body, method } = req;
    const endpoint = query.endpoint || "main";

    console.log(`📚 Homework request: method=${method}, endpoint=${endpoint}`);

    try {
      switch (endpoint) {
        case "upload":
          return await this.handleImageUpload(req, res);
        case "text-input":
          return await this.handleTextInput(req, res);
        case "workflow":
          return await this.handleWorkflow(req, res);
        case "stats":
          return await this.handleStats(req, res);
        default:
          return await this.handleMainWorkflow(req, res);
      }
    } catch (error) {
      console.error(`❌ Homework request failed:`, error);
      return res.status(500).json({
        success: false,
        message: "Something went wrong with homework help. Please try again.",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal error",
        elapsed_ms: Date.now() - startTime,
      });
    }
  }

  async handleMainWorkflow(req, res) {
    const { psid, message, user_input, imageData } = req.body;
    const userId = psid || "anonymous";
    const text = message || user_input || "";

    console.log(
      `🔄 Main homework workflow: user=${userId}, hasImage=${!!imageData}`
    );

    // Get or create user session (this would integrate with main user state)
    const user = await this.getOrCreateUserSession(userId);

    // Process through homework workflow
    const response = await workflowManager.processHomeworkFlow(
      user,
      text,
      imageData
    );

    // Update session metrics
    this.updateSessionMetrics(
      user,
      Date.now() - Date.parse(user.context.session_start || new Date())
    );

    return res.json({
      success: true,
      message: response,
      echo: response,
      user_id: userId,
      homework_state: user.context.hw_intel_state,
      timestamp: new Date().toISOString(),
    });
  }

  async handleImageUpload(req, res) {
    const multer = require("multer");
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }).single("homework_image");

    upload(req, res, async (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Upload failed. Please try with a different image.",
          error: error.message,
        });
      }

      const userId = req.body.userId || req.body.psid || "anonymous";
      const attemptNumber = parseInt(req.body.attemptNumber) || 1;

      try {
        const ocrResult = await homeworkOCR.processHomeworkImage(
          req.file.buffer,
          userId,
          attemptNumber
        );

        if (!ocrResult.success) {
          return res.json({
            success: false,
            message:
              "Failed to process image. Please try again with better lighting.",
            confidence: 0,
            attemptNumber: attemptNumber,
          });
        }

        // Handle confidence-based responses
        if (ocrResult.confidence < 0.6) {
          if (attemptNumber >= 2) {
            return res.json({
              success: false,
              switchToTextInput: true,
              message:
                "Let's try typing your question instead for better results!",
              confidence: ocrResult.confidence,
            });
          } else {
            return res.json({
              success: false,
              needsBetterImage: true,
              message:
                "Please take a clearer photo with better lighting and hold the camera steady.",
              confidence: ocrResult.confidence,
              attemptNumber: attemptNumber,
            });
          }
        }

        // Success - detect questions
        const questions = questionDetector.detectQuestions(
          ocrResult.text,
          ocrResult.confidence
        );

        return res.json({
          success: true,
          message: `📚 Image processed successfully! Found ${questions.length} question(s).`,
          ocrResult: {
            text: ocrResult.text,
            confidence: ocrResult.confidence,
          },
          questions: questions,
          nextStep:
            questions.length > 1
              ? "question_selection"
              : "painpoint_excavation",
        });
      } catch (error) {
        console.error("OCR processing error:", error);
        return res.status(500).json({
          success: false,
          message: "Image processing failed. Please try again.",
          error: error.message,
        });
      }
    });
  }

  async handleTextInput(req, res) {
    const { userId, questionText, psid } = req.body;
    const user_id = userId || psid || "anonymous";

    if (!questionText || questionText.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide your homework question. Example: 'Find the area of a triangle with base = 8cm and height = 6cm'",
      });
    }

    try {
      // Process text as high-confidence "OCR" result
      const questions = questionDetector.detectQuestions(
        questionText.trim(),
        0.95
      );

      return res.json({
        success: true,
        message: "📝 Got your question! Let me help you get unstuck.",
        questions: questions,
        inputMethod: "text",
        nextStep:
          questions.length > 1 ? "question_selection" : "painpoint_excavation",
      });
    } catch (error) {
      console.error("Text input processing error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to process your question. Please try typing it again.",
        error: error.message,
      });
    }
  }

  async handleStats(req, res) {
    const hintStats = quickHintGenerator.getPerformanceStats();
    const integrityStats = integrityValidator.getIntegrityReport();
    const deliveryStats = hintDeliverySystem.getDeliveryStats();

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      homework_help_stats: {
        session_metrics: this.sessionMetrics,
        hint_performance: hintStats,
        academic_integrity: integrityStats,
        delivery_performance: deliveryStats,
      },
    });
  }

  async getOrCreateUserSession(userId) {
    // This would integrate with the main user state management
    // For now, creating a basic session structure
    return {
      id: userId,
      current_menu: "homework_help",
      context: {
        hw_intel_state: HW_INTEL_STATES.AWAITING_UPLOAD,
        session_start: new Date().toISOString(),
        questions_helped: 0,
        ocr_attempts: 0,
      },
      preferences: {
        device_type: "mobile",
        last_subject: null,
        last_grade: null,
      },
    };
  }

  updateSessionMetrics(user, sessionDuration) {
    this.sessionMetrics.totalSessions++;
    this.sessionMetrics.averageSessionTime.push(sessionDuration);

    if (user.context.questions_helped > 0) {
      this.sessionMetrics.successfulHints++;
    }

    // Keep only recent measurements
    if (this.sessionMetrics.averageSessionTime.length > 100) {
      this.sessionMetrics.averageSessionTime =
        this.sessionMetrics.averageSessionTime.slice(-50);
    }
  }
}

// Export main controller
const homeworkController = new HomeworkHelpController();

module.exports = async (req, res) => {
  return await homeworkController.handleHomeworkRequest(req, res);
};

// Export components for external use
module.exports.HW_INTEL_STATES = HW_INTEL_STATES;
module.exports.homeworkController = homeworkController;
