/**
 * Homework Help Core Infrastructure - PHASE 1
 * GOAT Bot 2.0 - Enhanced OCR with Intelligent Fallbacks
 * User: sophoniagoat
 * Created: 2025-08-22 09:03:55 UTC
 */

const vision = require("@google-cloud/vision");

class EnhancedHomeworkOCR {
  constructor() {
    this.client = new vision.ImageAnnotatorClient({
      keyFilename:
        process.env.GOOGLE_VISION_KEY_PATH || "./google-vision-key.json",
    });
    this.ocrAttempts = new Map(); // Track user attempts
  }

  async processHomeworkImage(imageBuffer, userId, attemptNumber = 1) {
    const startTime = Date.now();
    console.log(`🔍 OCR Attempt ${attemptNumber} for user ${userId}`);

    try {
      const [result] = await this.client.textDetection({
        image: { content: imageBuffer },
      });

      const extractedText = result.fullTextAnnotation?.text || "";
      const confidence = this.calculateEnhancedConfidence(
        result,
        extractedText
      );

      // Store attempt for tracking
      this.recordOCRAttempt(userId, attemptNumber, confidence);

      const ocrResult = {
        success: true,
        text: extractedText,
        confidence: confidence,
        attemptNumber: attemptNumber,
        processingTime: Date.now() - startTime,
        blocks: result.textAnnotations,
        qualityMetrics: this.analyzeImageQuality(result),
      };

      console.log(
        `✅ OCR completed: ${confidence.toFixed(2)} confidence in ${
          ocrResult.processingTime
        }ms`
      );
      return ocrResult;
    } catch (error) {
      console.error(
        `❌ OCR processing failed (attempt ${attemptNumber}):`,
        error
      );
      return {
        success: false,
        error: error.message,
        attemptNumber: attemptNumber,
        processingTime: Date.now() - startTime,
        confidence: 0,
      };
    }
  }

  calculateEnhancedConfidence(visionResult, text) {
    if (!visionResult.textAnnotations?.length) return 0;

    // Base confidence from Google Vision
    const annotations = visionResult.textAnnotations.slice(1);
    const avgConfidence =
      annotations.length > 0
        ? annotations.reduce(
            (sum, annotation) => sum + (annotation.confidence || 0.7),
            0
          ) / annotations.length
        : 0.5;

    // Text quality factors
    const textLength = text.length;
    const lengthFactor = Math.min(textLength / 50, 1.0); // Optimal around 50+ chars

    // Mathematical content detection
    const mathFactor = this.detectMathematicalContent(text) ? 1.2 : 0.9;

    // Character diversity (avoid repetitive OCR errors)
    const uniqueChars = new Set(text.toLowerCase()).size;
    const diversityFactor = Math.min(uniqueChars / 15, 1.0);

    // Readability check (avoid garbled text)
    const readabilityFactor = this.assessReadability(text);

    const finalConfidence = Math.min(
      avgConfidence *
        lengthFactor *
        mathFactor *
        diversityFactor *
        readabilityFactor,
      1.0
    );

    console.log(
      `📊 Confidence breakdown: base=${avgConfidence.toFixed(
        2
      )}, length=${lengthFactor.toFixed(2)}, math=${mathFactor.toFixed(
        2
      )}, diversity=${diversityFactor.toFixed(
        2
      )}, readability=${readabilityFactor.toFixed(
        2
      )} → final=${finalConfidence.toFixed(2)}`
    );

    return Math.max(0, finalConfidence);
  }

  detectMathematicalContent(text) {
    const mathPatterns = [
      /\d+\s*[x-z]\s*[\+\-\*\/]/i, // 3x + 2
      /[x-z]\s*[\+\-\*\/]\s*\d+/i, // x + 5
      /=\s*\d+/, // = 15
      /solve\s+for/i, // solve for
      /find\s+the/i, // find the
      /area|perimeter|volume|circumference/i, // geometry
      /sin|cos|tan|sine|cosine|tangent/i, // trigonometry
      /factor|simplify|expand/i, // algebra
      /\^\d+|²|³/, // exponents
      /√|\bsqrt\b/i, // square root
      /π|pi\b/i, // pi
      /triangle|circle|rectangle|square/i, // shapes
      /angle|degree/i, // angles
    ];

    return mathPatterns.some((pattern) => pattern.test(text));
  }

