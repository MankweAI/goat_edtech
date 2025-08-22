/**
 * Complete Homework Intelligence Workflow Manager
 * Integrates all Phase 2 components
 * User: sophoniagoat
 * Created: 2025-08-22 09:22:32 UTC
 */

const { homeworkIntelligence } = require("./homework-intelligence");
const { painpointAnalyzer } = require("./homework-painpoint");
const { formatHomeworkResponse } = require("./homework-integration");

class HomeworkWorkflowManager {
  async processHomeworkFlow(user, text, imageData = null) {
    const currentState = user.context.hw_intel_state;
    const userId = user.id;

    console.log(
      `🔄 Homework workflow: user=${userId}, state=${currentState}, hasImage=${!!imageData}`
    );

    try {
      switch (currentState) {
        case "hw_question_selection":
          return await this.handleQuestionSelection(user, text);

        case "hw_painpoint_excavation":
          return await this.handlePainpointExcavation(user, text);

        case "hw_painpoint_confirmation":
          return await this.handlePainpointConfirmation(user, text);

        case "hw_intelligence_failed":
          return await this.handleIntelligenceFailure(user, text);

        default:
          console.warn(`⚠️ Unknown homework state: ${currentState}`);
          return await this.resetToQuestionSelection(user);
      }
    } catch (error) {
      console.error(
        `❌ Homework workflow error in state ${currentState}:`,
        error
      );
      return await this.handleWorkflowError(user, error);
    }
  }

  async handleQuestionSelection(user, text) {
    console.log(`🎯 Handling question selection: "${text}"`);

    return await homeworkIntelligence.handleQuestionSelectionResponse(
      user,
      text
    );
  }

  async handlePainpointExcavation(user, text) {
    console.log(
      `🔍 Handling painpoint excavation: "${text.substring(0, 50)}..."`
    );

    return await painpointAnalyzer.analyzePainpointResponse(user, text);
  }

  async handlePainpointConfirmation(user, text) {
    console.log(`✅ Handling painpoint confirmation: "${text}"`);

    const confirmationResult = this.analyzeConfirmationResponse(text);

    if (confirmationResult.confirmed) {
      // User confirmed - proceed to hint generation
      user.context.painpoint_confirmed = true;
      user.context.hw_intel_state = "hw_hint_generation";

      console.log(`✅ Painpoint confirmed by user ${user.id}`);

      const content = `🎯 **Perfect! Your challenge is confirmed.**

**Generating targeted hint** to help you get unstuck with exactly this problem...

⚡ *Give me just a moment to create the perfect hint for you!*`;

      return formatHomeworkResponse(content, user.preferences.device_type);
    } else if (confirmationResult.needsClarification) {
      // User didn't confirm - try to clarify or gather more info
      console.log(
        `🔄 User wants clarification, continuing painpoint excavation`
      );

      user.context.hw_intel_state = "hw_painpoint_excavation";
      user.context.excavation_attempt =
        (user.context.excavation_attempt || 0) + 1;

      const content = `🔍 **Let me understand better.**

You said: "${text}"

**Please be more specific about what's confusing you with this question.**

💡 *The more details you give me, the better I can help you!*`;

      return formatHomeworkResponse(content, user.preferences.device_type);
    } else {
      // Unclear response - ask for clarification
      const content = `❓ **Please clarify:**

**Type 'yes' if I understood your challenge correctly**
**Or tell me what I should focus on instead**

Your challenge: "${
        user.context.painpoint_analysis?.specific_struggle || "unclear"
      }"

💡 *I want to make sure I help you with the right thing!*`;

      return formatHomeworkResponse(content, user.preferences.device_type);
    }
  }

  async handleIntelligenceFailure(user, text) {
    console.log(`😔 Handling intelligence failure response: "${text}"`);

    const response = text.toLowerCase().trim();

    if (response.includes("try again") || response.includes("retry")) {
      // User wants to try again - reset intelligence
      console.log(`🔄 User wants to retry intelligence gathering`);

      user.context.hw_intel_state = "hw_painpoint_excavation";
      user.context.excavation_attempt = 1;
      user.context.intelligence_attempts = 0;

      // Clear previous attempts
      painpointAnalyzer.painpointHistory.delete(user.id);

      const content = `🔄 **Let's try again with a fresh approach!**

Looking at your homework question again...

**What specific part of this problem is causing you trouble?**

🎯 *Try to be as specific as possible about what's confusing you.*`;

      return formatHomeworkResponse(content, user.preferences.device_type);
    } else if (response.includes("menu")) {
      // Return to main menu
      return `🏠 **Returning to main menu...**

No worries! I'm here whenever you need help.

Type a number to choose:
1️⃣ 📅 Exam/Test Prep
2️⃣ 📚 Homework Help  
3️⃣ 🧮 Tips & Hacks`;
    } else {
      // Provide additional support resources
      const content = `💪 **I understand homework can be frustrating!**

**Here are some great resources that might help:**

📖 **Khan Academy** - Free video lessons for your topic
🎥 **YouTube** - Search for your specific problem type  
📚 **Your textbook** - Check for similar example problems
👥 **Study groups** - Classmates often have great insights
🎓 **Office hours** - Your teacher's best advice is personalized

**Want to try something else?**
• Type "menu" for main options
• Type "try again" to restart homework help`;

      return formatHomeworkResponse(content, user.preferences.device_type);
    }
  }

  analyzeConfirmationResponse(response) {
    const text = response.toLowerCase().trim();

    // Strong confirmation indicators
    const confirmationWords = [
      "yes",
      "correct",
      "right",
      "exactly",
      "that's it",
      "perfect",
      "true",
      "yep",
      "yeah",
      "ok",
      "okay",
    ];

    // Strong denial indicators
    const denialWords = [
      "no",
      "not right",
      "wrong",
      "not exactly",
      "not really",
      "misunderstood",
      "not correct",
      "nope",
      "incorrect",
    ];

    const hasConfirmation = confirmationWords.some((word) =>
      text.includes(word)
    );
    const hasDenial = denialWords.some((word) => text.includes(word));

    if (hasConfirmation && !hasDenial) {
      return { confirmed: true, needsClarification: false };
    }

    if (hasDenial) {
      return { confirmed: false, needsClarification: true };
    }

    // Ambiguous response
    return { confirmed: false, needsClarification: true };
  }

  async resetToQuestionSelection(user) {
    console.log(`🔄 Resetting user ${user.id} to question selection`);

    if (
      user.context.available_questions &&
      user.context.available_questions.length > 1
    ) {
      user.context.hw_intel_state = "hw_question_selection";
      return await homeworkIntelligence.handleQuestionSelection(
        user,
        user.context.available_questions
      );
    } else {
      // Single question - go straight to painpoint excavation
      user.context.hw_intel_state = "hw_painpoint_excavation";
      const question =
        user.context.available_questions?.[0] || user.context.selected_question;
      return await homeworkIntelligence.startPainpointExcavation(
        user,
        question
      );
    }
  }

  async handleWorkflowError(user, error) {
    console.error(`💥 Workflow error for user ${user.id}:`, error);

    const content = `🔧 **Something went wrong, but don't worry!**

Let's start fresh with your homework question.

**What question are you stuck on?** You can:
• Upload a new image of your homework
• Type out the specific question
• Tell me what type of problem it is

💪 *I'm here to help you get unstuck!*`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }
}

// Export singleton
const workflowManager = new HomeworkWorkflowManager();
module.exports = { workflowManager };

