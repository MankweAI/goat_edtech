/**
 * Homework Painpoint Analysis & Confirmation System
 * Enhanced with failure handling and polite decline
 * User: sophoniagoat
 * Created: 2025-08-22 09:22:32 UTC
 */

const { homeworkResponses } = require("./homework-responses");
const { formatHomeworkResponse } = require("./homework-integration");

class HomeworkPainpointAnalyzer {
  constructor() {
    this.maxPainpointAttempts = 3;
    this.painpointHistory = new Map();
  }

  async analyzePainpointResponse(user, painpointResponse) {
    const userId = user.id;
    const attemptNumber = user.context.excavation_attempt || 1;

    console.log(
      `🔍 Analyzing painpoint response (attempt ${attemptNumber}): "${painpointResponse}"`
    );

    // Track painpoint attempt
    this.recordPainpointAttempt(userId, painpointResponse, attemptNumber);

    const analysis = this.performEnhancedPainpointAnalysis(
      painpointResponse,
      user.context.selected_question
    );

    console.log(
      `📊 Painpoint analysis result: ${analysis.clarity_level} (confidence: ${analysis.confidence})`
    );

    if (analysis.clarity_level === "clear") {
      // Clear painpoint - proceed to confirmation
      return await this.generatePainpointConfirmation(user, analysis);
    } else if (attemptNumber >= this.maxPainpointAttempts) {
      // Max attempts reached - check if we can make intelligent assumptions
      const fallbackAnalysis = this.attemptIntelligentFallback(user, analysis);

      if (fallbackAnalysis.canProceed) {
        return await this.generateFallbackConfirmation(user, fallbackAnalysis);
      } else {
        // Intelligence gathering failed - polite decline
        return await this.generatePoliteDecline(user);
      }
    } else {
      // Continue probing with more specific questions
      return await this.generateClarificationProbe(
        user,
        analysis,
        attemptNumber + 1
      );
    }
  }

  performEnhancedPainpointAnalysis(response, selectedQuestion) {
    const text = response.toLowerCase().trim();
    const questionType = selectedQuestion?.type || "general_math";

    console.log(`🔍 Enhanced analysis for question type: ${questionType}`);

    // Question-type specific analysis
    const specificAnalysis = this.analyzeQuestionSpecificPainpoint(
      text,
      questionType
    );

    if (specificAnalysis.isSpecific) {
      return {
        clarity_level: "clear",
        specific_struggle: response,
        confidence: specificAnalysis.confidence,
        analysis_type: "question_specific",
        reasoning: specificAnalysis.reasoning,
      };
    }

    // General clarity analysis
    const generalAnalysis = this.analyzeGeneralClarity(text);

    return {
      clarity_level: generalAnalysis.clarity_level,
      specific_struggle: response,
      confidence: generalAnalysis.confidence,
      analysis_type: "general",
      reasoning: generalAnalysis.reasoning,
      suggested_probe: generalAnalysis.suggested_probe,
    };
  }

