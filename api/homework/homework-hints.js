/**
 * Ultra-Fast Homework Hint Generation System
 * GOAT Bot 2.0 - Phase 3 Implementation
 * User: sophoniagoat
 * Created: 2025-08-22 09:26:32 UTC
 */

const { formatHomeworkResponse } = require("./homework-integration");

class QuickHomeworkHintGenerator {
  constructor() {
    this.instantHints = this.loadInstantHintDatabase();
    this.hintCache = new Map();
    this.performanceMetrics = {
      instantHits: 0,
      aiGenerated: 0,
      fallbackUsed: 0,
      avgResponseTime: [],
    };
  }

  async generateQuickHint(user) {
    const startTime = Date.now();
    const painpoint = user.context.painpoint_analysis?.specific_struggle || "";
    const selectedQuestion = user.context.selected_question;

    console.log(
      `⚡ Generating quick hint for: "${painpoint}" (${selectedQuestion.type})`
    );

    try {
      // Try instant hint first (0-50ms)
      const instantHint = this.getInstantHint(painpoint, selectedQuestion);
      if (instantHint) {
        this.recordPerformance("instant", Date.now() - startTime);
        return this.formatQuickHintResponse(user, instantHint, "instant");
      }

      // Try cached hint (50-100ms)
      const cachedHint = this.getCachedHint(painpoint, selectedQuestion.type);
      if (cachedHint) {
        this.recordPerformance("cached", Date.now() - startTime);
        return this.formatQuickHintResponse(user, cachedHint, "cached");
      }

      // Generate AI hint with timeout (500-2000ms)
      const aiHint = await this.generateAIHintWithTimeout(
        painpoint,
        selectedQuestion
      );
      if (aiHint) {
        this.cacheHint(painpoint, selectedQuestion.type, aiHint);
        this.recordPerformance("ai", Date.now() - startTime);
        return this.formatQuickHintResponse(user, aiHint, "ai");
      }

      // Fallback hint (immediate)
      const fallbackHint = this.getFallbackHint(selectedQuestion.type);
      this.recordPerformance("fallback", Date.now() - startTime);
      return this.formatQuickHintResponse(user, fallbackHint, "fallback");
    } catch (error) {
      console.error(`❌ Hint generation failed:`, error);
      const emergencyHint = this.getEmergencyHint(selectedQuestion.type);
      return this.formatQuickHintResponse(user, emergencyHint, "emergency");
    }
  }

  loadInstantHintDatabase() {
    return {
      // Linear Equations - Instant Hints
      linear_isolate_x: {
        hint: "Move numbers to one side, x to the other",
        example: "If 2x + 5 = 15, then 2x = 15 - 5 = 10, so x = 5",
        confidence: 0.95,
      },
      linear_move_terms: {
        hint: "Change sign when crossing equals",
        example: "+5 becomes -5 when moved across the = sign",
        confidence: 0.9,
      },
      linear_steps: {
        hint: "Add/subtract first, then multiply/divide",
        example: "2x + 3 = 11 → 2x = 8 → x = 4",
        confidence: 0.85,
      },

      // Triangle Area - Instant Hints
      triangle_formula: {
        hint: "Area = ½ × base × height",
        example: "Base = 6, Height = 4 → Area = ½ × 6 × 4 = 12",
        confidence: 0.95,
      },
      triangle_substitution: {
        hint: "Plug your numbers into Area = ½ × base × height",
        example: "Your numbers → Area = ½ × [base] × [height]",
        confidence: 0.9,
      },
      triangle_calculation: {
        hint: "Multiply base × height, then divide by 2",
        example: "8 × 6 = 48, then 48 ÷ 2 = 24",
        confidence: 0.85,
      },

      // Quadratic Equations - Instant Hints
      quadratic_method: {
        hint: "Try factoring first, use formula if factoring fails",
        example: "x² + 5x + 6 → look for factors of 6 that add to 5",
        confidence: 0.8,
      },
      quadratic_factoring: {
        hint: "Find two numbers: multiply to c, add to b",
        example: "x² + 7x + 12 → need numbers that × to 12, + to 7 → 3,4",
        confidence: 0.85,
      },

      // Circle Area - Instant Hints
      circle_formula: {
        hint: "Area = π × radius²",
        example: "radius = 3 → Area = π × 3² = 9π ≈ 28.3",
        confidence: 0.95,
      },
      circle_pi_value: {
        hint: "Use π ≈ 3.14 or leave as π",
        example: "πr² = π × 4² = 16π or 16 × 3.14 = 50.24",
        confidence: 0.9,
      },

      // Factoring - Instant Hints
      factoring_start: {
        hint: "Look for common factors first, then patterns",
        example: "6x² + 9x → 3x is common → 3x(2x + 3)",
        confidence: 0.8,
      },
      factoring_pairs: {
        hint: "List factor pairs, check which adds correctly",
        example:
          "For 12: (1,12), (2,6), (3,4) → which pair adds to middle term?",
        confidence: 0.85,
      },

      // Trigonometry - Instant Hints
      trig_ratios: {
        hint: "SOH-CAH-TOA: Sin=Opp/Hyp, Cos=Adj/Hyp, Tan=Opp/Adj",
        example: "Have opposite and hypotenuse? Use Sin = Opp/Hyp",
        confidence: 0.9,
      },
      trig_which_ratio: {
        hint: "Identify which sides you have, pick matching ratio",
        example: "Know adjacent and hypotenuse? Use Cosine",
        confidence: 0.85,
      },
    };
  }

