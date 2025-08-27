// lib/features/exam-prep/psychological-report.js
const { STRUGGLE_STATISTICS } = require("./social-proof");

class PsychologicalReportGenerator {
  generateReport(intelligence, imageAnalysis) {
    console.log(`🧠 Generating psychological report for user`);

    const report = {
      socialProof: this.getStruggleStatistics(intelligence.topic),
      effortRecognition: this.analyzeEffortFromImage(
        intelligence,
        imageAnalysis
      ),
      confidenceBuilders: this.identifyExistingStrengths(intelligence),
      specificHope: this.generateSpecificSolution(intelligence),
      urgencyRelief: this.generateUrgencyRelief(intelligence),
    };

    return this.formatPsychologicalReport(report, intelligence);
  }

  getStruggleStatistics(topic) {
    const defaultStats = {
      percentage: 70,
      context: "students when they first encounter this",
    };

    // Normalize topic for lookup
    const normalizedTopic = topic.toLowerCase().replace(/\s+/g, "_");

    return STRUGGLE_STATISTICS[normalizedTopic] || defaultStats;
  }

  analyzeEffortFromImage(intelligence, imageAnalysis) {
    const effort = {
      hasWorkingShown: false,
      hasErasures: false,
      multipleAttempts: false,
      organized: false,
    };

    // Analyze extracted text for effort indicators
    const text = imageAnalysis?.extractedText || "";

    effort.hasWorkingShown = /step|=|solve|find|working/i.test(text);
    effort.hasErasures = intelligence.confidence < 0.7; // Proxy for messy work
    effort.multipleAttempts = text.split("\n").length > 3;
    effort.organized = /step|1\.|2\.|firstly|then|next/i.test(text);

    return this.generateEffortFeedback(effort);
  }

  generateEffortFeedback(effort) {
    const feedbacks = [];

    if (effort.hasWorkingShown) {
      feedbacks.push(
        "I can see you've been trying to work through this - that's exactly the right approach"
      );
    }

    if (effort.multipleAttempts) {
      feedbacks.push(
        "I notice you tried multiple approaches - that shows real problem-solving thinking"
      );
    }

    if (effort.organized) {
      feedbacks.push(
        "Your organized approach shows you care about getting this right"
      );
    }

    if (effort.hasErasures) {
      feedbacks.push(
        "I can see you're working hard on this - persistence is key to mastering these concepts"
      );
    }

    return feedbacks.length > 0
      ? feedbacks[0]
      : "I can see you're working on this problem";
  }

  identifyExistingStrengths(intelligence) {
    // Map current struggle to already-mastered prerequisites
    const prerequisiteMap = {
      "quadratic factoring": [
        "basic algebra",
        "distributive property",
        "like terms",
      ],
      trigonometry: [
        "ratio understanding",
        "basic geometry",
        "angle properties",
      ],
      "solving equations": ["arithmetic", "number operations", "basic algebra"],
      "functions and graphs": [
        "coordinate systems",
        "number patterns",
        "input-output relationships",
      ],
      "electricity and circuits": [
        "basic mathematics",
        "logical thinking",
        "measurement",
      ],
      "mechanics and motion": [
        "measurement",
        "mathematical relationships",
        "logical reasoning",
      ],
    };

    const topic = intelligence.topic.toLowerCase();

    // Find matching prerequisites
    for (const [key, strengths] of Object.entries(prerequisiteMap)) {
      if (topic.includes(key.split(" ")[0])) {
        return strengths;
      }
    }

    return ["basic mathematical reasoning", "problem-solving attitude"];
  }

  generateSpecificSolution(intelligence) {
    const solutions = {
      "quadratic factoring": "a 3-step pattern that works every time",
      "solving equations": "the balance scale method that makes it visual",
      trigonometry: "the SOH-CAH-TOA story method that sticks",
      "functions and graphs": "a systematic graphing approach",
      "electricity and circuits":
        "the water flow analogy that makes circuits clear",
      "mechanics and motion": "visual techniques that make forces obvious",
      "area and perimeter": "formula patterns you'll never forget",
      "word problems": "a translation method that turns words into math",
    };

    const topic = intelligence.topic.toLowerCase();

    // Find matching solution
    for (const [key, solution] of Object.entries(solutions)) {
      if (topic.includes(key.split(" ")[0])) {
        return solution;
      }
    }

    return "a step-by-step method designed for your exact challenge";
  }

  generateUrgencyRelief(intelligence) {
    const urgencyPhrases = [
      "You're not behind - you're exactly where you need to be to make real progress",
      "This feeling of being stuck is actually the moment before breakthrough",
      "Thousands of SA students master this every year - you're next",
      "The fact that you're asking for help shows you're ready to learn",
    ];

    // Select based on confidence level
    const confidenceScore = intelligence.confidenceLevel.score;

    if (confidenceScore < 0.3) {
      return urgencyPhrases[0]; // Most reassuring
    } else if (confidenceScore < 0.6) {
      return urgencyPhrases[1]; // Breakthrough focused
    } else {
      return urgencyPhrases[2]; // Achievement focused
    }
  }

  formatPsychologicalReport(data, intelligence) {
    const report = `🎯 **I can see exactly what's happening here**

📚 **Topic:** ${intelligence.topic} (${intelligence.subject})
${data.effortRecognition}

💡 **You're not alone:** ${data.socialProof.percentage}% of ${
      data.socialProof.context
    } find this challenging initially.

🔥 **What you already know:** ${data.confidenceBuilders.join(
      ", "
    )} - that's the foundation. This is just the next logical step.

⚡ **My solution:** I'll show you ${data.specificHope} that makes this click.

✨ **The truth:** ${data.urgencyRelief}

**Ready? Let's turn this confusion into confidence in the next 15 minutes.**`;

    return report;
  }
}

module.exports = { PsychologicalReportGenerator };