  analyzeQuestionSpecificPainpoint(text, questionType) {
    console.log(`🎯 Question-specific analysis for: ${questionType}`);

    const specificIndicators = {
      linear_equation: [
        {
          pattern: /don'?t know.*isolate|isolat.*confus/i,
          confidence: 0.9,
          reason: "isolation_struggle",
        },
        {
          pattern: /mov.*term|across.*equal/i,
          confidence: 0.85,
          reason: "term_movement_confusion",
        },
        {
          pattern: /which.*step|step.*confus/i,
          confidence: 0.8,
          reason: "step_sequence_confusion",
        },
        {
          pattern: /arithmetic|calculat.*wrong/i,
          confidence: 0.75,
          reason: "calculation_errors",
        },
      ],
      triangle_area: [
        {
          pattern: /don'?t know.*formula|formula.*confus/i,
          confidence: 0.9,
          reason: "formula_unknown",
        },
        {
          pattern: /substitut.*number|number.*substitut/i,
          confidence: 0.85,
          reason: "substitution_confusion",
        },
        {
          pattern: /base.*height|height.*base/i,
          confidence: 0.8,
          reason: "measurement_confusion",
        },
        {
          pattern: /calculat.*step/i,
          confidence: 0.75,
          reason: "calculation_steps",
        },
      ],
      quadratic_equation: [
        {
          pattern: /which.*method|method.*confus/i,
          confidence: 0.9,
          reason: "method_selection",
        },
        {
          pattern: /factor.*confus|can'?t factor/i,
          confidence: 0.85,
          reason: "factoring_difficulty",
        },
        {
          pattern: /quadratic.*formula/i,
          confidence: 0.8,
          reason: "formula_application",
        },
        {
          pattern: /algebra.*step/i,
          confidence: 0.75,
          reason: "algebraic_manipulation",
        },
      ],
      circle_area: [
        {
          pattern: /π|pi.*confus|don'?t.*pi/i,
          confidence: 0.9,
          reason: "pi_confusion",
        },
        {
          pattern: /radius.*diameter|diameter.*radius/i,
          confidence: 0.85,
          reason: "radius_diameter_confusion",
        },
        {
          pattern: /formula.*πr|area.*formula/i,
          confidence: 0.8,
          reason: "formula_knowledge",
        },
      ],
      factoring: [
        {
          pattern: /where.*start|start.*confus/i,
          confidence: 0.9,
          reason: "starting_point_confusion",
        },
        {
          pattern: /factor.*pair|pair.*factor/i,
          confidence: 0.85,
          reason: "factor_pair_difficulty",
        },
        {
          pattern: /pattern.*confus|don'?t.*pattern/i,
          confidence: 0.8,
          reason: "pattern_recognition",
        },
      ],
      trigonometry: [
        {
          pattern: /soh.*cah.*toa|ratio.*confus/i,
          confidence: 0.9,
          reason: "ratio_confusion",
        },
        {
          pattern: /which.*ratio|ratio.*use/i,
          confidence: 0.85,
          reason: "ratio_selection",
        },
        {
          pattern: /sin|cos|tan.*confus/i,
          confidence: 0.8,
          reason: "specific_ratio_confusion",
        },
      ],
    };

    const indicators = specificIndicators[questionType] || [];

    for (const indicator of indicators) {
      if (indicator.pattern.test(text)) {
        console.log(
          `✅ Specific indicator found: ${indicator.reason} (confidence: ${indicator.confidence})`
        );
        return {
          isSpecific: true,
          confidence: indicator.confidence,
          reasoning: indicator.reason,
          pattern_matched: indicator.pattern.toString(),
        };
      }
    }

    // Check for general mathematical struggles
    const generalMathIndicators = [
      {
        pattern: /don'?t understand.*how/i,
        confidence: 0.7,
        reason: "method_confusion",
      },
      {
        pattern: /confused.*about/i,
        confidence: 0.7,
        reason: "concept_confusion",
      },
      {
        pattern: /stuck.*on/i,
        confidence: 0.75,
        reason: "specific_step_block",
      },
      {
        pattern: /can'?t figure.*out/i,
        confidence: 0.7,
        reason: "general_difficulty",
      },
    ];

    for (const indicator of generalMathIndicators) {
      if (indicator.pattern.test(text)) {
        console.log(
          `✅ General math indicator found: ${indicator.reason} (confidence: ${indicator.confidence})`
        );
        return {
          isSpecific: true,
          confidence: indicator.confidence,
          reasoning: indicator.reason,
          pattern_matched: indicator.pattern.toString(),
        };
      }
    }

    return {
      isSpecific: false,
      confidence: 0.4,
      reasoning: "no_specific_indicators",
    };
  }

  analyzeGeneralClarity(text) {
    // Definitive vague responses
    const vagueness_indicators = [
      "i don't know",
      "not sure",
      "confused",
      "help me",
      "everything",
      "all of it",
      "i'm lost",
      "no clue",
      "no idea",
    ];

    const isDefinitelyVague = vagueness_indicators.some(
      (indicator) => text.includes(indicator) && text.length < 20
    );

    if (isDefinitelyVague) {
      return {
        clarity_level: "vague",
        confidence: 0.9,
        reasoning: "definite_vague_response",
        suggested_probe: "specific_step_probe",
      };
    }

    // Check for emotional indicators of struggle
    const struggle_emotions = [
      "frustrated",
      "hard",
      "difficult",
      "tricky",
      "challenging",
      "can't",
      "won't",
      "doesn't work",
      "impossible",
    ];

    const hasEmotionalContent = struggle_emotions.some((emotion) =>
      text.includes(emotion)
    );

    // Check for specific mathematical terms
    const math_terms = [
      "equation",
      "formula",
      "calculate",
      "solve",
      "find",
      "area",
      "perimeter",
      "angle",
      "triangle",
      "factor",
      "multiply",
      "divide",
    ];

    const hasMathTerms = math_terms.some((term) => text.includes(term));

    // Determine clarity level
    if (text.length >= 25 && (hasEmotionalContent || hasMathTerms)) {
      return {
        clarity_level: "moderate",
        confidence: 0.7,
        reasoning: "sufficient_detail_with_context",
        suggested_probe: "confirmation_probe",
      };
    } else if (text.length >= 15) {
      return {
        clarity_level: "unclear",
        confidence: 0.6,
        reasoning: "minimal_detail",
        suggested_probe: "detailed_step_probe",
      };
    } else {
      return {
        clarity_level: "vague",
        confidence: 0.8,
        reasoning: "insufficient_information",
        suggested_probe: "guided_discovery_probe",
      };
    }
  }