  getInstantHint(painpoint, selectedQuestion) {
    const startTime = Date.now();

    // Generate hint key from painpoint and question type
    const hintKey = this.generateHintKey(painpoint, selectedQuestion.type);
    const instantHint = this.instantHints[hintKey];

    if (instantHint) {
      console.log(
        `⚡ Instant hint found: ${hintKey} in ${Date.now() - startTime}ms`
      );

      // Personalize with question numbers if available
      const personalizedHint = this.personalizeHint(
        instantHint,
        selectedQuestion
      );
      return personalizedHint;
    }

    // Try partial matches
    const partialMatch = this.findPartialHintMatch(
      painpoint,
      selectedQuestion.type
    );
    if (partialMatch) {
      console.log(
        `⚡ Partial instant hint found in ${Date.now() - startTime}ms`
      );
      return this.personalizeHint(partialMatch, selectedQuestion);
    }

    console.log(`⚠️ No instant hint found for: ${hintKey}`);
    return null;
  }

  generateHintKey(painpoint, questionType) {
    const text = painpoint.toLowerCase();

    // Question type specific mappings
    const keyMappings = {
      linear_equation: {
        isolate: "linear_isolate_x",
        move: "linear_move_terms",
        steps: "linear_steps",
        across: "linear_move_terms",
      },
      triangle_area: {
        formula: "triangle_formula",
        substitute: "triangle_substitution",
        calculation: "triangle_calculation",
        numbers: "triangle_substitution",
      },
      quadratic_equation: {
        method: "quadratic_method",
        factor: "quadratic_factoring",
      },
      circle_area: {
        formula: "circle_formula",
        pi: "circle_pi_value",
        π: "circle_pi_value",
      },
      factoring: {
        start: "factoring_start",
        pairs: "factoring_pairs",
        factor: "factoring_pairs",
      },
      trigonometry: {
        ratios: "trig_ratios",
        which: "trig_which_ratio",
        soh: "trig_ratios",
      },
    };

    const typeMapping = keyMappings[questionType] || {};

    // Find best matching key
    for (const [keyword, hintKey] of Object.entries(typeMapping)) {
      if (text.includes(keyword)) {
        return hintKey;
      }
    }

    // Default to question type + generic
    return `${questionType}_generic`;
  }

  findPartialHintMatch(painpoint, questionType) {
    const text = painpoint.toLowerCase();

    // Try to find hints that match the question type
    const typeHints = Object.entries(this.instantHints).filter(([key, hint]) =>
      key.startsWith(questionType.split("_")[0])
    );

    if (typeHints.length > 0) {
      // Return the highest confidence hint for this type
      const bestHint = typeHints.reduce((best, [key, hint]) =>
        hint.confidence > best[1].confidence ? [key, hint] : best
      );

      return bestHint[1];
    }

    return null;
  }

  personalizeHint(hint, selectedQuestion) {
    let personalizedHint = { ...hint };
    const numbers = selectedQuestion.numbers || {};

    // Replace placeholders with actual numbers
    if (numbers.base && numbers.height) {
      personalizedHint.example = personalizedHint.example
        .replace("[base]", numbers.base)
        .replace("[height]", numbers.height)
        .replace(/Base = \d+/, `Base = ${numbers.base}`)
        .replace(/Height = \d+/, `Height = ${numbers.height}`);
    }

    if (numbers.radius) {
      personalizedHint.example = personalizedHint.example
        .replace(/radius = \d+/, `radius = ${numbers.radius}`)
        .replace(/r = \d+/, `r = ${numbers.radius}`);
    }

    if (numbers.coefficient) {
      personalizedHint.example = personalizedHint.example.replace(
        /\d+x/,
        `${numbers.coefficient}x`
      );
    }

    return personalizedHint;
  }

  async generateAIHintWithTimeout(painpoint, selectedQuestion) {
    const timeoutMs = 3000; // 3 second timeout

    console.log(`🤖 Generating AI hint with ${timeoutMs}ms timeout`);

    const aiPromise = this.generateAIHint(painpoint, selectedQuestion);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI hint timeout")), timeoutMs)
    );