  assessReadability(text) {
    if (!text || text.length < 5) return 0.3;

    // Check for too many special characters (OCR errors)
    const specialCharRatio =
      (text.match(/[^\w\s\d\.\,\?\!\+\-\*\/\=\(\)]/g) || []).length /
      text.length;
    if (specialCharRatio > 0.3) return 0.4;

    // Check for reasonable word structure
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    const validWords = words.filter((word) =>
      /^[a-zA-Z0-9\.\,\?\!\+\-\*\/\=\(\)]+$/.test(word)
    );
    const validWordRatio = validWords.length / Math.max(words.length, 1);

    // Check for repeated characters (OCR error pattern)
    const repeatedCharPattern = /(.)\1{3,}/g;
    const hasRepeatedChars = repeatedCharPattern.test(text);

    let readabilityScore = validWordRatio;
    if (hasRepeatedChars) readabilityScore *= 0.6;

    return Math.max(0.2, Math.min(1.0, readabilityScore));
  }

  analyzeImageQuality(visionResult) {
    const annotations = visionResult.textAnnotations || [];

    return {
      textBlockCount: annotations.length,
      avgBoundingBoxSize: this.calculateAvgBoundingBoxSize(annotations),
      textDensity: this.calculateTextDensity(annotations),
      hasStructure: this.detectStructuralElements(
        visionResult.fullTextAnnotation?.text || ""
      ),
    };
  }

  calculateAvgBoundingBoxSize(annotations) {
    if (annotations.length <= 1) return 0;

    const boxes = annotations.slice(1).map((annotation) => {
      const vertices = annotation.boundingPoly?.vertices || [];
      if (vertices.length < 4) return 0;

      const width = Math.abs(vertices[1].x - vertices[0].x);
      const height = Math.abs(vertices[2].y - vertices[0].y);
      return width * height;
    });

    return boxes.reduce((sum, size) => sum + size, 0) / boxes.length;
  }

  calculateTextDensity(annotations) {
    if (annotations.length <= 1) return 0;
    return Math.min(annotations.length / 50, 1.0); // Normalize to reasonable density
  }

  detectStructuralElements(text) {
    const structurePatterns = [
      /\d+[\.\)]\s/g, // Numbered questions (1. 2. 3.)
      /[a-z][\.\)]\s/gi, // Lettered questions (a) b) c))
      /question\s+\d+/gi, // Question labels
      /problem\s+\d+/gi, // Problem labels
      /\n\s*\n/g, // Multiple line breaks
    ];

    return structurePatterns.some((pattern) => pattern.test(text));
  }

  recordOCRAttempt(userId, attemptNumber, confidence) {
    if (!this.ocrAttempts.has(userId)) {
      this.ocrAttempts.set(userId, []);
    }

    this.ocrAttempts.get(userId).push({
      attempt: attemptNumber,
      confidence: confidence,
      timestamp: new Date().toISOString(),
    });
  }

  getUserOCRHistory(userId) {
    return this.ocrAttempts.get(userId) || [];
  }

  shouldSwitchToTextInput(userId) {
    const history = this.getUserOCRHistory(userId);

    // Switch to text input if:
    // 1. Two or more failed attempts
    // 2. Both attempts had low confidence (<0.6)
    if (history.length >= 2) {
      const recentAttempts = history.slice(-2);
      const allLowConfidence = recentAttempts.every(
        (attempt) => attempt.confidence < 0.6
      );
      return allLowConfidence;
    }

    return false;
  }
}

// Export singleton instance
const homeworkOCR = new EnhancedHomeworkOCR();
module.exports = { homeworkOCR };

