// api/exam-prep.js (Major modifications for image handling)
const stateModule = require("../lib/core/state");
const userStates = stateModule.userStates;
const trackManyState = stateModule.trackManyState;
const {
  persistUserState,
  retrieveUserState,
  getOrCreateUserState,
  trackAnalytics,
  AI_INTEL_STATES,
} = stateModule;
const { ManyCompatResponse } = require("../lib/core/responses");
const {
  startAIIntelligenceGathering,
  processUserResponse,
} = require("../lib/features/exam-prep/intelligence");
const { extractImageData } = require("../lib/core/commands");
const {
  ExamPrepImageIntelligence,
} = require("../lib/features/exam-prep/image-intelligence");
const {
  PsychologicalReportGenerator,
} = require("../lib/features/exam-prep/psychological-report");
const {
  FoundationGapDetector,
} = require("../lib/features/exam-prep/foundation-mapper");
const analyticsModule = require("../lib/utils/analytics");

// Initialize components
const imageIntelligence = new ExamPrepImageIntelligence();
const psychReportGenerator = new PsychologicalReportGenerator();
const foundationDetector = new FoundationGapDetector();

// api/index.js (FIXED VERSION)
/**
 * Default API Entry Point
 * GOAT Bot 2.0
 * Updated: 2025-08-27 12:05:00 UTC
 * Developer: DithetoMokgabudi
 * Fix: Added ManyChat-required echo field
 */

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  
  const response = {
    status: "OK",
    message: "GOAT Bot 2.0 API is running",
    echo: "GOAT Bot 2.0 API is running", // ManyChat requires this field
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      monitor: "/api/monitor", 
      exam_prep: "/api/exam-prep",
      homework: "/api/homework",
      memory_hacks: "/api/memory-hacks"
    },
    version: "2.0.0"
  };

  res.status(200).json(response);
};
// NEW: Handle image intelligence processing
async function handleImageIntelligence(user, imageInfo) {
  try {
    const imageData = imageInfo.data;

    // Extract complete intelligence from image
    const result = await imageIntelligence.extractIntelligenceFromImage(
      imageData,
      user.id
    );

    if (!result.success) {
      return generateImageProcessingError(result.error);
    }

    const intelligence = result.intelligence;

    // Build complete profile immediately
    user.context.painpoint_profile = {
      assessment_type: "test", // Default assumption
      grade: intelligence.grade,
      subject: intelligence.subject,
      topic_struggles: intelligence.topic,
      specific_failure: intelligence.struggle,
    };

    // Store intelligence metadata
    user.context.intelligence_metadata = {
      confidence: {
        grade: intelligence.gradeConfidence,
        subject: intelligence.subjectConfidence,
        topic: intelligence.topicConfidence,
        struggle: intelligence.struggleConfidence,
        overall: intelligence.overallConfidence,
      },
      foundationGaps: intelligence.foundationGaps,
      relatedStruggles: intelligence.relatedStruggles,
      userConfidence: intelligence.confidenceLevel,
      extractedText: result.extractedText,
      imageHash: result.imageHash,
    };

    // Generate psychological report with intelligence analysis
    const psychReport = psychReportGenerator.generateReport(intelligence, {
      extractedText: result.extractedText,
      confidence: result.confidence,
    });

    // Detect foundation gaps
    const foundationGaps = foundationDetector.detectFoundationGaps(
      intelligence.topic,
      intelligence.grade,
      intelligence.struggle
    );

    // Store foundation gaps for later use
    user.context.foundationGaps = foundationGaps;

    // Set state for interactive solution mode
    user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION;
    user.context.painpoint_confirmed = false;

    // Track analytics
    analyticsModule
      .trackEvent(user.id, "image_intelligence_extracted", {
        subject: intelligence.subject,
        grade: intelligence.grade,
        topic: intelligence.topic,
        confidence: intelligence.overallConfidence,
        foundationGapsDetected: foundationGaps.length,
      })
      .catch(console.error);

    return psychReport;
  } catch (error) {
    console.error("Image intelligence processing failed:", error);
    return generateFallbackImageResponse();
  }
}

function generateImageProcessingError(error) {
  return `📸 **Image processing challenge**

I couldn't clearly read your problem. Please try:
• Better lighting
• Hold camera steady  
• Fill the frame with the problem
• Use clear, dark writing

📱 Upload a clearer image to continue.`;
}

function generateFallbackImageResponse() {
  return `📸 **Let's try again**

I can see you uploaded an image but couldn't extract the problem details.

Please upload a clear photo of a specific problem you're struggling with, and I'll:
✅ Identify the grade level and topic
✅ Find your specific challenge
✅ Create targeted practice questions  
✅ Build up from foundations if needed`;
}
