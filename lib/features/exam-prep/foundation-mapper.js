// lib/features/exam-prep/foundation-mapper.js
/**
 * Add normalization for "similar triangles" → geometry chain
 * (keeps chains as-is; only mapping updated)
 */
const FOUNDATION_CHAINS = {
  // Mathematics foundation chains
  quadratic_factoring: [
    {
      grade: 9,
      concepts: ["basic_factoring", "distributive_property", "like_terms"],
      description: "Basic factoring and algebraic manipulation",
    },
    {
      grade: 8,
      concepts: ["arithmetic_operations", "negative_numbers", "fractions"],
      description: "Fundamental arithmetic and number operations",
    },
  ],

  trigonometry: [
    {
      grade: 9,
      concepts: ["pythagoras_theorem", "ratio_proportion", "similar_triangles"],
      description: "Triangle properties and ratios",
    },
    {
      grade: 8,
      concepts: ["angle_properties", "basic_geometry", "measurement"],
      description: "Basic geometric concepts",
    },
  ],

  solving_equations: [
    {
      grade: 9,
      concepts: ["linear_equations", "substitution", "like_terms"],
      description: "Linear equation solving techniques",
    },
    {
      grade: 8,
      concepts: ["basic_algebra", "arithmetic", "order_of_operations"],
      description: "Fundamental algebraic thinking",
    },
  ],

  functions_graphs: [
    {
      grade: 10,
      concepts: ["coordinate_geometry", "linear_functions", "table_of_values"],
      description: "Basic function concepts and graphing",
    },
    {
      grade: 9,
      concepts: ["number_patterns", "input_output", "sequences"],
      description: "Pattern recognition and relationships",
    },
  ],

  // Geometry chain (covers similarity)
  geometry: [
    {
      grade: 9,
      concepts: ["angle_properties", "parallel_lines", "ratio_proportion"],
      description: "Angle facts and proportional reasoning",
    },
    {
      grade: 8,
      concepts: ["basic_geometry", "measurement"],
      description: "Basic geometric concepts",
    },
  ],

  // Physical Sciences foundation chains
  electricity_circuits: [
    {
      grade: 10,
      concepts: ["basic_electricity", "current_voltage", "ohms_law"],
      description: "Fundamental electrical concepts",
    },
    {
      grade: 9,
      concepts: ["atoms_electrons", "conductors_insulators", "energy"],
      description: "Basic atomic structure and energy",
    },
  ],

  mechanics_motion: [
    {
      grade: 10,
      concepts: ["velocity_acceleration", "distance_time", "force_concepts"],
      description: "Basic motion and force concepts",
    },
    {
      grade: 9,
      concepts: ["measurement", "units", "basic_physics"],
      description: "Measurement and basic physics principles",
    },
  ],
};

class FoundationGapDetector {
  detectFoundationGaps(currentTopic, currentGrade, strugggleEvidence) {
    console.log(
      `🔍 Detecting foundation gaps for ${currentTopic} at Grade ${currentGrade}`
    );

    const normalizedTopic = this.normalizeTopic(currentTopic);
    const foundationChain = FOUNDATION_CHAINS[normalizedTopic];

    if (!foundationChain) {
      return this.generateGenericGaps(currentTopic, currentGrade);
    }

    const gaps = [];

    for (const level of foundationChain) {
      if (level.grade < currentGrade) {
        gaps.push({
          grade: level.grade,
          concepts: level.concepts,
          description: level.description,
          priority: this.calculateGapPriority(
            level.grade,
            currentGrade,
            strugggleEvidence
          ),
        });
      }
    }

    gaps.sort((a, b) => b.priority - a.priority);
    return gaps.slice(0, 3);
  }

