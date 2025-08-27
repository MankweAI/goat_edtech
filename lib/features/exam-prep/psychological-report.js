// // lib/features/exam-prep/psychological-report.js
/**
 * Psychological + Technical Report (concise variant added)
 * Developer: DithetoMokgabudi
 * Updated: 2025-08-27 13:10:00 UTC
 */
const { STRUGGLE_STATISTICS } = require("./social-proof");

class PsychologicalReportGenerator {
  // New concise report: no purpose/end‑goal/study plan
  generateConciseReport(intelligence, options = {}) {
    const { extractedText, confidence, foundationGaps = [] } = options;

    const subject = intelligence.subject || "Mathematics";
    const topic = intelligence.topic || "general problem solving";
    const effortLine = this.analyzeEffortFromImage(
      { ...intelligence, overallConfidence: intelligence.overallConfidence },
      { extractedText, confidence }
    );
    const techDiagnosis = this.buildTechnicalDiagnosis(
      foundationGaps,
      intelligence.struggle || "conceptual understanding"
    );
    const strengths = this.identifyExistingStrengths({ topic });
    const solutionHook = this.generateSpecificSolution({ topic });

    // Use social proof lightly (no stats overload)
    const social = this.getStruggleStatistics(topic);

    const related = this.getRelatedPainPoints(intelligence);
    const relatedLine =
      related && related.length
        ? related
            .slice(0, 3)
            .map((r) => `• ${r}`)
            .join("\n")
        : "• related problem-solving techniques";

    return `🎯 **I can see what's happening**

📸 **What I detected:** ${topic} with ${intelligence.struggle}
*${effortLine}*

💡 Many students hit this wall initially — you’re not alone.

⚙️ **Why it feels hard (technical):**
${techDiagnosis}

✅ **What you already have:** ${strengths.join(", ")}
⚡ **How we’ll make it click:** ${solutionHook}

📌 **You might also be shaky on:**
${relatedLine}`;
  }

  // Existing full generator preserved for other contexts
  generateReport(intelligence, options = {}) {
    const {
      extractedText,
      confidence,
      foundationGaps = [],
      timeHorizonDays = 2,
      gradeOverride = 10,
    } = options;

    const grade = gradeOverride || intelligence.grade || 10;
    const subject = intelligence.subject || "Mathematics";
    const topic = intelligence.topic || "general problem solving";
    const struggle = intelligence.struggle || "conceptual understanding";

    const social = this.getStruggleStatistics(topic);
    const effortLine = this.analyzeEffortFromImage(
      { ...intelligence, overallConfidence: intelligence.overallConfidence },
      { extractedText, confidence }
    );
    const strengths = this.identifyExistingStrengths({ topic });
    const solutionHook = this.generateSpecificSolution({ topic });
    const related = this.getRelatedPainPoints(intelligence);
    const techDiagnosis = this.buildTechnicalDiagnosis(foundationGaps, struggle);

    const purpose = `Master ${topic} (${subject}, Grade ${grade}) for your test in ${timeHorizonDays} day${
      timeHorizonDays === 1 ? "" : "s"
    }`;
    const endGoal =
      "By the end, you should solve any standard CAPS question in this topic with 80%+ confidence under timed conditions.";

    const plan = this.buildTwoDayPlan(topic);

    return this.format({
      subject,
      topic,
      grade,
      effortLine,
      social,
      strengths,
      solutionHook,
      related,
      techDiagnosis,
      purpose,
      endGoal,
      plan,
    });
  }

  getStruggleStatistics(topic) {
    const defaultStats = {
      percentage: 70,
      context: "students when they first encounter this",
    };
    const normalizedTopic = (topic || "general")
      .toLowerCase()
      .replace(/\s+/g, "_");
    return STRUGGLE_STATISTICS[normalizedTopic] || defaultStats;
  }

  analyzeEffortFromImage(intelligence, imageAnalysis) {
    const text = imageAnalysis?.extractedText || "";
    const hasWorkingShown = /step|=|solve|find|working|x\s*=|⇒/i.test(text);
    const multipleAttempts = text.split("\n").length > 3;
    const organized = /step|1\.|2\.|first|then|next|therefore/i.test(text);
    if (hasWorkingShown)
      return "You’re working through steps — right approach.";
    if (organized) return "Your organised steps show intent — we’ll sharpen it.";
    if (multipleAttempts) return "Multiple attempts show persistence.";
    return "You’re engaging — I’ll make the path clearer.";
  }

