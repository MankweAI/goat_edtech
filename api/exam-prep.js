/**
 * Exam Preparation API Endpoint
 * GOAT Bot 2.0
 * Updated: 2025-08-25 10:28:56 UTC
 * Developer: DithetoMokgabudi
 * Changes: Added state persistence
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
const {
  startAIIntelligenceGathering,
  processUserResponse,
} = require("../lib/features/exam-prep/intelligence");
const {
  generateExamQuestions,
} = require("../lib/features/exam-prep/questions");
const {
  formatResponseWithEnhancedSeparation,
} = require("../lib/utils/formatting");
const { detectDeviceType } = require("../lib/utils/device-detection");
const {
  sendImageViaManyChat,
  formatWithLatexImage,
} = require("../lib/utils/whatsapp-image");
const analyticsModule = require("../lib/utils/analytics");
const {
  generatePersonalizedFeedback,
} = require("../lib/features/exam-prep/personalization");


// Update the main module.exports function
module.exports = async (req, res) => {
  try {
    const manyCompatRes = new ManyCompatResponse(res);
    const subscriberId =
      req.body.psid || req.body.subscriber_id || "default_user";
    const message = req.body.message || req.body.user_input || "";
    const userAgent = req.headers["user-agent"] || "";
    const sessionId = req.body.session_id || `sess_${Date.now()}`;

    // DEBUG: Log the incoming message and existing state
    console.log(
      `🔍 DEBUG - Exam-prep request from ${subscriberId}: "${message}"`
    );
    const existingState = userStates.get(subscriberId);
    console.log(
      `🔍 DEBUG - Existing state menu: ${existingState?.current_menu || "none"}`
    );
    console.log(
      `🔍 DEBUG - Existing AI state: ${
        existingState?.context?.ai_intel_state || "none"
      }`
    );

    const entryTimestamp = Date.now();
    console.log(
      `📝 Exam prep request from ${subscriberId}: "${message?.substring(
        0,
        50
      )}${message?.length > 50 ? "..." : ""}"`
    );

    // Retrieve user state with persistence
    let user = await getOrCreateUserState(subscriberId);

    // NOW that user is initialized, we can log the updated state
    console.log(`🔍 DEBUG - Updated state menu: ${user.current_menu}`);
    console.log(`🔍 DEBUG - Updated AI state: ${user.context?.ai_intel_state}`);

    // Update device detection if not already set
    if (!user.preferences.device_type) {
      user.preferences.device_type = detectDeviceType(userAgent);
    }

    // Set default menu if not already in exam prep
    if (!user.current_menu || user.current_menu === "welcome") {
      user.current_menu = "exam_prep_conversation";
    }

    // Track menu position on entry
    trackManyState(subscriberId, {
      type: "exam_prep_conversation",
      current_menu: "exam_prep_conversation",
    });

    // NEW: More comprehensive analytics tracking
    analyticsModule
      .trackEvent(subscriberId, "exam_prep_interaction", {
        message_length: message?.length || 0,
        session_id: sessionId,
        device_type: user.preferences.device_type,
        entry_state: user.context?.ai_intel_state || "initial",
        had_context: Boolean(user.context?.painpoint_profile),
      })
      .catch((err) => console.error("Analytics error:", err));

    if (req.query.endpoint === "mock-exam") {
      return await handleMockExamGeneration(req, manyCompatRes);
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
      response = await processUserResponse(user, message);

      // Track question generation if reached that state
      if (user.context.ai_intel_state === "ai_question_generation") {
        analyticsModule
          .trackEvent(subscriberId, "exam_question_generated", {
            subject: user.context.painpoint_profile?.subject,
            grade: user.context.painpoint_profile?.grade,
            topic: user.context.painpoint_profile?.topic_struggles,
            painpoint: user.context.painpoint_profile?.specific_failure,
            elapsed_ms: Date.now() - entryTimestamp,
          })
          .catch((err) => console.error("Analytics error:", err));

        // NEW: Track the specific question content
        if (user.context.current_question?.contentId) {
          analyticsModule
            .trackEvent(subscriberId, "content_shown", {
              content_id: user.context.current_question.contentId,
              subject: user.context.painpoint_profile?.subject,
              content_type: "exam_question",
              has_latex: Boolean(user.context.current_question.hasLatex),
            })
            .catch((err) => console.error("Analytics error:", err));
        }
      }

      // Track solution viewing
      if (message === "1" || message.toLowerCase() === "solution") {
        analyticsModule
          .trackEvent(subscriberId, "solution_viewed", {
            subject: user.context.painpoint_profile?.subject,
            topic: user.context.painpoint_profile?.topic_struggles,
            content_id: user.context.current_question?.contentId,
          })
          .catch((err) => console.error("Analytics error:", err));
      }
    } else {
      // Initial entry point - start intelligence gathering
      response = await startAIIntelligenceGathering(user);

      // Track conversation start
      analyticsModule
        .trackEvent(subscriberId, "exam_prep_started", {
          session_id: sessionId,
          entry_type: "new_session",
        })
        .catch((err) => console.error("Analytics error:", err));
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

    // NEW: Add feedback collection option occasionally
    if (
      user.context?.ai_intel_state === "ai_question_generation" &&
      Math.random() < 0.2
    ) {
      // 20% chance
      response +=
        "\n\n**Was this question helpful for your exam prep? Rate 1-5**";
    }

    // NEW: Track API response time
    analyticsModule
      .trackEvent(subscriberId, "api_performance", {
        endpoint: "exam_prep",
        response_time_ms: Date.now() - entryTimestamp,
        message_length: response?.length || 0,
      })
      .catch((err) => console.error("Analytics error:", err));

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




// Handle mock exam generation endpoint
async function handleMockExamGeneration(req, res) {
  const {
    grade = 10,
    subject = "Mathematics",
    questionCount = 1,
    topics = "algebra",
    painpoint = "solving equations",
    confidence = "medium",
  } = req.query;

  try {
    // Create a mock profile for API testing
    const mockProfile = {
      grade: grade,
      subject: subject,
      topic_struggles: topics,
      specific_failure: painpoint,
      assessment_type: "test",
    };

    // Use our new questions module
    const examQuestions = await generateExamQuestions(
      mockProfile,
      parseInt(questionCount) || 1
    );

    // Format for API response
    const formattedQuestions = examQuestions.questions.map((q, index) => ({
      questionNumber: index + 1,
      questionText: q.questionText,
      solution: q.solution,
      marksAllocated: 5,
      targeted: true,
      painpoint: painpoint,
      source: q.source,
    }));

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      mockExam: formattedQuestions,
      metadata: {
        ...examQuestions.metadata,
        modularized: true,
      },
    });
  } catch (error) {
    console.error("Mock exam generation error:", error);
    return res.status(500).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      error: "Failed to generate mock exam",
      message: error.message,
    });
  }
}
