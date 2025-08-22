/**
 * Homework Image OCR - Phase 3.2 Enhancement
 * GOAT Bot 2.0 - SA Student Companion
 * User: sophoniagoat
 * Created: 2025-08-20 19:35:21 UTC
 */

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const { method } = req;

    if (method === "POST") {
      const { imageUrl, imageBase64, grade, subject } = req.body;

      if (!imageUrl && !imageBase64) {
        return res.status(400).json({
          error: "Missing image data",
          required: ["imageUrl OR imageBase64"],
          optional: ["grade", "subject"],
          formats: ["jpg", "png", "pdf"],
          maxSize: "10MB",
        });
      }

      // Google Vision OCR integration
      const vision = require("@google-cloud/vision");
      const client = new vision.ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });

      let ocrResult;
      try {
        const [result] = await client.textDetection({
          image: { source: { imageUri: imageUrl } },
        });

        const detections = result.textAnnotations;
        const extractedText = detections[0]?.description || "";
        const confidence = detections[0]?.confidence || 0;

        if (confidence < 0.8) {
          return res.status(200).json({
            status: "low_confidence",
            extractedText,
            confidence,
            message: "OCR confidence low. Please verify the extracted text.",
            action: "manual_review_required",
          });
        }

        ocrResult = {
          text: extractedText,
          confidence,
          status: "success",
        };
      } catch (ocrError) {
        return res.status(500).json({
          error: "OCR processing failed",
          message: ocrError.message,
          suggestion: "Try a clearer image or use text input",
        });
      }

      // Process with existing homework logic
      const OpenAI = require("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const solutionPrompt = `Analyze this homework problem extracted from an image via OCR:

Extracted Text: "${ocrResult.text}"
OCR Confidence: ${ocrResult.confidence}

Please:
1. Clean up any OCR errors in the text
2. Solve the problem step-by-step for Grade ${grade || 10} SA student
3. Generate 2 similar problems with solutions
4. Use CAPS methodology

If the OCR text is unclear, ask clarifying questions.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: solutionPrompt }],
        max_tokens: 1000,
        temperature: 0.3,
      });

      res.status(200).json({
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
        ocr: ocrResult,
        homework: {
          originalProblem: ocrResult.text,
          cleanedProblem: "AI-processed version",
          solution: response.choices[0].message.content,
          confidence: ocrResult.confidence,
        },
        metadata: {
          inputMethod: "image_ocr",
          ocrProvider: "Google Vision API",
          phase: "3.2 - Image Processing",
        },
      });
    } else {
      res.status(405).json({
        error: "Method not allowed",
        allowed: ["POST"],
        info: "Upload image for OCR processing",
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Image OCR processing failed",
      message: error.message,
    });
  }
};

