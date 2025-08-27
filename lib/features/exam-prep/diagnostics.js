// lib/features/exam-prep/diagnostics.js
/**
 * Exam Prep Diagnostic System
 * GOAT Bot 2.0
 * Created: 2025-08-27 09:47:00 UTC
 * Developer: DithetoMokgabudi
 */

const { SUBJECT_PROBING_DATABASE } = require("../../data/subject-database");

/**
 * Get a diagnostic question for a specific subject and topic
 * @param {string} subject - Academic subject
 * @param {string} topic - Specific topic
 * @returns {Promise<Object>} - Diagnostic question
 */
async function getDiagnosticQuestion(subject, topic) {
  console.log(`🔍 Getting diagnostic question for ${subject} - ${topic}`);

  const subjectData = SUBJECT_PROBING_DATABASE[subject];
  if (!subjectData) {
    throw new Error(`No diagnostic questions available for ${subject}`);
  }

  // Find topic-specific diagnostic
  const topicKey = topic.toLowerCase().replace(/\s+/g, "_");
  const topicData =
    subjectData[topicKey] || subjectData[Object.keys(subjectData)[0]];

  if (topicData && topicData.diagnostic_question) {
    return {
      questionText: topicData.diagnostic_question.questionText,
      solution: topicData.diagnostic_question.solution,
      purpose: topicData.diagnostic_question.purpose,
      subject,
      topic,
    };
  }

  // Generic diagnostic fallback
  return {
    questionText: `Try to solve a basic ${topic} problem. Show all your working steps.`,
    solution:
      "Work through this step by step, showing each stage of your thinking.",
    purpose: `Basic ${topic} diagnostic`,
    subject,
    topic,
  };
}

/**
 * Analyze a diagnostic answer to identify specific issues
 * @param {string} userAnswer - User's answer attempt
 * @param {Object} diagnosticQuestion - The diagnostic question
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeDiagnosticAnswer(userAnswer, diagnosticQuestion) {
  console.log(`🔍 Analyzing diagnostic answer: "${userAnswer}"`);

  const analysis = {
    specific_issues: [],
    confidence_level: "medium",
    feedback: "",
    understanding_gaps: [],
  };

  const answer = userAnswer.toLowerCase().trim();

  // Check for specific issue patterns
  if (answer.length < 10) {
    analysis.specific_issues.push("too_brief");
    analysis.confidence_level = "low";
  }

  if (answer.includes("don't know") || answer.includes("no idea")) {
    analysis.specific_issues.push("uncertainty_expressed");
    analysis.confidence_level = "low";
  }

  if (!/\d+|\+|\-|\*|\/|=/.test(answer)) {
    analysis.specific_issues.push("no_calculation_shown");
  }

  if (answer.includes("stuck") || answer.includes("confused")) {
    analysis.specific_issues.push("procedural_confusion");
  }

  // Generate feedback based on issues
  if (analysis.specific_issues.length === 0) {
    analysis.feedback =
      "I can see you're engaging with the problem. Let me help you build on this.";
  } else if (analysis.specific_issues.includes("uncertainty_expressed")) {
    analysis.feedback =
      "It's okay to feel uncertain. Let's break this down into smaller, manageable steps.";
  } else if (analysis.specific_issues.includes("no_calculation_shown")) {
    analysis.feedback =
      "I can see you're thinking about this. Try showing your working steps, even if you're not sure.";
  } else {
    analysis.feedback = "Let me help you approach this systematically.";
  }

  return analysis;
}

module.exports = {
  getDiagnosticQuestion,
  analyzeDiagnosticAnswer,
};

