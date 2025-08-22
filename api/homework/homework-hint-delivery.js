/**
 * Complete Homework Hint Delivery System
 * Integrates generation, validation, and user interaction
 * User: sophoniagoat
 * Created: 2025-08-22 09:26:32 UTC
 */

const { quickHintGenerator } = require("./homework-hints");
const { integrityValidator } = require("./homework-integrity");
const { formatHomeworkResponse } = require("./homework-integration");

class HomeworkHintDeliverySystem {
  constructor() {
    this.deliveryMetrics = {
      hintsDelivered: 0,
      averageDeliveryTime: [],
      userSatisfaction: [],
      successfulApplications: 0,
    };
  }

  async deliverHomeworkHint(user) {
    const startTime = Date.now();
    const userId = user.id;

    console.log(`🚀 Delivering homework hint for user ${userId}`);

    try {
      // Validate user state
      if (!this.validateUserReadyForHint(user)) {
        return await this.handleInvalidState(user);
      }

      // Generate quick hint
      const hint = await quickHintGenerator.generateQuickHint(user);

      // Validate academic integrity
      const integrity = integrityValidator.validateHintIntegrity(
        hint.content || hint,
        user.context.selected_question
      );

      // Use safeguarded hint if needed
      const finalHint = integrity.isValid ? hint : integrity.safeguardedHint;

      // Format and deliver response
      const response = this.formatHintDelivery(user, finalHint, integrity);

      // Record delivery metrics
      const deliveryTime = Date.now() - startTime;
      this.recordDeliveryMetrics(deliveryTime, integrity);

      console.log(`✅ Hint delivered successfully in ${deliveryTime}ms`);
      return response;
    } catch (error) {
      console.error(`❌ Hint delivery failed for user ${userId}:`, error);
      return await this.handleDeliveryError(user, error);
    }
  }

  validateUserReadyForHint(user) {
    const requiredContext = [
      "selected_question",
      "painpoint_confirmed",
      "painpoint_analysis",
    ];

    return requiredContext.every((key) => user.context[key]);
  }