  async generatePainpointConfirmation(user, analysis) {
    const question = user.context.selected_question;
    const struggle = analysis.specific_struggle;

    user.context.hw_intel_state = "hw_painpoint_confirmation";
    user.context.painpoint_analysis = analysis;

    console.log(`✅ Generating painpoint confirmation for: ${struggle}`);

    const content = `🎯 **Perfect! Let me confirm your challenge:**

**Question:** ${question.number} (${this.getQuestionTypeName(question.type)})
**Your Challenge:** "${struggle}"

**Is this correct?** I'll create a targeted hint to help you with exactly this!

**Type 'yes' if this captures your struggle, or tell me what I should focus on instead.**

⚡ *Once confirmed, I'll get you unstuck in seconds!*`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  async generateClarificationProbe(user, analysis, nextAttempt) {
    user.context.excavation_attempt = nextAttempt;

    console.log(`🔍 Generating clarification probe (attempt ${nextAttempt})`);

    const question = user.context.selected_question;
    const questionType = question.type;

    const probes = this.getClarificationProbes(
      questionType,
      analysis.suggested_probe
    );
    const selectedProbe = probes[Math.min(nextAttempt - 2, probes.length - 1)];

    const content = `🔍 **Let me help you be more specific** (attempt ${nextAttempt}/${this.maxPainpointAttempts})

${selectedProbe}

**Try to be more specific about exactly what's confusing you.**

💡 *The more specific you are, the better I can help!*`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  getClarificationProbes(questionType, probeType) {
    const questionSpecificProbes = {
      linear_equation: [
        "When you look at this equation, **what is the very first thing that confuses you?**",
        "Walk me through your steps - **at what exact point do you get stuck?**",
        "If you had to guess the next step, **what would stop you from doing it?**",
      ],
      triangle_area: [
        "For triangle area, **what specific part don't you know - the formula, the numbers, or the calculation?**",
        'If I said "Area = ½ × base × height", **what would you be unsure about next?**',
        "Looking at your triangle, **what specific measurement or calculation confuses you?**",
      ],
      general_math: [
        "Looking at this specific problem, **what is the very first thing that stops you?**",
        "If you had to take one step toward solving this, **what would prevent you from taking that step?**",
        "Think about the last time you tried this type of problem - **what always goes wrong?**",
      ],
    };

    return (
      questionSpecificProbes[questionType] ||
      questionSpecificProbes["general_math"]
    );
  }

  attemptIntelligentFallback(user, analysis) {
    console.log(
      `🤔 Attempting intelligent fallback after ${this.maxPainpointAttempts} attempts`
    );

    const question = user.context.selected_question;
    const painpointHistory = this.painpointHistory.get(user.id) || [];

    // Analyze pattern from multiple responses
    const combinedResponses = painpointHistory.map((p) => p.response).join(" ");
    const questionType = question.type;

    // Make intelligent assumptions based on question type and response patterns
    const assumptions = this.makeIntelligentAssumptions(
      questionType,
      combinedResponses
    );

    if (assumptions.confidence > 0.6) {
      console.log(
        `✅ Intelligent fallback successful: ${assumptions.assumption} (confidence: ${assumptions.confidence})`
      );
      return {
        canProceed: true,
        assumption: assumptions.assumption,
        confidence: assumptions.confidence,
        reasoning: assumptions.reasoning,
      };
    }

    console.log(
      `❌ Intelligent fallback failed: insufficient confidence (${assumptions.confidence})`
    );
    return {
      canProceed: false,
      attempts: painpointHistory.length,
      lastResponses: painpointHistory.slice(-2).map((p) => p.response),
    };
  }

  makeIntelligentAssumptions(questionType, combinedText) {
    const text = combinedText.toLowerCase();

    // Common struggle patterns by question type
    const commonStruggles = {
      linear_equation: {
        pattern: /confus|don.*know|stuck|help/,
        assumption: "difficulty with equation solving steps",
        confidence: 0.7,
      },
      triangle_area: {
        pattern: /area|formula|confus|calculate/,
        assumption: "uncertainty about triangle area formula or calculation",
        confidence: 0.75,
      },
      quadratic_equation: {
        pattern: /factor|formula|method|quadratic/,
        assumption: "confusion about quadratic solving methods",
        confidence: 0.7,
      },
      circle_area: {
        pattern: /π|pi|radius|area|formula/,
        assumption: "difficulty with circle area formula or π calculations",
        confidence: 0.75,
      },
      factoring: {
        pattern: /factor|pair|pattern|start/,
        assumption: "difficulty finding factor pairs or factoring patterns",
        confidence: 0.7,
      },
    };

    const struggle = commonStruggles[questionType];
    if (struggle && struggle.pattern.test(text)) {
      return {
        assumption: struggle.assumption,
        confidence: struggle.confidence,
        reasoning: `Pattern matching for ${questionType}`,
      };
    }

    // Generic fallback assumption
    return {
      assumption: "general confusion about problem-solving approach",
      confidence: 0.5,
      reasoning: "Generic assumption based on multiple unclear responses",
    };
  }

  async generateFallbackConfirmation(user, fallbackAnalysis) {
    user.context.hw_intel_state = "hw_painpoint_confirmation";
    user.context.painpoint_analysis = {
      specific_struggle: fallbackAnalysis.assumption,
      clarity_level: "fallback",
      confidence: fallbackAnalysis.confidence,
    };

    const content = `🤔 **Based on our conversation, I think I understand:**

**Your Challenge:** ${fallbackAnalysis.assumption}

**Is this a good direction?** I'll create a hint targeting this challenge.

**Type 'yes' to continue, or tell me what I should focus on instead.**

💡 *Sometimes it's easier to learn by doing - let's try a targeted hint!*`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  async generatePoliteDecline(user) {
    const attempts = this.painpointHistory.get(user.id) || [];
    const attemptDescriptions = [
      "Analyzed your homework image/text",
      "Asked about your specific confusion",
      "Tried different approaches to understand your challenge",
    ];

    user.context.hw_intel_state = "hw_intelligence_failed";

    console.log(
      `😔 Polite decline for user ${user.id} after ${attempts.length} attempts`
    );

    const content = `😔 **I'm sorry, I'm having trouble pinpointing your specific challenge.**

**What we tried:**
• ${attemptDescriptions.slice(0, attempts.length).join("\n• ")}

**Here's what I recommend:**

🎓 **Ask your teacher** - they can see your work and give personalized guidance
📚 **Study with classmates** - peer learning often clarifies confusing concepts  
💻 **Check your textbook** - look for similar examples with step-by-step solutions
📖 **Use online resources** - Khan Academy, YouTube tutorials for your topic
🔄 **Try Menu Option 1** - practice similar problems to build confidence

**I'm here when you have a clearer question to work with!**

Type "menu" to return to main options, or "try again" for another attempt.`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  recordPainpointAttempt(userId, response, attemptNumber) {
    if (!this.painpointHistory.has(userId)) {
      this.painpointHistory.set(userId, []);
    }

    this.painpointHistory.get(userId).push({
      attempt: attemptNumber,
      response: response,
      timestamp: new Date().toISOString(),
    });
  }

  getQuestionTypeName(type) {
    const names = {
      linear_equation: "Linear Equation",
      quadratic_equation: "Quadratic Equation",
      triangle_area: "Triangle Area",
      circle_area: "Circle Area",
      factoring: "Factoring",
      trigonometry: "Trigonometry",
      general_math: "Math Problem",
    };
    return names[type] || "Math Problem";
  }
}

// Export singleton
const painpointAnalyzer = new HomeworkPainpointAnalyzer();
module.exports = { painpointAnalyzer };

