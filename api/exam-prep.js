// api/exam-prep.js (COMPLETE REPLACEMENT)
/**
 * Exam Preparation API Endpoint - Image Intelligence Mode
 * GOAT Bot 2.0
 * Updated: 2025-08-27 11:28:00 UTC
 * Developer: DithetoMokgabudi
 * Changes:
 *  - Image-first intelligence with AI question generation (CAPS-aligned)
 *  - Stronger, more actionable psychological report
 *  - Deterministic practice question generation with robust fallbacks
 */

const stateModule = require("../lib/core/state");
const userStates = stateModule.userStates;
const trackManyState = stateModule.trackManyState;
const {
  persistUserState,
  retrieveUserState,
  getOrCreateUserState,
  trackAnalytics,
} = stateModule;
const { ManyCompatResponse } = require("../lib/core/responses");
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
const {
  SolutionAnalyzer,
} = require("../lib/features/exam-prep/solution-analyzer");
const {
  AdaptiveDifficulty,
} = require("../lib/features/exam-prep/adaptive-progression");
const {
  generateExamQuestions,
  generateFallbackQuestion,
} = require("../lib/features/exam-prep/questions");
const analyticsModule = require("../lib/utils/analytics");
const { detectDeviceType } = require("../lib/utils/device-detection");

// Initialize components
const imageIntelligence = new ExamPrepImageIntelligence();
const psychReportGenerator = new PsychologicalReportGenerator();
const foundationDetector = new FoundationGapDetector();
const solutionAnalyzer = new SolutionAnalyzer();
const adaptiveDifficulty = new AdaptiveDifficulty();