  formatHintDelivery(user, hint, integrity) {
    const selectedQuestion = user.context.selected_question;
    const painpoint = user.context.painpoint_analysis.specific_struggle;

    // Update user state
    user.context.hw_intel_state = "hw_hint_delivered";
    user.context.hint_delivered = {
      content: hint,
      integrity: integrity,
      timestamp: new Date().toISOString(),
      question_type: selectedQuestion.type,
      painpoint: painpoint,
    };

    // Create hint display
    const hintDisplay = this.createHintDisplay(
      hint,
      selectedQuestion,
      integrity
    );

    // Add next steps
    const nextSteps = this.generateNextSteps(selectedQuestion);

    const content = `${hintDisplay}

${nextSteps}`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  createHintDisplay(hint, selectedQuestion, integrity) {
    const questionNumber = selectedQuestion.number;
    const confidenceLevel = this.getConfidenceLevel(hint.confidence);
    const integrityBadge =
      integrity.safeguardsApplied?.length > 0 ? "🛡️" : "✅";

    let display = `💡 **Quick Hint for Question ${questionNumber}** ${integrityBadge}${confidenceLevel}

**Method:** ${hint.hint}`;

    if (hint.example && !hint.example.includes("[calculate this]")) {
      display += `

**Example:** ${hint.example}`;
    }

    if (integrity.safeguardsApplied?.length > 0) {
      display += `

🎓 *Academic integrity safeguards applied - learn the method, then apply it yourself!*`;
    }

    return display;
  }

  getConfidenceLevel(confidence) {
    if (confidence >= 0.9) return " ⚡";
    if (confidence >= 0.8) return " 🎯";
    if (confidence >= 0.7) return " 👍";
    return " 📚";
  }

  generateNextSteps(selectedQuestion) {
    return `⚡ **Next Steps:**
1. **Apply this method** to your homework question
2. **Work through the calculation** step by step
3. **Check your answer** makes sense

🆘 **Still stuck?** Say "more help"
🔄 **Another question?** Say "next question"
🏠 **All done?** Say "menu"`;
  }

  async handlePostHintInteraction(user, userResponse) {
    const response = userResponse.toLowerCase().trim();

    console.log(`💬 Post-hint interaction: "${response}"`);

    // Track user satisfaction
    const satisfaction = this.analyzeSatisfaction(response);
    this.recordSatisfaction(satisfaction);

    if (this.isSuccessResponse(response)) {
      return await this.handleSuccessfulApplication(user, response);
    } else if (this.isNeedsMoreHelp(response)) {
      return await this.handleNeedsMoreHelp(user);
    } else if (this.isNextQuestionRequest(response)) {
      return await this.handleNextQuestion(user);
    } else if (response.includes("menu")) {
      return await this.handleReturnToMenu(user);
    } else {
      return await this.handleUnclearResponse(user, response);
    }
  }

  isSuccessResponse(response) {
    const successIndicators = [
      "got it",
      "thanks",
      "that helped",
      "perfect",
      "makes sense",
      "i understand",
      "clear",
      "helpful",
      "worked",
      "solved it",
    ];
    return successIndicators.some((indicator) => response.includes(indicator));
  }

  isNeedsMoreHelp(response) {
    const helpIndicators = [
      "more help",
      "still stuck",
      "don't get it",
      "confused",
      "doesn't work",
      "still don't understand",
      "need help",
    ];
    return helpIndicators.some((indicator) => response.includes(indicator));
  }

  isNextQuestionRequest(response) {
    const nextIndicators = [
      "next question",
      "another question",
      "next problem",
      "different question",
      "question",
      "next",
    ];
    return nextIndicators.some((indicator) => response.includes(indicator));
  }

  async handleSuccessfulApplication(user, response) {
    this.deliveryMetrics.successfulApplications++;
    user.context.questions_helped = (user.context.questions_helped || 0) + 1;

    console.log(`✅ Successful application recorded for user ${user.id}`);

    const content = `🎉 **Awesome! You got it!**

That's ${user.context.questions_helped} question(s) you've tackled today.

**Ready for more homework help?**
• Upload another homework image
• Ask about a different question
• Try Menu Option 1 for exam practice

**Keep up the great work!** 💪`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  async handleNeedsMoreHelp(user) {
    console.log(`🆘 User needs additional help: ${user.id}`);

    const selectedQuestion = user.context.selected_question;
    const questionType = selectedQuestion.type;

    // Provide a more detailed explanation
    const extendedHelp = this.generateExtendedHelp(questionType);

    const content = `🆘 **Let me try a different approach:**

${extendedHelp}

**If you're still stuck:**
• Ask your teacher for personalized help
• Check your textbook for similar examples  
• Try breaking the problem into smaller steps
• Study with a classmate

**Want to try a different question?** Say "next question"`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  generateExtendedHelp(questionType) {
    const extendedHelp = {
      linear_equation: `**Linear equations step by step:**
1. **Identify** what you're solving for (usually x)
2. **Move** all x terms to one side
3. **Move** all numbers to the other side  
4. **Divide** both sides by the coefficient of x`,

      triangle_area: `**Triangle area step by step:**
1. **Identify** the base and height measurements
2. **Remember** Area = ½ × base × height
3. **Substitute** your numbers into the formula
4. **Calculate** step by step: multiply first, then divide by 2`,

      quadratic_equation: `**Quadratic equations approach:**
1. **Try factoring** first (faster if it works)
2. **Look for** two numbers that multiply to c and add to b
3. **If factoring fails,** use the quadratic formula
4. **Check** your answer by substituting back`,

      circle_area: `**Circle area step by step:**
1. **Identify** the radius (half the diameter)
2. **Remember** Area = π × radius²
3. **Square** the radius first
4. **Multiply** by π (≈ 3.14 or leave as π)`,

      factoring: `**Factoring approach:**
1. **Look for** common factors first
2. **List** all factor pairs of the constant term
3. **Test** which pair adds up to the middle coefficient
4. **Write** as (x + first number)(x + second number)`,

      trigonometry: `**Trigonometry step by step:**
1. **Identify** which sides you know (opposite, adjacent, hypotenuse)
2. **Choose** the right ratio: SOH-CAH-TOA
3. **Set up** the equation with your known values
4. **Solve** for the unknown (might need inverse functions)`,
    };

    return (
      extendedHelp[questionType] ||
      `**General problem-solving:**
1. **Read** the question carefully twice
2. **Identify** what you need to find
3. **List** what information you're given
4. **Choose** the appropriate method or formula
5. **Work** step by step, checking each calculation`
    );
  }

  async handleNextQuestion(user) {
    console.log(`🔄 User requesting next question: ${user.id}`);

    user.context.questions_helped = (user.context.questions_helped || 0) + 1;

    // Check if we have more questions from the original homework
    if (
      user.context.available_questions &&
      user.context.available_questions.length > 1
    ) {
      const remainingQuestions = user.context.available_questions.filter(
        (q) => q.number !== user.context.selected_question?.number
      );

      if (remainingQuestions.length > 0) {
        user.context.hw_intel_state = "hw_question_selection";

        const questionList = remainingQuestions
          .map((q) => `**${q.number}.** ${q.text.substring(0, 60)}...`)
          .join("\n\n");

        const content = `🔄 **Ready for the next question!**

**Remaining questions:**
${questionList}

**Which question do you need help with?** *(Type the number)*`;

        return formatHomeworkResponse(content, user.preferences.device_type);
      }
    }

    // No more questions - offer new homework upload
    user.context.hw_intel_state = "hw_awaiting_upload";

    const content = `🔄 **Ready for more homework help!**

You've completed ${user.context.questions_helped} question(s) - great progress!

**For your next homework question:**
• 📸 Upload a new homework image
• 📝 Type out the question directly

**Or explore other options:**
• Menu Option 1 for exam practice
• Menu Option 3 for study tips`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  async handleReturnToMenu(user) {
    const questionsHelped = user.context.questions_helped || 0;

    user.current_menu = "welcome";
    user.context = {}; // Reset homework context

    return `🏠 **Thanks for using Homework Help!**

You got unstuck on ${questionsHelped} question(s) today. 🎉

**Main Menu:**
1️⃣ 📅 Exam/Test Prep
2️⃣ 📚 Homework Help
3️⃣ 🧮 Tips & Hacks

**Choose what you need help with next!**`;
  }

  async handleUnclearResponse(user, response) {
    const content = `❓ **I didn't quite understand: "${response}"**

**You can say:**
• "got it" or "thanks" if the hint helped
• "more help" if you're still stuck
• "next question" for another problem
• "menu" to return to main options

**What would you like to do?**`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  async handleInvalidState(user) {
    console.warn(`⚠️ Invalid state for hint delivery: user ${user.id}`);

    const content = `🔧 **Let's get back on track!**

To help you with homework, I need:
• A specific question you're stuck on
• Understanding of what's confusing you

**Let's start fresh:**
📸 Upload your homework image or 📝 type your question.`;

    user.context.hw_intel_state = "hw_awaiting_upload";
    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  async handleDeliveryError(user, error) {
    console.error(`💥 Hint delivery error:`, error);

    const content = `🔧 **Something went wrong generating your hint.**

**Let me try a backup approach:**

Check your textbook for similar examples, or ask your teacher for help with this specific problem type.

**Want to try again?** Say "try again"
**Different question?** Upload a new image`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  recordDeliveryMetrics(deliveryTime, integrity) {
    this.deliveryMetrics.hintsDelivered++;
    this.deliveryMetrics.averageDeliveryTime.push(deliveryTime);

    // Keep only recent measurements
    if (this.deliveryMetrics.averageDeliveryTime.length > 50) {
      this.deliveryMetrics.averageDeliveryTime =
        this.deliveryMetrics.averageDeliveryTime.slice(-25);
    }
  }

  analyzeSatisfaction(response) {
    const positiveIndicators = [
      "got it",
      "thanks",
      "helpful",
      "perfect",
      "great",
    ];
    const negativeIndicators = ["confused", "doesn't work", "still stuck"];

    if (positiveIndicators.some((indicator) => response.includes(indicator))) {
      return 5; // High satisfaction
    } else if (
      negativeIndicators.some((indicator) => response.includes(indicator))
    ) {
      return 2; // Low satisfaction
    }
    return 3; // Neutral
  }

  recordSatisfaction(satisfaction) {
    this.deliveryMetrics.userSatisfaction.push(satisfaction);

    // Keep only recent measurements
    if (this.deliveryMetrics.userSatisfaction.length > 50) {
      this.deliveryMetrics.userSatisfaction =
        this.deliveryMetrics.userSatisfaction.slice(-25);
    }
  }

  getDeliveryStats() {
    const avgDeliveryTime =
      this.deliveryMetrics.averageDeliveryTime.length > 0
        ? this.deliveryMetrics.averageDeliveryTime.reduce((a, b) => a + b, 0) /
          this.deliveryMetrics.averageDeliveryTime.length
        : 0;

    const avgSatisfaction =
      this.deliveryMetrics.userSatisfaction.length > 0
        ? this.deliveryMetrics.userSatisfaction.reduce((a, b) => a + b, 0) /
          this.deliveryMetrics.userSatisfaction.length
        : 0;

    return {
      hintsDelivered: this.deliveryMetrics.hintsDelivered,
      avgDeliveryTimeMs: Math.round(avgDeliveryTime),
      avgSatisfactionScore: avgSatisfaction.toFixed(1),
      successRate:
        this.deliveryMetrics.hintsDelivered > 0
          ? (
              (this.deliveryMetrics.successfulApplications /
                this.deliveryMetrics.hintsDelivered) *
              100
            ).toFixed(1)
          : 0,
    };
  }
}

// Export singleton
const hintDeliverySystem = new HomeworkHintDeliverySystem();
module.exports = { hintDeliverySystem };

