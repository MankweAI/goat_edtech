// lib/features/exam-prep/social-proof.js
const STRUGGLE_STATISTICS = {
  quadratic_factoring: {
    percentage: 78,
    context: "Grade 10 students",
    solution: "a 3-step pattern that works every time",
  },
  trigonometry: {
    percentage: 82,
    context: "students in their first month",
    solution: "the SOH-CAH-TOA story method",
  },
  solving_equations: {
    percentage: 65,
    context: "students initially",
    solution: "the balance scale method that makes it visual",
  },
  functions_and_graphs: {
    percentage: 71,
    context: "students when starting functions",
    solution: "a systematic graphing approach",
  },
  electricity_and_circuits: {
    percentage: 85,
    context: "Physical Sciences students",
    solution: "the water flow analogy that makes circuits clear",
  },
  mechanics_and_motion: {
    percentage: 79,
    context: "students learning physics",
    solution: "visual techniques that make forces obvious",
  },
  area_and_perimeter: {
    percentage: 58,
    context: "students with geometry",
    solution: "formula patterns you'll never forget",
  },
  word_problems: {
    percentage: 89,
    context: "students across all grades",
    solution: "a translation method that turns words into math",
  },
};

const EFFORT_RECOGNITION_PATTERNS = {
  working_shown:
    "I can see you've been trying to work through this - that's exactly the right approach",
  multiple_attempts:
    "I notice you tried multiple approaches - that shows real problem-solving thinking",
  organized_work:
    "Your organized approach shows you care about getting this right",
  persistence:
    "I can see you're working hard on this - persistence is key to mastering these concepts",
  partial_solution:
    "You've made good progress - let's build on what you already have",
};

const CONFIDENCE_BUILDERS = {
  mathematics: [
    "basic arithmetic",
    "number relationships",
    "pattern recognition",
    "logical thinking",
    "problem-solving attitude",
  ],
  physical_sciences: [
    "measurement skills",
    "mathematical relationships",
    "logical reasoning",
    "observation skills",
    "scientific thinking",
  ],
  general: [
    "analytical thinking",
    "persistence",
    "learning attitude",
    "basic reasoning skills",
  ],
};

module.exports = {
  STRUGGLE_STATISTICS,
  EFFORT_RECOGNITION_PATTERNS,
  CONFIDENCE_BUILDERS,
};

