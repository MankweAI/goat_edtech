/**
 * Solution Analysis System
 * GOAT Bot 2.0
 * Created: 2025-08-27 09:00:05 UTC
 * Developer: DithetoMokgabudi
 */

const { processImage } = require("../../utils/image-processing");

class SolutionAnalyzer {
  async analyzeSolution(userSolutionImage, currentQuestion, userContext) {
    console.log(`🔍 Analyzing user's solution attempt`);

    try {
      // Extract text from solution image
      const ocrResult = await processImage(
        userSolutionImage,
        userContext.id,
        "solution_analysis"
      );

      if (!ocrResult.success) {
        return this.generateSolutionUploadError();
      }

      const analysis = await this.evaluateSolution(
        ocrResult.text,
        currentQuestion,
        userContext
      );

      // Store solution attempt
      userContext.user_solutions = userContext.user_solutions || [];
      userContext.user_solutions.push({
        questionId: currentQuestion.contentId,
        attempt: ocrResult.text,
        analysis: analysis,
        timestamp: new Date().toISOString(),
        imageHash: ocrResult.imageHash,
      });

      return analysis;
    } catch (error) {
      console.error("Solution analysis failed:", error);
      return this.generateAnalysisError();
    }
  }

  async evaluateSolution(solutionText, question, userContext) {
    const analysis = {
      correctMethod: false,
      correctAnswer: false,
      errorLocation: null,
      specificIssues: [],
      strength: null,
      nextAction: "retry",
      confidence: 0.5,
    };

    // Method detection
    analysis.correctMethod = this.detectCorrectMethod(solutionText, question);

    // Answer validation (simplified pattern matching)
    analysis.correctAnswer = this.validateAnswer(solutionText, question);

    // Error pattern recognition
    analysis.specificIssues = this.detectErrorPatterns(solutionText, question);

    // Determine next action
    analysis.nextAction = this.determineNextAction(analysis);

    // Calculate confidence
    analysis.confidence = this.calculateAnalysisConfidence(
      analysis,
      solutionText
    );

    return analysis;
  }

  detectCorrectMethod(solution, question) {
    // Simple pattern matching for now
    const questionType = question.type || "general";

    if (
      questionType.includes("factoring") ||
      question.questionText.includes("factor")
    ) {
      return solution.includes("(") && solution.includes(")");
    }
    if (
      questionType.includes("equation") ||
      question.questionText.includes("solve")
    ) {
      return (
        solution.includes("=") &&
        (solution.includes("x") || /\d+/.test(solution))
      );
    }
    if (question.questionText.includes("area")) {
      return (
        solution.includes("×") ||
        solution.includes("*") ||
        /\d+\s*\*\s*\d+/.test(solution)
      );
    }

    // Default: look for mathematical working
    return /\d+|\+|\-|\*|\/|=/.test(solution);
  }

  validateAnswer(solution, question) {
    // Extract final answer from solution
    const answerPatterns = [
      /=\s*(\d+\.?\d*)/, // = 42
      /answer:\s*(\d+\.?\d*)/i, // Answer: 42
      /x\s*=\s*(\d+\.?\d*)/, // x = 42
      /(\d+\.?\d*)\s*$/, // Number at end
    ];

    for (const pattern of answerPatterns) {
      const match = solution.match(pattern);
      if (match) {
        const userAnswer = parseFloat(match[1]);
        // For now, we can't validate without the correct answer
        // This would be enhanced with question-specific answer checking
        return !isNaN(userAnswer);
      }
    }

    return false;
  }

  detectErrorPatterns(solution, question) {
    const issues = [];

    // Common error patterns
    if (solution.length < 10) {
      issues.push("solution_too_brief");
    }

    if (!solution.includes("=") && question.questionText.includes("solve")) {
      issues.push("no_equation_setup");
    }

    if (!/\d/.test(solution)) {
      issues.push("no_calculation_shown");
    }

    // Check for common mathematical errors
    if (solution.includes("+-") || solution.includes("-+")) {
      issues.push("sign_error");
    }

    if (solution.split("\n").length < 2 && solution.length > 20) {
      issues.push("no_step_structure");
    }

    return issues;
  }

  determineNextAction(analysis) {
    if (analysis.correctAnswer && analysis.correctMethod) {
      return "next_level";
    } else if (analysis.correctMethod && !analysis.correctAnswer) {
      return "calculation_help";
    } else if (!analysis.correctMethod) {
      return "method_guidance";
    } else if (analysis.specificIssues.length > 2) {
      return "foundation_review";
    }
    return "retry";
  }

  calculateAnalysisConfidence(analysis, solutionText) {
    let confidence = 0.5;

    // Boost confidence if method is detected correctly
    if (analysis.correctMethod) confidence += 0.3;

    // Boost if answer format is correct
    if (analysis.correctAnswer) confidence += 0.2;

    // Reduce confidence for multiple issues
    confidence -= analysis.specificIssues.length * 0.1;

    // Consider solution length and structure
    if (solutionText.length > 20 && solutionText.includes("\n")) {
      confidence += 0.1; // Well-structured solution
    }

    return Math.max(0.1, Math.min(0.9, confidence));
  }

  generateSolutionUploadError() {
    return {
      correctMethod: false,
      correctAnswer: false,
      nextAction: "retry",
      specificIssues: ["upload_error"],
      confidence: 0,
      errorMessage:
        "I couldn't read your solution. Please upload a clearer photo.",
    };
  }

  generateAnalysisError() {
    return {
      correctMethod: false,
      correctAnswer: false,
      nextAction: "retry",
      specificIssues: ["analysis_error"],
      confidence: 0,
      errorMessage: "I had trouble analyzing your solution. Please try again.",
    };
  }
}

module.exports = { SolutionAnalyzer };