module.exports = async (req, res) => {
  try {
    const manyCompatRes = new ManyCompatResponse(res);
    const subscriberId =
      req.body.psid || req.body.subscriber_id || "default_user";
    const message = req.body.message || req.body.user_input || "";
    const userAgent = req.headers["user-agent"] || "";
    const sessionId = req.body.session_id || `sess_${Date.now()}`;

    console.log(
      `🖼️ Image-first exam prep request from ${subscriberId}: "${message}"`
    );

    // Retrieve user state with persistence
    let user = await getOrCreateUserState(subscriberId);

    // Update device detection if not already set
    if (!user.preferences.device_type) {
      user.preferences.device_type = detectDeviceType(userAgent);
    }

    // Ensure exam context
    if (!user.current_menu || user.current_menu === "welcome") {
      user.current_menu = "exam_prep_conversation";
    }
    user.context = user.context || {};

    // Track menu position on entry
    trackManyState(subscriberId, {
      type: "exam_prep_conversation",
      current_menu: "exam_prep_conversation",
    });

    // Enhanced image detection and processing
    const imageInfo = extractImageData(req);

    // PRIORITY: Handle image uploads immediately
    if (
      imageInfo &&
      (imageInfo.type === "direct" || imageInfo.type === "url")
    ) {
      console.log(`🖼️ Image detected in exam prep mode`);

      // Process through image intelligence system
      const response = await handleImageIntelligence(user, imageInfo);

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
          mode: "image_intelligence",
          has_intelligence: Boolean(user.context?.intelligence_metadata),
        },
      });
    }

    // Handle solution uploads (when user uploads their work)
    if (user.context?.interactiveMode && user.context?.currentQuestion) {
      const response = await handleSolutionUpload(user, imageInfo);

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
      });
    }

    // Handle text responses (confirmations, menu choices, etc.)
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

    // Process text-based interactions
    let response;
    if (user.context?.interactiveMode) {
      response = await handleInteractiveMode(user, message);
    } else {
      response = generateImageUploadPrompt(user);
    }

    // Store and return response
    user.conversation_history.push({
      role: "assistant",
      message: response,
      timestamp: new Date().toISOString(),
    });

    userStates.set(subscriberId, user);
    persistUserState(subscriberId, user).catch(console.error);

    // Track analytics
    analyticsModule
      .trackEvent(subscriberId, "exam_prep_interaction", {
        mode: "image_first",
        has_intelligence: Boolean(user.context?.intelligence_metadata),
        device_type: user.preferences.device_type,
      })
      .catch((err) => console.error("Analytics error:", err));

    return manyCompatRes.json({
      message: response,
      status: "success",
      debug_state: {
        menu: user.current_menu,
        mode: user.context?.interactiveMode ? "interactive" : "awaiting_image",
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

    // Build complete profile immediately (without mentioning grades)
    user.context.painpoint_profile = {
      subject: intelligence.subject,
      topic_struggles: intelligence.topic,
      specific_failure: intelligence.struggle,
    };

    // Store intelligence metadata
    user.context.intelligence_metadata = {
      confidence: {
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

    // Generate psychological report (no grade mentions)
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

    // Set interactive mode with first practice question (AI-backed)
    user.context.interactiveMode = true;
    user.context.currentQuestion = await generateFirstPracticeQuestion(
      intelligence,
      foundationGaps,
      user.id
    );

    // Track analytics
    analyticsModule
      .trackEvent(user.id, "image_intelligence_extracted", {
        subject: intelligence.subject,
        topic: intelligence.topic,
        confidence: intelligence.overallConfidence,
        foundationGapsDetected: foundationGaps.length,
      })
      .catch(console.error);

    // Combine psychological report with first practice question
    const fullResponse = `${psychReport}

**Let's start with a practice question:**

${user.context.currentQuestion.questionText}

**📝 Solve this and upload a photo of your work, or reply:**
1️⃣ 💡 I need a hint
2️⃣ 📸 Upload different problem
3️⃣ 🏠 Main Menu`;

    return fullResponse;
  } catch (error) {
    console.error("Image intelligence processing failed:", error);
    return generateFallbackImageResponse();
  }
}

// Handle solution uploads from users
async function handleSolutionUpload(user, imageInfo) {
  if (!imageInfo || !user.context?.currentQuestion) {
    return "Please upload a photo of your solution attempt.";
  }

  try {
    const analysis = await solutionAnalyzer.analyzeSolution(
      imageInfo.data,
      user.context.currentQuestion,
      user.context
    );

    // Store solution attempt
    user.context.solutionHistory = user.context.solutionHistory || [];
    user.context.solutionHistory.push({
      questionId: user.context.currentQuestion.contentId,
      analysis: analysis,
      timestamp: new Date().toISOString(),
    });

    // Generate next question based on performance
    const nextQuestion = await generateAdaptiveQuestion(analysis, user.context);
    user.context.currentQuestion = nextQuestion;

    return (
      generateSolutionFeedback(analysis) +
      `

**Next practice question:**

${nextQuestion.questionText}

**📝 Solve this and upload your work, or reply:**
1️⃣ 💡 I need a hint
2️⃣ 📸 Upload different problem
3️⃣ 🏠 Main Menu`
    );
  } catch (error) {
    console.error("Solution analysis failed:", error);
    return "I couldn't analyze your solution. Please try uploading a clearer photo of your work.";
  }
}

// Handle interactive mode text responses
async function handleInteractiveMode(user, message) {
  const text = (message || "").toLowerCase().trim();

  if (text === "1" || text.includes("hint")) {
    // Provide hint for current question
    const hint = await generateContextualHint(
      user.context.currentQuestion,
      user.context
    );
    return `💡 **Hint:** ${hint}

Now try solving it and upload your work!`;
  }

  if (text === "2" || text.includes("different")) {
    // Reset to allow new image upload
    user.context.interactiveMode = false;
    user.context.currentQuestion = null;
    return generateImageUploadPrompt(user);
  }

  if (text === "3" || text.includes("menu")) {
    // Return to main menu
    user.current_menu = "welcome";
    user.context = {};
    return `**Welcome to The GOAT.** I'm here help you study with calm and clarity.

**What do you need right now?**

1️⃣ 📅 Exam/Test Help
2️⃣ 📚 Homework Help 🫶 ⚡  
3️⃣ 🧮 Tips & Hacks

Just pick a number! ✨`;
  }

  // Default response in interactive mode
  return `I'm waiting for you to:
📝 Upload your solution attempt
💡 Ask for a hint (reply "1")
📸 Upload a different problem (reply "2")
🏠 Go to main menu (reply "3")`;
}

// Generate the initial upload prompt
function generateImageUploadPrompt(user) {
  return `📸 **Exam/Test Help is now image-only!**

Upload a clear photo of the problem you're struggling with, and I'll:
✅ Instantly understand your specific challenge  
✅ Detect any foundation gaps
✅ Create targeted practice questions
✅ Guide you through solution steps

Just upload your image to get started! 📱`;
}

// Helper functions for question generation
async function generateFirstPracticeQuestion(
  intelligence,
  foundationGaps,
  userId
) {
  // Attempt AI-generated, CAPS-aligned question first
  try {
    const profile = {
      subject: intelligence.subject || "Mathematics",
      grade: intelligence.grade || 10,
      topic_struggles: intelligence.topic || "algebra",
      specific_failure: intelligence.struggle || "solving equations",
      assessment_type: "exam practice",
    };

    const { questions } = await generateExamQuestions(profile, 1, userId);
    const q = questions && questions[0];

    if (q && q.questionText) {
      return {
        questionText: q.questionText,
        solution: q.solution || "Solution available after your attempt.",
        contentId:
          q.contentId ||
          `ai_${Date.now().toString(36)}_${Math.random()
            .toString(36)
            .slice(2, 6)}`,
        type: "ai_generated",
      };
    }
  } catch (e) {
    console.error(
      "AI question generation failed in first question:",
      e.message
    );
  }

  // If AI fails and there are foundation gaps, use foundation question
  if (foundationGaps && foundationGaps.length > 0) {
    const fqs = foundationDetector.getFoundationQuestions(
      foundationGaps.slice(0, 1)
    );
    if (fqs && fqs[0]) {
      const fq = fqs[0];
      return {
        questionText: fq.questionText,
        solution: fq.solution || "Solution available after your attempt.",
        contentId: `foundation_${Date.now()}`,
        type: "foundation",
      };
    }
  }

  // Final fallback: deterministic subject/topic-based question
  try {
    const fallback = generateFallbackQuestion({
      subject: intelligence.subject || "Mathematics",
      grade: intelligence.grade || 10,
      topic_struggles: intelligence.topic || "algebra",
      specific_failure: intelligence.struggle || "solving equations",
      assessment_type: "exam practice",
    });

    if (fallback && fallback.questionText) {
      return {
        questionText: fallback.questionText,
        solution: fallback.solution || "Solution available after your attempt.",
        contentId: `fb_${Date.now()}`,
        type: "fallback",
      };
    }
  } catch (e) {
    console.error("Fallback question generation error:", e.message);
  }

  // Absolute last resort: simple template
  return {
    questionText: `Solve: 2x + 5 = 17`,
    solution: "2x = 12 → x = 6",
    contentId: `simple_${Date.now()}`,
    type: "simple",
  };
}

async function generateAdaptiveQuestion(analysis, context) {
  // Use adaptive difficulty system
  const recommendation = adaptiveDifficulty.determineNextQuestion(
    analysis,
    context.solutionHistory,
    context.currentQuestion
  );

  // Adjust difficulty based on performance
  if (analysis.nextAction === "next_level") {
    return {
      questionText:
        "Great work! Try this slightly harder version...\nSolve: 2(x + 3) = 4x - 6",
      solution: "2x + 6 = 4x - 6 → 12 = 2x → x = 6",
      contentId: `adaptive_up_${Date.now()}`,
      type: "adaptive_up",
    };
  } else if (analysis.nextAction === "foundation_review") {
    return {
      questionText:
        "Let's strengthen the foundation first...\nSolve: x + 3 = 7",
      solution: "x = 4",
      contentId: `foundation_${Date.now()}`,
      type: "foundation_review",
    };
  }

  // Same level with variation
  return {
    questionText: "Try this similar problem...\nSolve: 3x − 7 = 2x + 5",
    solution: "x = 12",
    contentId: `same_level_${Date.now()}`,
    type: "same_level",
  };
}

function generateSolutionFeedback(analysis) {
  if (analysis.nextAction === "next_level") {
    return `🎉 **Excellent work!** 

Your method is correct and your answer is right. You're getting stronger at this!`;
  }

  if (analysis.nextAction === "method_guidance") {
    return `🎯 **Good attempt!** I can see you're trying.

The approach needs a small adjustment. Let me show you the key method for this type.`;
  }

  if (analysis.nextAction === "calculation_help") {
    return `🧮 **Almost there!** 

Your method is right. There’s a small calculation slip — let’s tidy that up and you’ll nail it.`;
  }

  return `💪 **Keep going!** 

I can see your working. Let me help you improve this step by step.`;
}

async function generateContextualHint(question, context) {
  // Generate helpful hints without giving away the answer
  const hints = [
    "Start by identifying what you know and what you need to find.",
    "Look for the pattern or formula that applies to this type of problem.",
    "Break this down into smaller, manageable steps.",
    "Remember the foundation concepts that connect to this problem.",
  ];

  return hints[Math.floor(Math.random() * hints.length)];
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
✅ Identify your specific challenge
✅ Find foundation gaps if needed
✅ Create targeted practice questions  
✅ Guide you through solutions`;
}
