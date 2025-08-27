// api/exam-prep.js
/**
 * Exam Preparation API Endpoint - Image Intelligence Mode
 * GOAT Bot 2.0
 * Updated: 2025-08-27 13:10:00 UTC
 * Developer: DithetoMokgabudi
 *
 * Changes (Painpoint-first, no exam date, no study plans):
 * - Remove exam/test date collection and study-plan generation
 * - Do NOT generate a question until user confirms exact painpoint
 * - Add concise technical+motivational report with co‑struggles confirmation
 * - After confirmation, show a simple execution plan (not a study plan), then 1st diagnostic
 */

const stateModule = require("../lib/core/state");
const userStates = stateModule.userStates;
const trackManyState = stateModule.trackManyState;
const { persistUserState, getOrCreateUserState } = stateModule;
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

    let user = await getOrCreateUserState(subscriberId);
    if (!user.preferences.device_type) {
      user.preferences.device_type = detectDeviceType(userAgent);
    }
    if (!user.current_menu || user.current_menu === "welcome") {
      user.current_menu = "exam_prep_conversation";
    }
    user.context = user.context || {};
    trackManyState(subscriberId, {
      type: "exam_prep_conversation",
      current_menu: "exam_prep_conversation",
    });

    const imageInfo = extractImageData(req);

    // 1) Image-first processing
    if (
      imageInfo &&
      (imageInfo.type === "direct" || imageInfo.type === "url")
    ) {
      const response = await handleImageIntelligence(user, imageInfo);

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
          mode: user.context?.painpointConfirm?.awaiting
            ? "awaiting_painpoint_confirmation"
            : "image_intelligence",
        },
      });
    }

    // 2) If awaiting painpoint confirmation, handle it before anything else
    if (user.context?.painpointConfirm?.awaiting) {
      const response = await handlePainpointConfirmation(user, message);

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
          mode: user.context?.interactiveMode
            ? "interactive"
            : "awaiting_painpoint_confirmation",
        },
      });
    }

    // 3) If user is in interactive practice mode (after confirmation)
    if (user.context?.interactiveMode && user.context?.currentQuestion) {
      const response = await handleSolutionUpload(user, imageInfo);

      user.conversation_history = user.conversation_history || [];
      user.conversation_history.push({
        role: "assistant",
        message: response,
        timestamp: new Date().toISOString(),
      });

      userStates.set(subscriberId, user);
      persistUserState(subscriberId, user).catch(console.error);

      return manyCompatRes.json({ message: response, status: "success" });
    }

    // 4) Otherwise, prompt for image
    const response = generateImageUploadPrompt(user);
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
      debug_state: { menu: user.current_menu, mode: "awaiting_image" },
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

// Handle image intelligence → concise report → ask for painpoint confirmation
async function handleImageIntelligence(user, imageInfo) {
  try {
    const imageData = imageInfo.data;
    const result = await imageIntelligence.extractIntelligenceFromImage(
      imageData,
      user.id
    );
    if (!result.success) return generateImageProcessingError(result.error);

    const intelligence = result.intelligence;
    const foundationGaps = foundationDetector.detectFoundationGaps(
      intelligence.topic,
      intelligence.grade,
      intelligence.struggle
    );

    // Store meta
    user.context.painpoint_profile = {
      subject: intelligence.subject,
      topic_struggles: intelligence.topic,
      specific_failure: intelligence.struggle,
    };
    user.context.intelligence_metadata = {
      confidence: {
        subject: intelligence.subjectConfidence,
        topic: intelligence.topicConfidence,
        struggle: intelligence.struggleConfidence,
        overall: intelligence.overallConfidence,
      },
      foundationGaps,
      relatedStruggles: intelligence.relatedStruggles,
      userConfidence: intelligence.confidenceLevel,
      extractedText: result.extractedText,
      imageHash: result.imageHash,
    };

    // Build concise report (no purpose/end-goal/study plan)
    const conciseReport = psychReportGenerator.generateConciseReport(
      intelligence,
      {
        extractedText: result.extractedText,
        confidence: result.confidence,
        foundationGaps,
      }
    );

    // Build painpoint options
    const options = buildPainpointOptions(intelligence, foundationGaps);
    user.context.painpointConfirm = {
      awaiting: true,
      options, // {primary, suggestions: [A,B,C]}
      intelligence,
    };

    const confirmBlock = formatPainpointConfirmationPrompt(options);

    return `${conciseReport}\n\n${confirmBlock}`;
  } catch (error) {
    console.error("Image intelligence processing failed:", error);
    return generateFallbackImageResponse();
  }
}

// Build painpoint options from intelligence and gaps
function buildPainpointOptions(intelligence, foundationGaps = []) {
  const primary =
    (intelligence.struggle && intelligence.struggle.trim()) ||
    "method selection";
  const related = Array.from(
    new Set([...(intelligence.relatedStruggles || [])])
  ).filter(Boolean);

  const gapLabels = (foundationGaps || [])
    .slice(0, 3)
    .map((g) => g.description)
    .filter(Boolean);

  // Take up to 3 suggestions mixing related struggles and gap labels
  const suggestions = Array.from(new Set([...related, ...gapLabels]))
    .filter((s) => s && s.toLowerCase() !== primary.toLowerCase())
    .slice(0, 3);

  // Ensure we have at least some defaults
  const fallbackSuggestions = [
    "calculation slips",
    "equation setup",
    "method steps",
  ];
  while (suggestions.length < 3) {
    const f = fallbackSuggestions.shift();
    if (!f) break;
    if (f.toLowerCase() !== primary.toLowerCase()) suggestions.push(f);
  }

  return { primary, suggestions };
}