  identifyExistingStrengths(intelligence) {
    const map = {
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
    const topic = (intelligence.topic || "").toLowerCase();
    for (const [key, strengths] of Object.entries(map)) {
      if (topic.includes(key.split(" ")[0])) return strengths;
    }
    return ["basic reasoning", "persistence"];
  }

  generateSpecificSolution(intelligence) {
    const solutions = {
      "quadratic factoring": "a 3‑step pattern that works every time",
      "solving equations":
        "the balance‑scale method (clear isolate‑then‑solve)",
      trigonometry: "the SOH‑CAH‑TOA story method that sticks",
      "functions and graphs": "a systematic graphing checklist",
      "electricity and circuits": "the water‑flow analogy for circuits",
      "mechanics and motion": "visual free‑body method for forces",
      "area and perimeter": "formula patterns and units discipline",
      "word problems": "translate‑to‑math method (GIVENS → GOAL → PLAN)",
    };
    const topic = (intelligence.topic || "").toLowerCase();
    for (const [key, val] of Object.entries(solutions)) {
      if (topic.includes(key.split(" ")[0])) return val;
    }
    return "a step‑by‑step method designed for your exact challenge";
  }

  getRelatedPainPoints(intelligence) {
    const list =
      intelligence.relatedStruggles &&
      Array.isArray(intelligence.relatedStruggles)
        ? intelligence.relatedStruggles
        : [];
    const unique = Array.from(new Set(list)).slice(0, 3);
    return unique.length > 0 ? unique : ["related problem‑solving techniques"];
  }

  buildTechnicalDiagnosis(foundationGaps = [], struggle = "") {
    const top = foundationGaps.slice(0, 2);
    if (top.length === 0) {
      return `Where it breaks (technical):
• ${struggle || "unstable method"}
• Minor slips under time pressure`;
    }

    const bullets = top.map((g) => {
      const label =
        g.description ||
        `Prior grade ${g.grade} concept${
          g.concepts ? ` (${g.concepts.slice(0, 1).join(", ")})` : ""
        }`;
      return `• ${label}`;
    });

    return `Where it breaks (technical):\n${bullets.join("\n")}`;
  }

  // Full report plan retained for other contexts
  buildTwoDayPlan(topic) {
    return {
      now: [
        "1 mini diagnostic question (5–7 min)",
        "Upload your working → targeted feedback (2–3 min)",
      ],
      today: [
        "2 adaptive practice questions (12–15 min)",
        "Micro‑revision: 1 page of core rules for this topic (5 min)",
      ],
      tomorrow: [
        "Mixed practice set (15–20 min)",
        "Test‑day checklist: method steps + common traps (3 min)",
      ],
      framing:
        "This is about mastering the topic, not just this one question. Each attempt upgrades the method you’ll use in the test.",
    };
  }

  // Full report formatting (unchanged)
  format(data) {
    const planNow = data.plan.now.map((s) => `• ${s}`).join("\n");
    const planToday = data.plan.today.map((s) => `• ${s}`).join("\n");
    const planTomorrow = data.plan.tomorrow.map((s) => `• ${s}`).join("\n");
    const related = data.related.map((r) => `• ${r}`).join("\n");

    return `🎯 **I can see exactly what's happening here**

📚 **Topic:** ${data.topic} (${data.subject})
${data.effortLine}

🎯 **Purpose:** ${data.purpose}
🏁 **End‑goal:** ${data.endGoal}

💡 **You're not alone:** ${data.social.percentage}% of ${
      data.social.context
    } struggle with this at first.

⚙️ **Why it feels hard (technical):**
${data.techDiagnosis}

✅ **What you already have:** ${data.strengths.join(
      ", "
    )} — we’ll leverage these to stabilise the method.
⚡ **How we’ll make it click:** ${data.solutionHook}

📌 **Likely related pain‑points you may also feel shaky on:**
${related}

🗺️ **2‑Day Mastery Plan (fast):**
• Now (10 min)
${planNow}

• Today (20 min)
${planToday}

• Tomorrow (20 min)
${planTomorrow}

✨ ${data.plan.framing}`;
  }
}

module.exports = { PsychologicalReportGenerator };