  normalizeTopic(topic) {
    const t = (topic || "").toLowerCase();
    const topicMap = {
      "quadratic factoring": "quadratic_factoring",
      factoring: "quadratic_factoring",
      quadratics: "quadratic_factoring",
      trigonometry: "trigonometry",
      trig: "trigonometry",
      "solving equations": "solving_equations",
      equations: "solving_equations",
      "functions and graphs": "functions_graphs",
      functions: "functions_graphs",
      graphing: "functions_graphs",
      "series and sequences": "series_sequences", // legacy mapping retained if used elsewhere
      series: "series_sequences",
      sequences: "series_sequences",
      "3d coordinate geometry": "coordinate_geometry_3d",

      // Geometry & similarity aliases
      geometry: "geometry",
      "similar triangles": "geometry",
      "triangle similarity": "geometry",
      similarity: "geometry",

      // Physical sciences
      "electricity and circuits": "electricity_circuits",
      electricity: "electricity_circuits",
      circuits: "electricity_circuits",
      "mechanics and motion": "mechanics_motion",
      mechanics: "mechanics_motion",
      motion: "mechanics_motion",
    };

    return topicMap[t] || "geometry"; // prefer geometry over "general" for math diagrams
  }

  calculateGapPriority(gapGrade, currentGrade, struggle) {
    let priority = 1.0;

    const gradeDistance = currentGrade - gapGrade;
    priority -= gradeDistance * 0.1;

    const struggleKeywords = {
      "solving equations": ["solving", "equation", "isolate"],
      factoring: ["factor", "expand", "multiply"],
      "word problems": ["word", "problem", "translate"],
      "calculation errors": ["calculation", "arithmetic", "compute"],
      // Similarity hints
      geometry: ["similar", "correspond", "ratio", "area"],
    };

    for (const [gapType, keywords] of Object.entries(struggleKeywords)) {
      if (
        String(struggle || "")
          .toLowerCase()
          .split(/\s+/)
          .some((w) => keywords.some((k) => w.includes(k)))
      ) {
        priority += 0.3;
        break;
      }
    }

    return Math.max(0.1, Math.min(1.0, priority));
  }

  generateGenericGaps(topic, grade) {
    const genericGaps = [];

    if (grade > 8) {
      genericGaps.push({
        grade: grade - 1,
        concepts: [
          `foundational_${(topic || "geometry").replace(/\s+/g, "_")}`,
        ],
        description: `Basic concepts for ${topic || "geometry"}`,
        priority: 0.8,
      });
    }

    if (grade > 9) {
      genericGaps.push({
        grade: 8,
        concepts: ["fundamental_skills"],
        description: "Core mathematical reasoning",
        priority: 0.6,
      });
    }

    return genericGaps;
  }

  getFoundationQuestions(gaps) {
    const questions = [];

    for (const gap of gaps.slice(0, 2)) {
      const question = this.generateFoundationQuestion(gap);
      if (question) {
        questions.push(question);
      }
    }

    return questions;
  }

  generateFoundationQuestion(gap) {
    const templates = {
      basic_factoring: {
        questionText: "Factor completely: 3x + 6",
        solution: "3x + 6 = 3(x + 2)",
        purpose: "Basic factoring with common factors",
      },
      distributive_property: {
        questionText: "Expand: 2(x + 3)",
        solution: "2(x + 3) = 2x + 6",
        purpose: "Understanding distribution",
      },
      linear_equations: {
        questionText: "Solve: 2x + 5 = 11",
        solution: "2x = 6, so x = 3",
        purpose: "Basic equation solving",
      },
      pythagoras_theorem: {
        questionText:
          "In a right triangle with legs 3 and 4, find the hypotenuse.",
        solution: "c² = 3² + 4² = 9 + 16 = 25, so c = 5",
        purpose: "Applying Pythagoras theorem",
      },
      // Geometry ratios (lightweight foundation)
      ratio_proportion: {
        questionText:
          "Two similar triangles have a side scale factor of 3:2. What is the ratio of their areas?",
        solution: "Area ratio = (3/2)² = 9:4",
        purpose: "Area ratio from similarity",
      },
    };

    for (const concept of gap.concepts || []) {
      if (templates[concept]) {
        return {
          ...templates[concept],
          grade: gap.grade,
          gapType: concept,
        };
      }
    }

    return null;
  }
}

module.exports = { FoundationGapDetector, FOUNDATION_CHAINS };
