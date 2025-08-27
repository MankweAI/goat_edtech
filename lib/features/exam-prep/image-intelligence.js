// lib/features/exam-prep/image-intelligence.js
/**
 * Specificity upgrade for Geometry (Similar Triangles) + Area-in-terms-of-k
 * - Heuristics detect "prove similar", "Δ", "hence find x", "in terms of k"
 * - Maps to topic: "similar triangles" with struggles focused on AA/ration chains/area ratios
 * - Keeps existing behavior for other topics
 */
const { processImage } = require("../../utils/image-processing");
const { questionDetector } = require("../../utils/question-detector");

class ExamPrepImageIntelligence {
  async extractIntelligenceFromImage(imageData, userId) {
    console.log(
      `🖼️ Extracting intelligence from image for exam prep user ${userId}`
    );

    try {
      const ocrResult = await processImage(imageData, userId, "exam_prep");

      if (!ocrResult.success) {
        throw new Error(`OCR failed: ${ocrResult.error}`);
      }

      const intel = await this.analyzeImageContent(
        ocrResult.text,
        ocrResult.confidence
      );

      return {
        success: true,
        intelligence: intel,
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

    const [gradeAnalysis, subjectAnalysis, topicAnalysis, struggleAnalysis] =
      await Promise.all([
        this.detectGrade(text),
        this.detectSubject(text),
        this.detectTopic(text),
        this.detectStruggle(text),
      ]);

    const refined = this.refineWithClassifier(text, {
      grade: gradeAnalysis.grade,
      subject: subjectAnalysis.subject,
      topic: topicAnalysis.topic,
      struggle: struggleAnalysis.struggle,
      subjectConfidence: subjectAnalysis.confidence,
      topicConfidence: topicAnalysis.confidence,
      struggleConfidence: struggleAnalysis.confidence,
    });

    const relatedStruggles = this.relatedByTopic(refined.topic);

    return {
      grade: refined.grade,
      gradeConfidence: gradeAnalysis.confidence,
      subject: refined.subject,
      subjectConfidence: refined.subjectConfidence,
      topic: refined.topic,
      topicConfidence: refined.topicConfidence,
      struggle: refined.struggle,
      struggleConfidence: refined.struggleConfidence,
      foundationGaps: [],
      relatedStruggles,
      confidenceLevel: this.assessUserConfidence(text),
      overallConfidence: this.calculateOverallConfidence(
        { confidence: gradeAnalysis.confidence },
        { confidence: refined.subjectConfidence },
        { confidence: refined.topicConfidence },
        { confidence: refined.struggleConfidence },
        ocrConfidence
      ),
    };
  }

  refineWithClassifier(text, initial) {
    const classification = questionDetector.classifyQuestion
      ? questionDetector.classifyQuestion(text || "")
      : "general_academic";

    let topic = initial.topic;
    let struggle = initial.struggle;
    let topicConf = initial.topicConfidence;
    let struggleConf = initial.struggleConfidence;

    // Heuristic detection for Similar Triangles + area-in-terms-of-k
    const t = (text || "").toLowerCase();
    const hasDelta = /△|Δ|apqr|asqt/i.test(text); // Look for triangle symbols or text
    const saysSimilar =
      /similar\s+to|prove\s+that.*similar|show\s+that.*similar|∼/.test(t);
    const areaInTerms = /(area).*(in\s+terms\s+of|k\b)/.test(t);
    const henceFindX = /hence\s+find\s+the\s+value\s+of\s+x|find\s+x\b/.test(t);

    if ((hasDelta && saysSimilar) || /similar triangles/.test(t)) {
      topic = "similar triangles";
      topicConf = Math.max(topicConf || 0.6, 0.9);

      if (areaInTerms) {
        struggle = "area ratio after similarity (k to triangle area)";
        struggleConf = Math.max(struggleConf || 0.5, 0.85);
      } else if (henceFindX) {
        struggle = "mapping corresponding sides to solve for x";
        struggleConf = Math.max(struggleConf || 0.5, 0.8);
      } else {
        struggle = "AA similarity and ratio chaining";
        struggleConf = Math.max(struggleConf || 0.5, 0.8);
      }
    } else {
      // Fall back to generic classifier mappings we already had
      const map = {
        linear_equation: {
          topic: "solving equations",
          struggle: "equation setup",
        },
        quadratic_equation: {
          topic: "quadratic equations",
          struggle: "method selection",
        },
        factoring: {
          topic: "quadratic factoring",
          struggle: "factoring patterns",
        },
        triangle_area: {
          topic: "area and perimeter",
          struggle: "choosing correct formula",
        },
        circle_area: {
          topic: "area and perimeter",
          struggle: "units and π usage",
        },
        rectangle_area: {
          topic: "area and perimeter",
          struggle: "translating words to equations",
        },
        perimeter: {
          topic: "area and perimeter",
          struggle: "adding edges correctly",
        },
        trigonometry: {
          topic: "trigonometry",
          struggle: "ratio selection (SOH/CAH/TOA)",
        },
        geometry_angles: { topic: "geometry", struggle: "theorem selection" },
        calculus_derivative: {
          topic: "derivatives",
          struggle: "rule selection",
        },
        statistics: { topic: "statistics", struggle: "measure selection" },
        probability: { topic: "probability", struggle: "event counting" },
        biology_concept: { topic: "cell biology", struggle: "concept linkage" },
        definition: { topic: "definitions", struggle: "precise wording" },
        general_academic: null,
      };

      const mapped = map[classification] || null;
      if (mapped) {
        topic = mapped.topic;
        struggle = mapped.struggle;
        topicConf = Math.max(topicConf || 0.5, 0.8);
        struggleConf = Math.max(struggleConf || 0.5, 0.75);
      }
    }

    return {
      ...initial,
      topic,
      struggle,
      topicConfidence: topicConf,
      struggleConfidence: struggleConf,
    };
  }

  detectTopic(content) {
    const text = content.toLowerCase();

    // Similar triangles & geometry proof language
    if (
      /similar\s+to|prove\s+that.*similar|show\s+that.*similar|∼|apqr|asqt/i.test(
        text
      ) ||
      /(area).*(in\s+terms\s+of|k\b)/.test(text)
    ) {
      return { topic: "similar triangles", confidence: 0.9 };
    }

    if (/(sin|cos|tan)\b/.test(text)) {
      return { topic: "trigonometry", confidence: 0.9 };
    }
    if (/(area|perimeter)\b/.test(text)) {
      return { topic: "area and perimeter", confidence: 0.8 };
    }
    if (text.includes("factor") || text.includes("quadratic")) {
      return { topic: "quadratic factoring", confidence: 0.9 };
    }
    if (text.includes("solve") && /[=x]/.test(text)) {
      return { topic: "solving equations", confidence: 0.8 };
    }
    if (text.includes("graph") || text.includes("function")) {
      return { topic: "functions and graphs", confidence: 0.8 };
    }
    if (
      text.includes("circuit") ||
      text.includes("ohm") ||
      text.includes("voltage")
    ) {
      return { topic: "electricity and circuits", confidence: 0.9 };
    }
    if (text.includes("force") || text.includes("acceleration")) {
      return { topic: "mechanics and motion", confidence: 0.9 };
    }

    return { topic: "general problem solving", confidence: 0.5 };
  }

  detectStruggle(content) {
    const text = content.toLowerCase();

    if (/similar/.test(text) && /prove|show/.test(text)) {
      return { struggle: "AA similarity and correspondence", confidence: 0.85 };
    }
    if (/hence\s+find\s+.*x|find\s+x\b/.test(text)) {
      return {
        struggle: "mapping corresponding sides to solve for x",
        confidence: 0.8,
      };
    }
    if (/(area).*(in\s+terms\s+of|k\b)/.test(text)) {
      return {
        struggle: "area ratio after similarity (k to triangle area)",
        confidence: 0.85,
      };
    }

    const patterns = {
      "solving equations": ["solve for", "find x", "isolate", "x ="],
      factoring: ["factor", "factorise", "common factor", "expand"],
      "word problems": ["total cost", "how many", "distance", "rate", "time"],
      graphing: ["graph", "plot", "coordinate", "x-axis", "y-axis"],
      derivatives: ["derivative", "differentiate", "d/dx", "rate of change"],
      "formula application": ["formula", "which formula", "how to use"],
      "calculation errors": ["wrong answer", "calculation", "arithmetic"],
      "conceptual understanding": ["understand", "concept", "why", "how does"],
    };

    let bestMatch = "conceptual understanding";
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

    if (bestMatch === "conceptual understanding")
      bestMatch = "method selection";

    return { struggle: bestMatch, confidence: Math.min(maxScore / 2, 0.8) };
  }

  relatedByTopic(topic = "") {
    const t = (topic || "").toLowerCase();
    const rel = {
      "similar triangles": [
        "AA similarity checklist",
        "corresponding sides order (PQ↔SQ etc.)",
        "ratio chaining and area ratio (k²)",
      ],
      geometry: ["theorem recall", "diagram labeling", "angle relationships"],
      "solving equations": [
        "equation setup",
        "inverse operations",
        "calculation slips",
      ],
      "quadratic equations": [
        "factoring vs formula choice",
        "discriminant use",
        "checking roots",
      ],
      "quadratic factoring": [
        "common factor first",
        "pair-sum method",
        "sign handling",
      ],
      trigonometry: [
        "SOH-CAH-TOA recall",
        "angle selection",
        "unit conversion",
      ],
      "area and perimeter": [
        "formula selection",
        "unit consistency",
        "word-to-math translation",
      ],
      derivatives: ["power rule", "product/chain rule", "notation mistakes"],
      statistics: ["mean/median/mode", "outlier impact", "units of measure"],
      probability: ["set notation", "Venn diagrams", "conditional probability"],
      definitions: ["key terms", "common confusions", "one-sentence clarity"],
      "3d coordinate geometry": [
        "section formula",
        "distance in 3D",
        "plane equations (x=0/y=0/z=0)",
      ],
      "series and sequences": [
        "index shift",
        "telescoping sums",
        "factorial simplification",
      ],
    };
    return rel[t] || ["method steps", "equation setup", "calculation slips"];
  }

  // Existing grade/subject/confidence utilities unchanged ...

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

    let bestGrade = 10;
    let maxScore = 0;

    for (const [grade, keywords] of Object.entries(patterns)) {
      const score = keywords.filter((keyword) => text.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        bestGrade = parseInt(grade);
      }
    }

    const gradeMatch = text.match(/grade\s*(\d+)|gr\s*(\d+)|(\d+)\s*grade/i);
    if (gradeMatch) {
      const explicitGrade = parseInt(
        gradeMatch[1] || gradeMatch[2] || gradeMatch[3]
      );
      if (explicitGrade >= 8 && explicitGrade <= 12) {
        return { grade: explicitGrade, confidence: 0.9 };
      }
    }

    return { grade: bestGrade, confidence: Math.min(maxScore / 2, 0.8) };
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
        "perimeter",
        "area",
        "sin",
        "cos",
        "tan",
        "triangle",
        "similar",
        "prove",
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
        "current",
        "voltage",
      ],
      "Life Sciences": [
        "cell",
        "dna",
        "photosynthesis",
        "organism",
        "ecosystem",
        "biology",
        "mitosis",
        "enzyme",
        "diffusion",
        "osmosis",
      ],
      Geography: [
        "climate",
        "map",
        "population",
        "settlement",
        "contour",
        "scale",
        "topographic",
        "distance",
      ],
      History: [
        "apartheid",
        "democracy",
        "independence",
        "colonial",
        "struggle",
        "resistance",
        "uprising",
        "sources",
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

    let bestSubject = "Mathematics";
    let maxScore = 0;

    for (const [subject, words] of Object.entries(keywords)) {
      const score = words.filter((word) => text.includes(word)).length;
      if (score > maxScore) {
        maxScore = score;
        bestSubject = subject;
      }
    }

    return { subject: bestSubject, confidence: Math.min(maxScore / 3, 0.9) };
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

  calculateOverallConfidence(g, s, t, r, ocrConfidence) {
    const weights = { grade: 0.2, subject: 0.3, topic: 0.3, struggle: 0.2 };
    const weightedScore =
      (g.confidence || 0.5) * weights.grade +
      (s.confidence || 0.5) * weights.subject +
      (t.confidence || 0.5) * weights.topic +
      (r.confidence || 0.5) * weights.struggle;
    return Math.min(0.95, weightedScore * (ocrConfidence || 0.7));
  }
}

module.exports = { ExamPrepImageIntelligence };
