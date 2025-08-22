/**
 * Homework Help Response System
 * Enhanced OCR feedback with intelligent fallbacks
 * User: sophoniagoat
 * Created: 2025-08-22 09:03:55 UTC
 */

class HomeworkResponseSystem {
  generateOCRFeedback(ocrResult, userId) {
    const confidence = ocrResult.confidence;
    const attemptNumber = ocrResult.attemptNumber;

    console.log(
      `📊 Generating OCR feedback: confidence=${confidence.toFixed(
        2
      )}, attempt=${attemptNumber}`
    );

    if (confidence >= 0.75) {
      return this.generateHighConfidenceResponse(ocrResult);
    } else if (confidence >= 0.6) {
      return this.generateMediumConfidenceResponse(ocrResult);
    } else {
      return this.generateLowConfidenceResponse(
        ocrResult,
        userId,
        attemptNumber
      );
    }
  }

  generateHighConfidenceResponse(ocrResult) {
    return {
      success: true,
      message: `📚 **Homework image processed successfully!**`,
      confidence: ocrResult.confidence,
      proceedToQuestionDetection: true,
    };
  }

  generateMediumConfidenceResponse(ocrResult) {
    return {
      success: true,
      message: `📚 **Image processed with decent quality.**

I can see some text, but some parts might need clarification as we go.`,
      confidence: ocrResult.confidence,
      proceedToQuestionDetection: true,
      needsCarefulValidation: true,
    };
  }

  generateLowConfidenceResponse(ocrResult, userId, attemptNumber) {
    const { homeworkOCR } = require("./homework-core");

    if (attemptNumber === 1) {
      // First attempt failed - ask for better image
      return {
        success: false,
        message: this.generateFirstAttemptGuidance(ocrResult),
        confidence: ocrResult.confidence,
        needsBetterImage: true,
        attemptNumber: 1,
      };
    } else if (attemptNumber === 2) {
      // Second attempt failed - offer text input
      return {
        success: false,
        message: this.generateSecondAttemptFallback(),
        confidence: ocrResult.confidence,
        switchToTextInput: true,
        attemptNumber: 2,
      };
    } else {
      // Third+ attempt - should not happen with proper flow
      return {
        success: false,
        message: `📝 **Let's try typing your question instead.**

This will help me understand exactly what you need help with.`,
        confidence: ocrResult.confidence,
        forceTextInput: true,
        attemptNumber: attemptNumber,
      };
    }
  }

  generateFirstAttemptGuidance(ocrResult) {
    const qualityIssues = this.identifyQualityIssues(ocrResult);

    let guidance = `📸 **I'm having trouble reading your homework clearly.**

**Please take a new photo with these tips:**`;

    // Add specific guidance based on detected issues
    if (qualityIssues.includes("lowLight")) {
      guidance += `\n• ☀️ **Better lighting** - avoid shadows on the paper`;
    }
    if (qualityIssues.includes("blurry")) {
      guidance += `\n• 📱 **Hold steady** - keep camera still while taking photo`;
    }
    if (qualityIssues.includes("tooFar")) {
      guidance += `\n• 🔍 **Get closer** - fill the frame with your homework`;
    }
    if (qualityIssues.includes("angle")) {
      guidance += `\n• 📐 **Straight angle** - hold camera directly over the paper`;
    }

    // Always include these general tips
    guidance += `\n• ✅ **Clear text** - make sure all writing is visible
• ✅ **No glare** - avoid reflections from lights
• ✅ **Flat paper** - smooth out any wrinkles

**Upload your improved photo when ready!**`;

    return guidance;
  }

  identifyQualityIssues(ocrResult) {
    const issues = [];

    // Analyze quality metrics to identify specific problems
    if (ocrResult.qualityMetrics) {
      const metrics = ocrResult.qualityMetrics;

      if (metrics.avgBoundingBoxSize < 100) issues.push("tooFar");
      if (metrics.textBlockCount < 5) issues.push("lowLight");
      if (!metrics.hasStructure) issues.push("angle");
    }

    // Check confidence pattern for blur detection
    if (ocrResult.confidence < 0.3) issues.push("blurry");
    if (ocrResult.confidence < 0.5 && ocrResult.confidence > 0.2)
      issues.push("lowLight");

    return issues;
  }

  generateSecondAttemptFallback() {
    return `📝 **Let's try a different approach!**

Since the image quality isn't working well, **please type out the question you're stuck on.**

For example:
*"Question 2: Find the area of a triangle with base = 8cm and height = 6cm"*

**Type your homework question below and I'll help you get unstuck!**

⚡ **This often works even better than images!**`;
  }

  generatePoliteDecline(painpoint, attempts) {
    return `😔 **I'm sorry, I'm having trouble understanding your specific challenge.**

**What we tried:**
• ${attempts.join("\n• ")}

**Here's what I recommend:**
🎓 **Ask your teacher** - they can see your work and give personalized help
📚 **Study with classmates** - peer learning often helps
💻 **Check your textbook** - similar examples with step-by-step solutions
🔄 **Try Menu Option 1** - practice similar problems to build confidence

**I'm here when you have a clearer question!**

Type "menu" to return to main options.`;
  }
}

// Export singleton
const homeworkResponses = new HomeworkResponseSystem();
module.exports = { homeworkResponses };

