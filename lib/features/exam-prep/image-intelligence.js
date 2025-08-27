// lib/features/exam-prep/image-intelligence.js
const { processImage } = require("../../utils/image-processing");
const { questionDetector } = require("../../utils/question-detector");

class ExamPrepImageIntelligence {
  async extractIntelligenceFromImage(imageData, userId) {
    console.log(
      `🖼️ Extracting intelligence from image for exam prep user ${userId}`
    );

    try {
      // Process image with OCR using shared utility
      const ocrResult = await processImage(imageData, userId, "exam_prep");

      if (!ocrResult.success) {
        throw new Error(`OCR failed: ${ocrResult.error}`);
      }

      // Extract intelligence in single pass
      const intelligence = await this.analyzeImageContent(
        ocrResult.text,
        ocrResult.confidence
      );

      return {
        success: true,
        intelligence,
        extractedText: ocrResult.text,
        confidence: ocrResult.confidence,
        imageHash: ocrResult.imageHash,
      };
    } catch (error) {
      console.error("Image intelligence extraction failed:", error);
      return {
        success: false,
        error: error.message,
        fallbackRequired: true,
      };
    }
  }

  async analyzeImageContent(text, ocrConfidence = 0.8) {
    console.log(`🧠 Analyzing content for intelligence extraction`);

    // Parallel analysis for speed
    const [gradeAnalysis, subjectAnalysis, topicAnalysis, struggleAnalysis] =
      await Promise.all([
        this.detectGrade(text),
        this.detectSubject(text),
        this.detectTopic(text),
        this.detectStruggle(text),
      ]);

    // Foundation gap detection
    const foundationGaps = this.detectFoundationGaps(
      gradeAnalysis.grade,
      topicAnalysis.topic,
      struggleAnalysis.struggle
    );

    return {
      grade: gradeAnalysis.grade,
      gradeConfidence: gradeAnalysis.confidence,
      subject: subjectAnalysis.subject,
      subjectConfidence: subjectAnalysis.confidence,
      topic: topicAnalysis.topic,
      topicConfidence: topicAnalysis.confidence,
      struggle: struggleAnalysis.struggle,
      struggleConfidence: struggleAnalysis.confidence,
      foundationGaps,
      relatedStruggles: this.predictRelatedStruggles(topicAnalysis.topic),
      confidenceLevel: this.assessUserConfidence(text),
      overallConfidence: this.calculateOverallConfidence(
        gradeAnalysis,
        subjectAnalysis,
        topicAnalysis,
        struggleAnalysis,
        ocrConfidence
      ),
    };
  }

  detectGrade(content) {
    const text = content.toLowerCase();
    const patterns = {
      8: [
        "linear equations",
        "basic fractions",
        "simple algebra",
        "basic geometry",
        "integers",
        "whole numbers",
      ],
      9: [
        "simultaneous equations",
        "quadratic intro",
        "basic trigonometry",
        "pythagoras",
        "ratio",
        "proportion",
      ],
      10: [
        "factoring quadratics",
        "trig functions",
        "circle geometry",
        "parabolas",
        "quadratic formula",
      ],
      11: [
        "advanced functions",
        "calculus intro",
        "complex trigonometry",
        "logarithms",
        "exponential functions",
      ],
      12: [
        "derivatives",
        "integrals",
        "advanced calculus",
        "differential equations",
        "optimization",
      ],
    };

    let bestGrade = 10; // Default to Grade 10
    let maxScore = 0;

    for (const [grade, keywords] of Object.entries(patterns)) {
      const score = keywords.filter((keyword) => text.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        bestGrade = parseInt(grade);
      }
    }

    // Check for explicit grade mentions
    const gradeMatch = text.match(/grade\s*(\d+)|gr\s*(\d+)|(\d+)\s*grade/i);
    if (gradeMatch) {
      const explicitGrade = parseInt(
        gradeMatch[1] || gradeMatch[2] || gradeMatch[3]
      );
      if (explicitGrade >= 8 && explicitGrade <= 12) {
        return {
          grade: explicitGrade,
          confidence: 0.9,
        };
      }
    }

    return {
      grade: bestGrade,
      confidence: Math.min(maxScore / 2, 0.8),
    };
  }

  detectSubject(content) {
    const text = content.toLowerCase();
    const keywords = {
      Mathematics: [
        "solve",
        "equation",
        "factor",
        "x =",
        "calculate",
        "find x",
        "simplify",
        "algebra",
        "geometry",
      ],
      "Physical Sciences": [
        "force",
        "velocity",
        "acceleration",
        "newton",
        "energy",
        "circuit",
        "physics",
        "chemistry",
        "ohm",
      ],
      "Life Sciences": [
        "cell",
        "DNA",
        "photosynthesis",
        "organism",
        "ecosystem",
        "biology",
        "mitosis",
        "enzyme",
      ],
      Geography: [
        "climate",
        "map",
        "population",
        "settlement",
        "contour",
        "scale",
        "topographic",
      ],
      History: [
        "apartheid",
        "democracy",
        "independence",
        "colonial",
        "struggle",
        "resistance",
      ],
      "Mathematical Literacy": [
        "budget",
        "interest",
        "measurement",
        "finance",
        "data handling",
        "maps and plans",
      ],
    };

    let bestSubject = "Mathematics"; // Default
    let maxScore = 0;

    for (const [subject, words] of Object.entries(keywords)) {
      const score = words.filter((word) => text.includes(word)).length;
      if (score > maxScore) {
        maxScore = score;
        bestSubject = subject;
      }
    }

    return {
      subject: bestSubject,
      confidence: Math.min(maxScore / 3, 0.9),
    };
  }