function formatPainpointConfirmationPrompt(options) {
  const [A, B, C] = options.suggestions;
  return `I think you're also struggling with:
A) ${A}
B) ${B}
C) ${C}

Am I correct?
- Reply: "yes" to confirm "${options.primary}"
- Or pick A/B/C
- Or tell me the exact part (your own words)`;
}

// Handle confirmation replies and then generate plan + first diagnostic
async function handlePainpointConfirmation(user, message = "") {
  const text = (message || "").toLowerCase().trim();
  const confirmCtx = user.context.painpointConfirm;
  const { primary, suggestions } = confirmCtx.options;

  let confirmed = null;
  if (text === "yes" || text === "y") confirmed = primary;
  else if (text === "a") confirmed = suggestions[0];
  else if (text === "b") confirmed = suggestions[1];
  else if (text === "c") confirmed = suggestions[2];
  else if (text && text.length > 1) confirmed = message.trim();

  if (!confirmed) {
    return `No stress — tell me the exact part that’s tripping you up (e.g., “moving terms” or “factoring step”).`;
  }

  // Store confirmed painpoint
  user.context.confirmed_painpoint = confirmed;
  user.context.painpointConfirm.awaiting = false;

  // “Execution plan” (not study plan)
  const plan = `Ok cool — I have a plan to get you mastering this.
Total time with me: about 7 hours.
• Phase 1 (stabilise method): 2.5h
• Phase 2 (pattern drills): 3.5h
• Phase 3 (speed + confidence): 1h

Right now, let’s test your "${confirmed}" with a quick diagnostic. Do this on paper and upload your working.`;

  // Generate first question targeted to confirmed painpoint
  const intelligence = confirmCtx.intelligence || {};
  const foundationGaps =
    user.context.intelligence_metadata?.foundationGaps || [];

  const firstQuestion = await generateFirstPracticeQuestion(
    {
      ...intelligence,
      // force profile to use confirmed painpoint
      struggle: confirmed,
    },
    foundationGaps,
    user.id
  );

  user.context.interactiveMode = true;
  user.context.currentQuestion = firstQuestion;

  return `${plan}

${firstQuestion.questionText}

📝 When done, upload a photo of your working. Or reply:
1️⃣ Hint
2️⃣ Different problem
3️⃣ Main Menu`;
}

// Analyze solution uploads
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

    user.context.solutionHistory = user.context.solutionHistory || [];
    user.context.solutionHistory.push({
      questionId: user.context.currentQuestion.contentId,
      analysis,
      timestamp: new Date().toISOString(),
    });

    const nextQuestion = await generateAdaptiveQuestion(analysis, user.context);
    user.context.currentQuestion = nextQuestion;

    return (
      generateSolutionFeedback(analysis) +
      `

Next practice question:

${nextQuestion.questionText}

📝 Upload your working, or reply:
1️⃣ Hint
2️⃣ Different problem
3️⃣ Main Menu`
    );
  } catch (error) {
    console.error("Solution analysis failed:", error);
    return "I couldn't analyze your solution. Please try uploading a clearer photo of your work.";
  }
}

// Generate the initial upload prompt
function generateImageUploadPrompt() {
  return `📸 **Exam/Test Help is image-only!**
Upload a clear photo of the problem you're struggling with. I’ll read it, pinpoint the exact painpoint, and coach you through it.`;
}

// Question generation helpers (unchanged except tailored profile)
async function generateFirstPracticeQuestion(
  intelligence,
  foundationGaps,
  userId
) {
  // Try AI first
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
    console.error("AI question generation failed:", e.message);
  }

  // If AI fails, use foundation gap question
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

  // Deterministic fallback
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

  return {
    questionText: `Solve: 2x + 5 = 17`,
    solution: "2x = 12 → x = 6",
    contentId: `simple_${Date.now()}`,
    type: "simple",
  };
}

async function generateAdaptiveQuestion(analysis, context) {
  if (analysis.nextAction === "next_level") {
    return {
      questionText: "Good — try a tougher one:\nSolve: 2(x + 3) = 4x - 6",
      solution: "2x + 6 = 4x - 6 → 12 = 2x → x = 6",
      contentId: `adaptive_up_${Date.now()}`,
      type: "adaptive_up",
    };
  } else if (analysis.nextAction === "foundation_review") {
    return {
      questionText: "Let’s reinforce the base first:\nSolve: x + 3 = 7",
      solution: "x = 4",
      contentId: `foundation_${Date.now()}`,
      type: "foundation_review",
    };
  }
  return {
    questionText: "Try this similar one:\nSolve: 3x − 7 = 2x + 5",
    solution: "x = 12",
    contentId: `same_level_${Date.now()}`,
    type: "same_level",
  };
}

function generateSolutionFeedback(analysis) {
  if (analysis.nextAction === "next_level") {
    return `🎉 Strong work — correct method and answer. Let’s level up.`;
  }
  if (analysis.nextAction === "method_guidance") {
    return `🎯 Decent attempt — the method needs a tweak. I’ll guide you.`;
  }
  if (analysis.nextAction === "calculation_help") {
    return `🧮 Almost — method is fine. Small calculation slip to fix.`;
  }
  return `💪 Keep going — we’ll sharpen this step by step.`;
}

function generateImageProcessingError() {
  return `📸 I couldn't clearly read your problem. Please retake the photo with better lighting and fill the frame.`;
}

function generateFallbackImageResponse() {
  return `📸 I saw an image but couldn’t extract the problem. Please upload a clearer photo of a specific question you’re stuck on.`;
}
