/**
 * Subject Knowledge Database
 * GOAT Bot 2.0
 * Updated: 2025-08-23 14:58:19 UTC
 */

// Subject availability status
const SUBJECT_STATUS = {
  MATHEMATICS: {
    available: true,
    name: "Mathematics",
    alias: ["math", "maths", "mathematics"],
  },
  PHYSICAL_SCIENCES: {
    available: false,
    name: "Physical Sciences",
    alias: ["physics", "physical", "chemistry"],
    coming_soon: true,
  },
  LIFE_SCIENCES: {
    available: false,
    name: "Life Sciences",
    alias: ["biology", "life"],
    coming_soon: true,
  },
  ENGLISH: {
    available: false,
    name: "English",
    alias: ["english"],
    coming_soon: true,
  },
};

// Dynamic knowledge base
const SUBJECT_PROBING_DATABASE = {
  Mathematics: {
    algebra: {
      examples: [
        "Solving equations (like 2x + 5 = 15)",
        "Factoring expressions (like x² + 5x + 6)",
        "Simplifying expressions (like 3x + 2x)",
        "Substitution (plugging numbers into formulas)",
      ],
      common_struggles: [
        "I don't know which method to use",
        "I get confused with the steps",
        "I make calculation mistakes",
        "I don't understand what X means",
      ],
      diagnostic_question: {
        questionText:
          "Solve for x: 2x + 7 = 19\n\nShow all your working steps.",
        solution:
          "**Step 1:** Subtract 7 from both sides\n2x = 12\n\n**Step 2:** Divide both sides by 2\nx = 6\n\n**Therefore:** x = 6",
        purpose: "Basic equation solving",
      },
    },
    // Rest of the math topics...
    geometry: {
      /* content */
    },
    trigonometry: {
      /* content */
    },
    functions: {
      /* content */
    },
  },
  "Physical Sciences": {
    physics: {
      /* content */
    },
    chemistry: {
      /* content */
    },
  },
};

// Subject availability checker
function checkSubjectAvailability(subjectInput) {
  const input = subjectInput.toLowerCase();

  for (const [key, subject] of Object.entries(SUBJECT_STATUS)) {
    for (const alias of subject.alias) {
      if (input.includes(alias)) {
        return {
          detected: subject.name,
          available: subject.available,
          coming_soon: subject.coming_soon || false,
          key: key,
        };
      }
    }
  }

  return {
    detected: "Mathematics",
    available: true,
    coming_soon: false,
    key: "MATHEMATICS",
  };
}

module.exports = {
  SUBJECT_STATUS,
  SUBJECT_PROBING_DATABASE,
  checkSubjectAvailability,
};