  detectTopic(content) {
    const text = content.toLowerCase();

    // Mathematics topics
    if (text.includes("factor") || text.includes("quadratic")) {
      return { topic: "quadratic factoring", confidence: 0.9 };
    }
    if (text.includes("solve") && text.includes("x")) {
      return { topic: "solving equations", confidence: 0.8 };
    }
    if (text.includes("sin") || text.includes("cos") || text.includes("tan")) {
      return { topic: "trigonometry", confidence: 0.9 };
    }
    if (text.includes("area") || text.includes("perimeter")) {
      return { topic: "area and perimeter", confidence: 0.8 };
    }
    if (text.includes("graph") || text.includes("function")) {
      return { topic: "functions and graphs", confidence: 0.8 };
    }

    // Physical Sciences topics
    if (
      text.includes("circuit") ||
      text.includes("current") ||
      text.includes("voltage")
    ) {
      return { topic: "electricity and circuits", confidence: 0.9 };
    }
    if (
      text.includes("force") ||
      text.includes("motion") ||
      text.includes("acceleration")
    ) {
      return { topic: "mechanics and motion", confidence: 0.9 };
    }

    return { topic: "general problem solving", confidence: 0.5 };
  }

  detectStruggle(content) {
    const text = content.toLowerCase();

    // Pattern matching for struggle indicators
    const patterns = {
      "solving equations": ["solve for", "find x", "isolate", "x ="],
      factoring: ["factor", "factorize", "common factor", "expand"],
      "word problems": ["total cost", "how many", "distance", "rate", "time"],
      graphing: ["graph", "plot", "coordinate", "x-axis", "y-axis"],
      derivatives: ["derivative", "differentiate", "d/dx", "rate of change"],
      "formula application": ["formula", "which formula", "how to use"],
      "calculation errors": ["wrong answer", "calculation", "arithmetic"],
      "conceptual understanding": ["understand", "concept", "why", "how does"],
    };

    let bestMatch = "understanding the problem";
    let maxScore = 0;

    for (const [struggle, indicators] of Object.entries(patterns)) {
      const score = indicators.filter((indicator) =>
        text.includes(indicator)
      ).length;
      if (score > maxScore) {
        maxScore = score;
        bestMatch = struggle;
      }
    }

    return {
      struggle: bestMatch,
      confidence: Math.min(maxScore / 2, 0.8),
    };
  }

  detectFoundationGaps(grade, topic, struggle) {
    // Foundation mapping: what Grade X topic requires from previous grades
    const foundationMap = {
      "quadratic factoring": {
        10: ["Grade 9: basic factoring", "Grade 8: distributive property"],
        11: ["Grade 10: quadratic factoring", "Grade 9: basic factoring"],
        12: ["Grade 11: advanced factoring", "Grade 10: quadratic factoring"],
      },
      trigonometry: {
        10: ["Grade 9: Pythagoras theorem", "Grade 8: ratio and proportion"],
        11: ["Grade 10: basic trigonometry", "Grade 9: Pythagoras theorem"],
        12: [
          "Grade 11: trigonometric functions",
          "Grade 10: basic trigonometry",
        ],
      },
      derivatives: {
        11: ["Grade 10: function notation", "Grade 9: graphing"],
        12: ["Grade 11: function concepts", "Grade 10: advanced functions"],
      },
      "solving equations": {
        9: ["Grade 8: basic arithmetic", "Grade 8: like terms"],
        10: ["Grade 9: linear equations", "Grade 8: basic algebra"],
        11: [
          "Grade 10: quadratic equations",
          "Grade 9: simultaneous equations",
        ],
      },
    };

    const topicGaps = foundationMap[topic];
    if (!topicGaps || !topicGaps[grade]) {
      return [
        `Grade ${Math.max(8, grade - 1)}: foundational concepts for ${topic}`,
      ];
    }

    return topicGaps[grade];
  }

  predictRelatedStruggles(topic) {
    const relatedMap = {
      "quadratic factoring": [
        "completing the square",
        "quadratic formula",
        "parabola graphing",
      ],
      "solving equations": [
        "graphing functions",
        "word problems",
        "systems of equations",
      ],
      trigonometry: [
        "unit circle",
        "trig identities",
        "solving trig equations",
      ],
      derivatives: [
        "chain rule",
        "product rule",
        "applications of derivatives",
      ],
      "area and perimeter": [
        "volume calculations",
        "surface area",
        "similar shapes",
      ],
      "functions and graphs": [
        "domain and range",
        "transformations",
        "inverse functions",
      ],
    };

    return relatedMap[topic] || ["related problem-solving techniques"];
  }

  assessUserConfidence(content) {
    const text = content.toLowerCase();

    if (
      [
        "hardest",
        "don't understand",
        "completely lost",
        "no idea",
        "stuck",
        "confused",
      ].some((phrase) => text.includes(phrase))
    ) {
      return { level: "low", score: 0.2 };
    }
    if (
      ["check my answer", "is this correct", "verify", "almost done"].some(
        (phrase) => text.includes(phrase)
      )
    ) {
      return { level: "high", score: 0.8 };
    }
    return { level: "medium", score: 0.5 };
  }

  calculateOverallConfidence(
    gradeAnalysis,
    subjectAnalysis,
    topicAnalysis,
    struggleAnalysis,
    ocrConfidence
  ) {
    const weights = {
      grade: 0.2,
      subject: 0.3,
      topic: 0.3,
      struggle: 0.2,
    };

    const weightedScore =
      gradeAnalysis.confidence * weights.grade +
      subjectAnalysis.confidence * weights.subject +
      topicAnalysis.confidence * weights.topic +
      struggleAnalysis.confidence * weights.struggle;

    // Factor in OCR confidence
    return Math.min(0.95, weightedScore * ocrConfidence);
  }
}

module.exports = { ExamPrepImageIntelligence };
