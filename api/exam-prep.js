/**
 * Exam Preparation API Endpoint
 * GOAT Bot 2.0
 * Updated: 2025-08-24 14:36:00 UTC
 * Developer: DithetoMokgabudi
 */


const stateModule = require("../lib/core/state");
const userStates = stateModule.userStates;
const trackManyState = stateModule.trackManyState;
const { ManyCompatResponse } = require("../lib/core/responses");
const {
  startAIIntelligenceGathering,
} = require("../lib/features/exam-prep/intelligence");
const {
  generateExamQuestions,
} = require("../lib/features/exam-prep/questions");
const {
  formatResponseWithEnhancedSeparation,
} = require("../lib/utils/formatting");

// Update the main module.exports function
module.exports = async (req, res) => {
  try {
    const manyCompatRes = new ManyCompatResponse(res);
    const subscriberId = req.body.psid || req.body.subscriber_id || "default_user";
    const message = req.body.message || req.body.user_input || "";

    let user = userStates.get(subscriberId) || {
      id: subscriberId,
      current_menu: "exam_prep_conversation",
      context: {},
      painpoint_profile: {},
      conversation_history: [],
      preferences: {},
      last_active: new Date().toISOString(),
    };

    // Track menu position on entry
    trackManyState(subscriberId, {
      type: "exam_prep_conversation",
      current_menu: "exam_prep_conversation",
    });

    if (req.query.endpoint === "mock-exam") {
      return await handleMockExamGeneration(req, manyCompatRes);
    }

    // FIX: Handle user response based on current state
    if (user.context?.ai_intel_state) {
      const response = await processUserResponse(user, message);
      userStates.set(subscriberId, user);
      return manyCompatRes.json({ message: response, status: "success" });
    }

    // Initial entry point - start intelligence gathering
    const response = await startAIIntelligenceGathering(user);
    user.current_menu = "exam_prep_conversation";
    userStates.set(subscriberId, user);
    
    return manyCompatRes.json({
      message: response,
      status: "success",
    });
  } catch (error) {
    console.error("Exam prep error:", error);
    return res.json({
      message: "Sorry, I encountered an error with exam prep. Please try again.",
      status: "error",
      echo: "Sorry, I encountered an error with exam prep. Please try again.",
      error: error.message,
    });
  }
};
// Generate a targeted question based on user's painpoint profile
async function generateTargetedQuestion(user) {
  const profile = user.context.painpoint_profile;

  try {
    // Use our new questions module to generate a question
    const question = await generateExamQuestions(profile, 1);

    if (question.questions && question.questions.length > 0) {
      // Store the current question in user context
      user.context.current_question = question.questions[0];

      const content = `🎯 **TARGETED PRACTICE QUESTION**

**Designed for your confirmed challenge:** *${profile.specific_failure}*

📝 **Question:**
${question.questions[0].questionText}

**This question addresses exactly what you confirmed as your challenge.**`;

      const menu = `1️⃣ 📚 Solution
2️⃣ ➡️ Next Question  
3️⃣ 🔄 Switch Topics
4️⃣ 🏠 Main Menu`;

      return formatResponseWithEnhancedSeparation(
        content,
        menu,
        user.preferences.device_type
      );
    }

    throw new Error("Question generation returned no questions");
  } catch (error) {
    console.error("Question generation error:", error);

    // Fallback message
    return "Sorry, I encountered an error generating your question. Please try again.";
  }
}

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
