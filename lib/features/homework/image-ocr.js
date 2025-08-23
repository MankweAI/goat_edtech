/**
 * Homework Image Processing & OCR
 * GOAT Bot 2.0
 * Updated: 2025-08-23 15:39:01 UTC
 * Developer: DithetoMokgabudi
 */

const vision = require("@google-cloud/vision");
const crypto = require("crypto");

// OCR Result caching system
const ocrCache = new Map(); // imageHash -> OCR result
const OCR_CACHE_MAX_SIZE = 100; // Limit cache size
const OCR_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize Vision API
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
  visionClient = null;
}

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

// Process image with OCR
async function processHomeworkImage(imageData, userId, attempt = 0) {
  console.log(`📸 Processing homework image for user ${userId}...`);

  try {
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

      if (!visionClient) {
        throw new Error("Vision API client not initialized");
      }

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
    const confidence = calculateOCRConfidence(result);

    return {
      success: true,
      text: extractedText,
      confidence,
      result,
      imageHash,
    };
  } catch (error) {
    console.error("OCR processing error:", error);
    return {
      success: false,
      error: error.message,
      confidence: 0,
      attempt,
    };
  }
}

// Calculate OCR confidence
function calculateOCRConfidence(visionResult) {
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

module.exports = {
  processHomeworkImage,
  imageProcessing,
  calculateOCRConfidence,
};

