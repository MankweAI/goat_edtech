/**
 * Homework Image Processing & OCR
 * GOAT Bot 2.0
 * Updated: 2025-08-24 10:42:00 UTC
 * Developer: DithetoMokgabudi
 */

const vision = require("@google-cloud/vision");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// OCR Result caching system
const ocrCache = new Map(); // imageHash -> OCR result
const OCR_CACHE_MAX_SIZE = 100; // Limit cache size
const OCR_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize Vision API (robust env handling for serverless)
let visionClient = null;

function isRunningOnGCP() {
  return Boolean(
    process.env.K_SERVICE || // Cloud Run
      process.env.GAE_ENV || // App Engine
      process.env.GOOGLE_CLOUD_PROJECT || // GCP project env
      process.env.GCE_METADATA_HOST // GCE metadata present
  );
}

function parseCredentialsFromEnv() {
  const {
    GOOGLE_VISION_CREDENTIALS_BASE64,
    GOOGLE_APPLICATION_CREDENTIALS_JSON,
    GOOGLE_APPLICATION_CREDENTIALS,
    GCP_CREDS_JSON,
  } = process.env;

  // 1) Base64-encoded JSON
  if (GOOGLE_VISION_CREDENTIALS_BASE64) {
    try {
      const json = Buffer.from(
        GOOGLE_VISION_CREDENTIALS_BASE64,
        "base64"
      ).toString("utf8");
      return JSON.parse(json);
    } catch (e) {
      console.error("❌ Failed to parse GOOGLE_VISION_CREDENTIALS_BASE64:", e);
    }
  }

  // 2) Raw JSON string
  if (GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      return JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } catch (e) {
      console.error(
        "❌ Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:",
        e
      );
    }
  }

  // 3) Alternate raw JSON var
  if (GCP_CREDS_JSON) {
    try {
      return JSON.parse(GCP_CREDS_JSON);
    } catch (e) {
      console.error("❌ Failed to parse GCP_CREDS_JSON:", e);
    }
  }

  // 4) GOOGLE_APPLICATION_CREDENTIALS can be a file path or raw JSON
  if (GOOGLE_APPLICATION_CREDENTIALS) {
    const gac = GOOGLE_APPLICATION_CREDENTIALS.trim();

    // If it looks like JSON, parse it
    if (gac.startsWith("{")) {
      try {
        return JSON.parse(gac);
      } catch (e) {
        console.error("❌ Failed to parse GOOGLE_APPLICATION_CREDENTIALS:", e);
      }
    }

    // Otherwise treat it as a file path
    const filePath = path.isAbsolute(gac) ? gac : path.join(process.cwd(), gac);

    if (fs.existsSync(filePath)) {
      try {
        const json = fs.readFileSync(filePath, "utf8");
        return JSON.parse(json);
      } catch (e) {
        console.error(`❌ Failed reading credentials file at ${filePath}:`, e);
      }
    } else {
      console.warn(
        `⚠️ Credentials file not found at ${filePath}. Set GOOGLE_VISION_CREDENTIALS_BASE64 or GOOGLE_APPLICATION_CREDENTIALS_JSON instead.`
      );
    }
  }

  return null;
}

function initVisionClientIfNeeded() {
  if (visionClient) return visionClient;

  try {
    const creds = parseCredentialsFromEnv();

    if (creds && creds.client_email && creds.private_key) {
      console.log("📸 Initializing Vision API with credentials from env");
      visionClient = new vision.ImageAnnotatorClient({
        credentials: {
          client_email: creds.client_email,
          private_key: creds.private_key,
        },
        projectId: creds.project_id,
      });
      console.log("✅ Vision API client initialized (env credentials)");
      return visionClient;
    }

    // If not on GCP, do not attempt ADC; force explicit credentials
    if (!isRunningOnGCP()) {
      console.error(
        "⚠️ No Vision credentials found and environment is not GCP. Skipping ADC."
      );
      visionClient = null;
      return null;
    }

    // On GCP, attempt ADC
    console.log(
      "📸 Initializing Vision API using Application Default Credentials (ADC)"
    );
    visionClient = new vision.ImageAnnotatorClient();
    console.log("✅ Vision API client initialized (ADC)");
    return visionClient;
  } catch (error) {
    console.error("❌ Vision API initialization error:", error);
    visionClient = null;
    return null;
  }
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
      if (Date.now() - cached.timestamp < OCR_CACHE_TTL) {
        console.log("📸 OCR cache hit for image:", imageHash.substring(0, 8));
        return cached.result;
      } else {
        ocrCache.delete(imageHash);
      }
    }
    return null;
  },

  // Add result to cache
  cacheResult: function (imageHash, result) {
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
      const buffer = Buffer.from(imageData, "base64");

      if (buffer.length < 100) {
        return { valid: false, reason: "Image too small or invalid" };
      }

      if (buffer.length > 5 * 1024 * 1024) {
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
    // Placeholder for future Sharp optimization
    return imageBuffer;
  },
};

// Process image with OCR
async function processHomeworkImage(imageData, userId, attempt = 0) {
  console.log(`📸 Processing homework image for user ${userId}...`);

  try {
    const client = initVisionClientIfNeeded();
    if (!client) {
      throw new Error(
        "Vision API not configured. Set GOOGLE_VISION_CREDENTIALS_BASE64 or GOOGLE_APPLICATION_CREDENTIALS_JSON."
      );
    }

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
      const ocrPromise = client.textDetection({
        image: { content: optimizedBuffer },
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("OCR processing timeout")), 15000);
      });

      const ocrResult = await Promise.race([ocrPromise, timeoutPromise]);

      const [visionResult] = Array.isArray(ocrResult) ? ocrResult : [ocrResult];

      result = visionResult;

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
  if (!visionResult?.textAnnotations?.length) return 0;

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
