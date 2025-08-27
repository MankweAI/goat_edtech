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

module.exports = async (req, res) => {
  try {
    const manyCompatRes = new ManyCompatResponse(res);
    const subscriberId =
      req.body.psid || req.body.subscriber_id || "default_user";
    const message = req.body.message || req.body.user_input || "";
    const userAgent = req.headers["user-agent"] || "";
    const sessionId = req.body.session_id || `sess_${Date.now()}`;

    console.log(
      `🔍 DEBUG - Exam-prep request from ${subscriberId}: "${message}"`
    );

    const entryTimestamp = Date.now();

    // Retrieve user state with persistence
    let user = await getOrCreateUserState(subscriberId);

    // Set default menu if not already in exam prep
    if (!user.current_menu || user.current_menu === "welcome") {
      user.current_menu = "exam_prep_conversation";
    }

    // Track menu position on entry
    trackManyState(subscriberId, {
      type: "exam_prep_conversation",
      current_menu: "exam_prep_conversation",
    });

    // NEW: Enhanced image detection and processing
    const imageInfo = extractImageData(req);

    // PRIORITY: Handle image uploads immediately
    if (
      imageInfo &&
      (imageInfo.type === "direct" || imageInfo.type === "url")
    ) {
      console.log(`🖼️ Image detected in exam prep mode`);

      // Store image data in context
      user.context.hasImage = true;
      user.context.imageData =
        imageInfo.type === "direct" ? imageInfo.data : imageInfo.data;
      user.context.imageType = imageInfo.type;

      // Process through NEW intelligence system
      const response = await handleImageIntelligence(user, imageInfo);

      // Clean up image data after processing
      delete user.context.hasImage;
      delete user.context.imageData;
      delete user.context.imageType;

      // Store response and persist state
      user.conversation_history = user.conversation_history || [];
      user.conversation_history.push({
        role: "assistant",
        message: response,
        timestamp: new Date().toISOString(),
      });

      userStates.set(subscriberId, user);
      persistUserState(subscriberId, user).catch(console.error);

      return manyCompatRes.json({
        message: response,
        status: "success",
        debug_state: {
          menu: user.current_menu,
          ai_state: user.context?.ai_intel_state,
          has_intelligence: Boolean(user.context?.intelligence_metadata),
        },
      });
    }

    // Store incoming message in conversation history
    if (message) {
      user.conversation_history = user.conversation_history || [];
      user.conversation_history.push({
        role: "user",
        message,
        timestamp: new Date().toISOString(),
      });

      // Limit history size
      if (user.conversation_history.length > 20) {
        user.conversation_history = user.conversation_history.slice(-20);
      }
    }

    // Handle user response based on current state
    let response;
    if (user.context?.ai_intel_state) {
      // Run existing FSM for text responses
      response = await processUserResponse(user, message);
    } else {
      // Initial entry point - start intelligence gathering OR provide upload prompt
      if (message && !imageInfo) {
        response = `📸 **Exam/Test Help is now image-only!**

Upload a clear photo of the problem you're struggling with, and I'll:
✅ Instantly identify what you're working on
✅ Understand your specific challenge  
✅ Create targeted practice questions
✅ Build you up from any foundation gaps

Just upload your image to get started! 📱`;
      } else {
        response = await startAIIntelligenceGathering(user);
      }
    }

    // Store bot response in conversation history
    user.conversation_history.push({
      role: "assistant",
      message: response,
      timestamp: new Date().toISOString(),
    });

    // Update user state in memory
    userStates.set(subscriberId, user);

    // Persist user state to database (don't await - fire and forget)
    persistUserState(subscriberId, user).catch((err) => {
      console.error(`❌ State persistence error for ${subscriberId}:`, err);
    });

    return manyCompatRes.json({
      message: response,
      status: "success",
      debug_state: {
        menu: user.current_menu,
        ai_state: user.context?.ai_intel_state,
      },
    });
  } catch (error) {
    console.error("Exam prep error:", error);
    return res.json({
      message:
        "Sorry, I encountered an error with exam prep. Please try again.",
      status: "error",
      echo: "Sorry, I encountered an error with exam prep. Please try again.",
      error: error.message,
    });
  }
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
