/**
 * Complete Homework Image Upload System
 * Enhanced with fallback handling and text input mode
 * User: sophoniagoat
 * Created: 2025-08-22 09:03:55 UTC
 */

const multer = require("multer");
const { homeworkOCR } = require("./homework-core");
const { homeworkResponses } = require("./homework-responses");
const { questionDetector } = require("../question-detector");

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Please upload JPEG, PNG, WebP, or GIF images."
        ),
        false
      );
    }
  },
});

class HomeworkUploadHandler {
  async processImageUpload(req, res) {
    const startTime = Date.now();
    const userId = req.body.userId || req.body.psid || "anonymous";

    try {
      console.log(`📤 Processing image upload for user ${userId}`);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload an image of your homework",
          needsImage: true,
        });
      }

      // Determine attempt number
      const attemptNumber = this.getAttemptNumber(req, userId);
      console.log(`📊 Upload attempt #${attemptNumber} for user ${userId}`);

      // Process image with OCR
      const ocrResult = await homeworkOCR.processHomeworkImage(
        req.file.buffer,
        userId,
        attemptNumber
      );

      if (!ocrResult.success) {
        return res.status(500).json({
          success: false,
          message:
            "Failed to process your image. Please try again with a clearer photo.",
          error: ocrResult.error,
          attemptNumber: attemptNumber,
        });
      }

      // Generate appropriate response based on confidence
      const feedback = homeworkResponses.generateOCRFeedback(ocrResult, userId);

      if (feedback.switchToTextInput) {
        // Second attempt failed - switch to text input mode
        return res.json({
          success: false,
          switchToTextInput: true,
          message: feedback.message,
          confidence: feedback.confidence,
          totalTime: Date.now() - startTime,
        });
      }

      if (feedback.needsBetterImage) {
        // First attempt failed - ask for better image
        return res.json({
          success: false,
          needsBetterImage: true,
          message: feedback.message,
          confidence: feedback.confidence,
          attemptNumber: attemptNumber,
          totalTime: Date.now() - startTime,
        });
      }

      // Success - proceed with question detection
      const questions = questionDetector.detectQuestions(
        ocrResult.text,
        ocrResult.confidence
      );

      console.log(
        `✅ Upload processed successfully: ${
          questions.length
        } questions detected in ${Date.now() - startTime}ms`
      );

      return res.json({
        success: true,
        message: feedback.message,
        ocrResult: {
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          processingTime: ocrResult.processingTime,
        },
        questions: questions,
        totalTime: Date.now() - startTime,
        nextStep:
          questions.length > 1 ? "question_selection" : "painpoint_excavation",
      });
    } catch (error) {
      console.error(`❌ Upload processing failed for user ${userId}:`, error);

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong processing your homework image. Please try again.",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
        totalTime: Date.now() - startTime,
      });
    }
  }

  getAttemptNumber(req, userId) {
    // Get attempt number from request body or determine from OCR history
    if (req.body.attemptNumber) {
      return parseInt(req.body.attemptNumber);
    }

    const history = homeworkOCR.getUserOCRHistory(userId);
    return history.length + 1;
  }

  async handleTextInputMode(req, res) {
    const startTime = Date.now();
    const userId = req.body.userId || req.body.psid || "anonymous";
    const questionText = req.body.questionText || req.body.message || "";

    console.log(
      `📝 Processing text input for user ${userId}: "${questionText.substring(
        0,
        50
      )}..."`
    );

    try {
      if (!questionText || questionText.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide your homework question text. Example: 'Find the area of a triangle with base = 8cm and height = 6cm'",
        });
      }

      // Simulate "perfect" OCR result for text input
      const textOCRResult = {
        success: true,
        text: questionText.trim(),
        confidence: 0.95, // High confidence for typed text
        processingTime: 50,
        source: "text_input",
      };

      // Detect questions in the text
      const questions = questionDetector.detectQuestions(
        textOCRResult.text,
        0.95
      );

      console.log(
        `✅ Text input processed: ${questions.length} questions detected in ${
          Date.now() - startTime
        }ms`
      );

      return res.json({
        success: true,
        message: "📝 **Got your question!** Let me help you get unstuck.",
        ocrResult: textOCRResult,
        questions: questions,
        totalTime: Date.now() - startTime,
        inputMethod: "text",
        nextStep:
          questions.length > 1 ? "question_selection" : "painpoint_excavation",
      });
    } catch (error) {
      console.error(
        `❌ Text input processing failed for user ${userId}:`,
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong processing your question. Please try typing it again.",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
        totalTime: Date.now() - startTime,
      });
    }
  }
}

// API endpoint handlers
const uploadHandler = new HomeworkUploadHandler();

// Image upload endpoint
const handleImageUpload = upload.single("homework_image");

async function homeworkImageUpload(req, res) {
  handleImageUpload(req, res, async (error) => {
    if (error) {
      console.error("Multer upload error:", error);
      return res.status(400).json({
        success: false,
        message:
          error.message || "Upload failed. Please try with a different image.",
        uploadError: true,
      });
    }

    await uploadHandler.processImageUpload(req, res);
  });
}

// Text input endpoint
async function homeworkTextInput(req, res) {
  await uploadHandler.handleTextInputMode(req, res);
}

module.exports = {
  homeworkImageUpload,
  homeworkTextInput,
  uploadHandler,
};

