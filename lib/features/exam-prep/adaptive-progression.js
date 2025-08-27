/**
 * Adaptive Difficulty Progression System
 * GOAT Bot 2.0
 * Created: 2025-08-27 09:00:05 UTC
 * Developer: DithetoMokgabudi
 */

class AdaptiveDifficulty {
  constructor() {
    this.difficultyLevels = {
      foundation: 0,
      basic: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    };
  }

  determineNextQuestion(solutionAnalysis, userHistory, currentQuestion) {
    const currentLevel = this.getCurrentDifficultyLevel(userHistory);
    const adjustment = this.calculateDifficultyAdjustment(solutionAnalysis);

    const newLevel = Math.max(0, Math.min(4, currentLevel + adjustment));

    return {
      level: newLevel,
      reasoning: this.getAdjustmentReasoning(adjustment),
      questionType: this.getQuestionTypeForLevel(newLevel, solutionAnalysis),
    };
  }

  getCurrentDifficultyLevel(userHistory) {
    if (!userHistory || !userHistory.length) return this.difficultyLevels.basic;

    // Calculate average performance from recent attempts
    const recentAttempts = userHistory.slice(-5); // Last 5 attempts
    const successRate =
      recentAttempts.filter(
        (attempt) => attempt.analysis?.nextAction === "next_level"
      ).length / recentAttempts.length;

    if (successRate >= 0.8) return this.difficultyLevels.advanced;
    if (successRate >= 0.6) return this.difficultyLevels.intermediate;
    if (successRate >= 0.4) return this.difficultyLevels.basic;
    return this.difficultyLevels.foundation;
  }

  calculateDifficultyAdjustment(analysis) {
    // Perfect solution → increase difficulty
    if (
      analysis.correctMethod &&
      analysis.correctAnswer &&
      analysis.confidence > 0.8
    ) {
      return 1; // Move up one level
    }

    // Good method, small error → stay at level or slight increase
    if (analysis.correctMethod && analysis.confidence > 0.6) {
      return 0; // Stay at current level
    }

    // Wrong method or multiple issues → decrease difficulty
    if (!analysis.correctMethod || analysis.specificIssues.length > 2) {
      return -1; // Move down one level
    }

    // Calculation errors only → slight decrease or same level
    if (analysis.nextAction === "calculation_help") {
      return 0; // Stay at current level with calculation support
    }

    return 0; // Default: no change
  }

  getAdjustmentReasoning(adjustment) {
    const reasons = {
      1: "Great work! Ready for a more challenging problem.",
      0: "Let's practice more at this level to build confidence.",
      [-1]: "Let's build stronger foundations with simpler problems.",
    };

    return reasons[adjustment] || "Continuing with adaptive difficulty.";
  }

  getQuestionTypeForLevel(level, analysis) {
    const types = {
      0: "foundation", // Foundation level
      1: "basic", // Basic application
      2: "standard", // Standard curriculum level
      3: "advanced", // Advanced application
      4: "expert", // Expert/extension level
    };

    return types[level] || "standard";
  }

  generateProgressivePractice(topic, currentLevel, userStruggle) {
    const practiceSequences = {
      solving_equations: {
        0: "x + 3 = 7", // Foundation
        1: "2x + 5 = 11", // Basic
        2: "3x - 7 = 2x + 5", // Standard
        3: "2(x + 3) = 4x - 6", // Advanced
        4: "3(2x - 1) - 2(x + 4) = 5x - 8", // Expert
      },
      quadratic_factoring: {
        0: "x² + 2x", // Common factor only
        1: "x² + 5x + 6", // Simple trinomial
        2: "x² - 5x + 6", // Standard trinomial
        3: "2x² + 7x + 3", // Leading coefficient > 1
        4: "6x² - 11x + 3", // Complex factoring
      },
      area_and_perimeter: {
        0: "Find area of rectangle: length = 4, width = 3",
        1: "Find perimeter of rectangle: length = 6m, width = 4m",
        2: "Rectangle area = 24 cm². If length = 8cm, find width",
        3: "Compound shape: rectangle + triangle area calculation",
        4: "Optimize: find dimensions for maximum area with fixed perimeter",
      },
    };

    const sequence =
      practiceSequences[topic.replace(/\s+/g, "_")] ||
      practiceSequences["solving_equations"];
    return sequence[currentLevel] || sequence[2]; // Default to standard level
  }

