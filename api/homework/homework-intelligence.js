/**
 * Homework Intelligence Gathering System
 * GOAT Bot 2.0 - Phase 2 Implementation
 * User: sophoniagoat
 * Created: 2025-08-22 09:22:32 UTC
 */

const { homeworkResponses } = require("./homework-responses");
const { formatHomeworkResponse } = require("./homework-integration");

class HomeworkIntelligenceEngine {
  constructor() {
    this.intelligenceAttempts = new Map(); // Track user intelligence attempts
    this.maxIntelligenceAttempts = 3;
  }

  async handleQuestionSelection(user, questions) {
    console.log(
      `🎯 Question selection: ${questions.length} questions available for user ${user.id}`
    );

    if (questions.length === 1) {
      // Skip selection for single question
      user.context.selected_question = questions[0];
      user.context.hw_intel_state = "hw_painpoint_excavation";

      console.log(`✅ Auto-selected single question: ${questions[0].type}`);
      return await this.startPainpointExcavation(user, questions[0]);
    }

    // Multiple questions - show selection interface
    user.context.hw_intel_state = "hw_question_selection";
    user.context.available_questions = questions;
    user.context.intelligence_attempts = 0;

    const questionList = questions
      .map((q, index) => {
        const displayNumber = q.number || index + 1;
        const questionPreview = this.truncateQuestionText(q.text, 60);
        const typeIndicator = this.getTypeIndicator(q.type);

        return `**${displayNumber}.** ${questionPreview} ${typeIndicator}`;
      })
      .join("\n\n");

    const content = `📚 **I found ${questions.length} questions in your homework:**

${questionList}

**Which question are you stuck on?** *(Type the number)*

💡 *I'll help you get unstuck quickly with targeted hints!*`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  async handleQuestionSelectionResponse(user, response) {
    const questionNumber = this.parseQuestionNumber(response);
    const availableQuestions = user.context.available_questions || [];

    console.log(
      `🔍 Question selection response: "${response}" → parsed number: ${questionNumber}`
    );

    // Find matching question
    const selectedQuestion = availableQuestions.find((q) => {
      return (
        q.number === questionNumber ||
        q.number.toString() === questionNumber?.toString() ||
        availableQuestions.indexOf(q) + 1 === questionNumber
      );
    });

    if (!selectedQuestion) {
      const validNumbers = availableQuestions.map(
        (q) => q.number || availableQuestions.indexOf(q) + 1
      );

      return `❓ **I couldn't find question ${questionNumber}.**

Please type one of these numbers: ${validNumbers.join(", ")}

Or say "all" if you need help with multiple questions.`;
    }

    // Question selected successfully
    user.context.selected_question = selectedQuestion;
    user.context.hw_intel_state = "hw_painpoint_excavation";

    console.log(
      `✅ Question selected: #${selectedQuestion.number} (${selectedQuestion.type})`
    );

    return await this.startPainpointExcavation(user, selectedQuestion);
  }

  async startPainpointExcavation(user, selectedQuestion) {
    // Initialize intelligence tracking
    this.initializeIntelligenceTracking(user.id);

    const questionType = selectedQuestion.type;
    const probe = this.generateHomeworkSpecificProbe(
      questionType,
      selectedQuestion
    );

    user.context.excavation_attempt = 1;
    user.context.intelligence_attempts =
      (user.context.intelligence_attempts || 0) + 1;

    const questionSummary = this.generateQuestionSummary(selectedQuestion);

    const content = `🎯 **Question ${selectedQuestion.number}:** ${questionSummary}

${probe}

**What specifically is confusing you about this question?**

⚡ *The more specific you are, the better I can help you!*`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  generateHomeworkSpecificProbe(questionType, question) {
    console.log(`🔍 Generating homework probe for type: ${questionType}`);

    const probes = {
      linear_equation: this.probeLinearEquationHomework(question),
      quadratic_equation: this.probeQuadraticHomework(question),
      triangle_area: this.probeTriangleAreaHomework(question),
      circle_area: this.probeCircleAreaHomework(question),
      rectangle_area: this.probeRectangleAreaHomework(question),
      perimeter: this.probePerimeterHomework(question),
      factoring: this.probeFactoringHomework(question),
      simplifying: this.probeSimplifyingHomework(question),
      trigonometry: this.probeTrigonometryHomework(question),
      geometry_angles: this.probeAngleHomework(question),
      statistics: this.probeStatisticsHomework(question),
      general_math: this.probeGeneralMathHomework(question),
    };

    return probes[questionType] || probes["general_math"];
  }

  // Homework-specific probing methods
  probeLinearEquationHomework(question) {
    const hasNumbers = Object.keys(question.numbers).length > 0;
    const numbersInfo = hasNumbers
      ? `\n📊 *I see: ${Object.entries(question.numbers)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")}*`
      : "";

    return `**Linear equation solving challenge!**${numbersInfo}

What's tricky about solving this equation?
• 🤔 **Don't know how to isolate x?**
• 🔄 **Confused about moving terms across equals?**
• 📝 **Unsure about which step comes first?**
• 🧮 **Having trouble with the arithmetic?**

*Tell me exactly where you get stuck!*`;
  }

  probeTriangleAreaHomework(question) {
    const numbers = question.numbers;
    const hasGeometryNumbers = numbers.base || numbers.height || numbers.area;
    const numberDisplay = hasGeometryNumbers
      ? `\n📐 *Values: ${Object.entries(numbers)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")}*`
      : "";

    return `**Triangle area calculation!**${numberDisplay}

What's confusing about finding the triangle area?
• 📐 **Don't know the area formula?**
• 🔢 **Can't substitute the numbers correctly?**
• 🧮 **Confused about the calculation steps?**
• ❓ **Not sure what base and height mean?**

*Be specific about what's stopping you!*`;
  }

  probeQuadraticHomework(question) {
    return `**Quadratic equation challenge!**

What's challenging about this quadratic?
• 🎯 **Don't know which method to use?** (factoring vs formula)
• 🧩 **Can't factor it correctly?**
• 📐 **Confused about the quadratic formula?**
• 🔢 **Stuck on the algebra steps?**

*Tell me your biggest struggle with this problem!*`;
  }

  probeCircleAreaHomework(question) {
    const numbers = question.numbers;
    const hasCircleNumbers = numbers.radius || numbers.area;
    const numberDisplay = hasCircleNumbers
      ? `\n⭕ *Given: ${Object.entries(numbers)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")}*`
      : "";

    return `**Circle area calculation!**${numberDisplay}

What's unclear about the circle area?
• 🔵 **Don't remember the π formula?**
• 📏 **Confused about radius vs diameter?**
• 🧮 **Unsure about calculating with π?**
• ❓ **Don't know what value to use for π?**

*What specifically is blocking you?*`;
  }

  probeFactoringHomework(question) {
    return `**Factoring expression challenge!**

Where are you getting stuck with factoring?
• 🎯 **Don't know where to start?**
• 🔢 **Can't find the right factor pairs?**
• 🧩 **Confused about the factoring pattern?**
• ✅ **Not sure how to check your answer?**

*Tell me exactly what's confusing you!*`;
  }

  probeTrigonometryHomework(question) {
    return `**Trigonometry problem!**

What's confusing about this trig question?
• 📐 **Don't remember SOH-CAH-TOA?**
• 🎯 **Can't identify which ratio to use?**
• 🔢 **Confused about the calculation?**
• 📊 **Don't know how to set up the equation?**

*Be specific about your trigonometry struggle!*`;
  }

  probeGeneralMathHomework(question) {
    return `**Looking at this math problem...**

What's stopping you from solving it?
• 🤔 **Don't know where to start?**
• 📝 **Confused about the method to use?**
• 🧮 **Stuck on a specific calculation step?**
• ❓ **Not sure what the question is asking?**

*Tell me exactly what's confusing you!*`;
  }

  // Helper methods
  truncateQuestionText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  getTypeIndicator(type) {
    const indicators = {
      linear_equation: "📏",
      quadratic_equation: "📐",
      triangle_area: "🔺",
      circle_area: "⭕",
      rectangle_area: "▭",
      factoring: "🧩",
      trigonometry: "📊",
      geometry_angles: "📐",
      statistics: "📈",
    };
    return indicators[type] || "🔢";
  }

  parseQuestionNumber(response) {
    const match = response.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  generateQuestionSummary(question) {
    const typeNames = {
      linear_equation: "Linear Equation",
      quadratic_equation: "Quadratic Equation",
      triangle_area: "Triangle Area",
      circle_area: "Circle Area",
      rectangle_area: "Rectangle Area",
      factoring: "Factoring",
      trigonometry: "Trigonometry",
      general_math: "Math Problem",
    };

    return typeNames[question.type] || "Math Problem";
  }

  initializeIntelligenceTracking(userId) {
    if (!this.intelligenceAttempts.has(userId)) {
      this.intelligenceAttempts.set(userId, {
        attempts: 0,
        painpointResponses: [],
        startTime: new Date().toISOString(),
      });
    }
  }

  recordIntelligenceAttempt(userId, response, result) {
    const tracking = this.intelligenceAttempts.get(userId);
    if (tracking) {
      tracking.attempts++;
      tracking.painpointResponses.push({
        response: response,
        result: result,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Export singleton
const homeworkIntelligence = new HomeworkIntelligenceEngine();
module.exports = { homeworkIntelligence, HomeworkIntelligenceEngine };