    try {
      const result = await Promise.race([aiPromise, timeoutPromise]);
      console.log(`✅ AI hint generated successfully`);
      return result;
    } catch (error) {
      console.warn(`⚠️ AI hint generation failed/timeout: ${error.message}`);
      return null;
    }
  }

  async generateAIHint(painpoint, selectedQuestion) {
    try {
      const OpenAI = require("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `Student stuck on: "${painpoint}"
Question type: ${selectedQuestion.type}
Question: "${selectedQuestion.text}"

Generate a QUICK HINT in this exact format:
[Method/Formula]: One line explanation
[Example]: Using their numbers if available
[Action]: "Apply this to your homework!"

Maximum 40 words total. Be specific and actionable.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 80,
        temperature: 0.1,
        timeout: 2500,
      });

      const content = response.choices[0].message.content.trim();

      return {
        hint: content,
        confidence: 0.8,
        source: "ai_generated",
        tokens_used: response.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error(`❌ OpenAI hint generation failed:`, error);
      throw error;
    }
  }

  getFallbackHint(questionType) {
    const fallbacks = {
      linear_equation: {
        hint: "Isolate x: move numbers to one side, x to the other",
        example: "2x + 3 = 11 → 2x = 8 → x = 4",
        confidence: 0.7,
      },
      triangle_area: {
        hint: "Area = ½ × base × height",
        example: "Use your base and height measurements",
        confidence: 0.7,
      },
      quadratic_equation: {
        hint: "Try factoring or use quadratic formula",
        example: "Look for two numbers that multiply and add correctly",
        confidence: 0.6,
      },
      circle_area: {
        hint: "Area = πr² (pi times radius squared)",
        example: "Square your radius, multiply by π",
        confidence: 0.7,
      },
      factoring: {
        hint: "Find factor pairs that multiply and add correctly",
        example: "List all factor pairs, test which works",
        confidence: 0.6,
      },
      trigonometry: {
        hint: "Use SOH-CAH-TOA to pick the right ratio",
        example: "Match your known sides to Sin, Cos, or Tan",
        confidence: 0.7,
      },
    };

    return (
      fallbacks[questionType] || {
        hint: "Check your textbook for the method",
        example: "Look for similar example problems",
        confidence: 0.5,
      }
    );
  }

  getEmergencyHint(questionType) {
    return {
      hint: `For ${questionType.replace(
        "_",
        " "
      )}: check your textbook or ask your teacher`,
      example: "Look for step-by-step examples",
      confidence: 0.3,
      source: "emergency",
    };
  }

  formatQuickHintResponse(user, hint, source) {
    const selectedQuestion = user.context.selected_question;
    const questionNumber = selectedQuestion.number;

    // Update user state
    user.context.hw_intel_state = "hw_hint_delivered";
    user.context.hint_delivered = {
      content: hint,
      source: source,
      timestamp: new Date().toISOString(),
      question_type: selectedQuestion.type,
    };

    // Determine hint quality indicator
    const qualityIndicator = this.getQualityIndicator(hint.confidence, source);

    const content = `💡 **Quick Hint for Question ${questionNumber}** ${qualityIndicator}

**${hint.hint}**

**Example:** ${hint.example}

✅ **Apply this to your homework and keep going!**

⚡ *Need help with another question? Just ask!*`;

    return formatHomeworkResponse(content, user.preferences.device_type);
  }

  getQualityIndicator(confidence, source) {
    if (source === "instant" && confidence > 0.9) return "⚡";
    if (source === "ai" && confidence > 0.8) return "🎯";
    if (source === "cached") return "💾";
    if (source === "fallback") return "📚";
    return "💡";
  }

  // Caching system
  getCachedHint(painpoint, questionType) {
    const cacheKey = `${questionType}_${painpoint.substring(0, 20)}`;
    return this.hintCache.get(cacheKey);
  }

  cacheHint(painpoint, questionType, hint) {
    const cacheKey = `${questionType}_${painpoint.substring(0, 20)}`;
    this.hintCache.set(cacheKey, hint);

    // Limit cache size
    if (this.hintCache.size > 100) {
      const firstKey = this.hintCache.keys().next().value;
      this.hintCache.delete(firstKey);
    }
  }

  recordPerformance(type, duration) {
    this.performanceMetrics[
      `${type}${
        type === "ai" ? "Generated" : type === "instant" ? "Hits" : "Used"
      }`
    ]++;
    this.performanceMetrics.avgResponseTime.push(duration);

    // Keep only recent measurements
    if (this.performanceMetrics.avgResponseTime.length > 50) {
      this.performanceMetrics.avgResponseTime =
        this.performanceMetrics.avgResponseTime.slice(-25);
    }
  }

  getPerformanceStats() {
    const avg =
      this.performanceMetrics.avgResponseTime.length > 0
        ? this.performanceMetrics.avgResponseTime.reduce((a, b) => a + b, 0) /
          this.performanceMetrics.avgResponseTime.length
        : 0;

    return {
      ...this.performanceMetrics,
      avgResponseTimeMs: Math.round(avg),
      totalHints:
        this.performanceMetrics.instantHits +
        this.performanceMetrics.aiGenerated +
        this.performanceMetrics.fallbackUsed,
    };
  }
}

// Export singleton
const quickHintGenerator = new QuickHomeworkHintGenerator();
module.exports = { quickHintGenerator };