  trackUserProgress(userId, questionResult) {
    // Store progress for analytics and personalization
    const progressData = {
      userId,
      timestamp: new Date().toISOString(),
      difficulty: questionResult.difficulty,
      success: questionResult.success,
      timeSpent: questionResult.timeSpent,
      topic: questionResult.topic,
      errors: questionResult.errors || [],
    };

    // This would integrate with analytics system
    console.log(`📊 Progress tracked for ${userId}:`, progressData);
    return progressData;
  }

  getRecommendedStudyPath(userHistory, currentTopic) {
    // Analyze user's strengths and weaknesses to recommend study path
    const topicAnalysis = this.analyzeTopicPerformance(userHistory);

    return {
      nextTopics: this.suggestNextTopics(currentTopic, topicAnalysis),
      reviewTopics: this.identifyWeakAreas(topicAnalysis),
      estimatedTime: this.estimateStudyTime(topicAnalysis),
      confidenceLevel: this.calculateOverallConfidence(topicAnalysis),
    };
  }

  analyzeTopicPerformance(history) {
    const topicPerformance = {};

    if (!history || !history.length) return topicPerformance;

    history.forEach((attempt) => {
      const topic = attempt.topic || "general";
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = {
          attempts: 0,
          successes: 0,
          avgConfidence: 0,
        };
      }

      topicPerformance[topic].attempts++;
      if (attempt.analysis?.nextAction === "next_level") {
        topicPerformance[topic].successes++;
      }
      topicPerformance[topic].avgConfidence +=
        attempt.analysis?.confidence || 0.5;
    });

    // Calculate success rates and average confidence
    Object.keys(topicPerformance).forEach((topic) => {
      const data = topicPerformance[topic];
      data.successRate = data.successes / data.attempts;
      data.avgConfidence = data.avgConfidence / data.attempts;
    });

    return topicPerformance;
  }

  suggestNextTopics(currentTopic, performance) {
    // Topic progression maps
    const progressionMap = {
      solving_equations: ["systems_of_equations", "quadratic_equations"],
      quadratic_factoring: ["quadratic_formula", "completing_the_square"],
      basic_trigonometry: ["trig_equations", "trig_identities"],
      area_and_perimeter: ["volume_and_surface_area", "coordinate_geometry"],
    };

    const currentPerf = performance[currentTopic];
    if (currentPerf && currentPerf.successRate >= 0.7) {
      return progressionMap[currentTopic] || ["advanced_applications"];
    }

    return [currentTopic]; // Continue with current topic
  }

  identifyWeakAreas(performance) {
    return Object.keys(performance)
      .filter((topic) => performance[topic].successRate < 0.5)
      .sort((a, b) => performance[a].successRate - performance[b].successRate);
  }

  estimateStudyTime(performance) {
    // Estimate time needed based on performance
    const weakAreas = this.identifyWeakAreas(performance);
    const baseTime = 30; // 30 minutes per topic

    return weakAreas.length * baseTime + Object.keys(performance).length * 15;
  }

  calculateOverallConfidence(performance) {
    if (!Object.keys(performance).length) return 0.5;

    const avgConfidence =
      Object.values(performance).reduce(
        (sum, topic) => sum + topic.avgConfidence,
        0
      ) / Object.keys(performance).length;

    return Math.max(0.1, Math.min(0.9, avgConfidence));
  }
}

module.exports = { AdaptiveDifficulty };


