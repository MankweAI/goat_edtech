/**
 * Exam Preparation Question Generation
 * GOAT Bot 2.0
 * Created: 2025-08-23 16:04:32 UTC
 * Developer: DithetoMokgabudi
 */

const OpenAI = require("openai");
let openai;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("🧠 OpenAI initialized for exam question generation");
  } else {
    console.log("⚠️ No OpenAI API key, using fallback question generation");
  }
} catch (error) {
  console.error("❌ OpenAI initialization error:", error);
}

/**
 * Generate a targeted practice question based on student's painpoint
 * @param {Object} profile - Student's painpoint profile
 * @returns {Promise<Object>} - Generated question with solution
 */
async function generateRealAIQuestion(profile) {
  console.log(`🤖 Generating real AI question for:`, profile);

  try {
    if (!openai) {
      throw new Error("OpenAI not initialized");
    }

    const questionPrompt = `Generate a Grade ${profile.grade} ${profile.subject} practice question that specifically targets a student who struggles with: "${profile.specific_failure}"

Topic: ${profile.topic_struggles}
Student's Challenge: ${profile.specific_failure}
Assessment Type: ${profile.assessment_type}

Requirements:
1. Create ONE specific practice question that directly addresses their struggle
2. Make it appropriate for Grade ${profile.grade} level
3. Focus specifically on "${profile.specific_failure}"
4. Include clear instructions
5. Make it solvable but challenging

Return ONLY the question text, no solution. Keep it concise and focused.

Example format: "Solve for x: 3x + 8 = 23. Show all your working steps."`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: questionPrompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.4,
    });

    const questionText = response.choices[0].message.content.trim();

    const solutionPrompt = `Provide a step-by-step solution for this question, specifically helping a student who "${profile.specific_failure}":

Question: ${questionText}

Student's struggle: ${profile.specific_failure}

Provide a clear, educational step-by-step solution that addresses their specific challenge. Use bold formatting for steps.`;

    const solutionResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: solutionPrompt,
        },
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const solution = enhanceVisualFormatting(
      solutionResponse.choices[0].message.content
    );

    console.log(
      `✅ Real AI question generated: ${questionText.substring(0, 50)}...`
    );

    return {
      questionText: enhanceVisualFormatting(questionText),
      solution: solution,
      explanation: `This question specifically targets students who ${profile.specific_failure}`,
      tokens_used:
        (response.usage?.total_tokens || 0) +
        (solutionResponse.usage?.total_tokens || 0),
      source: "ai",
    };
  } catch (error) {
    console.error("OpenAI question generation failed:", error);

    // Graceful fallback
    return generateFallbackQuestion(profile);
  }
}

/**
 * Generate a fallback question when AI generation fails
 * @param {Object} profile - Student's painpoint profile
 * @returns {Object} - Fallback question with solution
 */
function generateFallbackQuestion(profile) {
  const subject = profile.subject || "Mathematics";
  const grade = profile.grade || "11";
  const topic = profile.topic_struggles || "algebra";
  const struggle = profile.specific_failure || "solving equations";

  console.log(
    `🔄 Generating fallback question for: ${subject} ${topic} - ${struggle}`
  );

  // Subject-specific fallbacks
  if (subject === "Mathematics") {
    if (topic.toLowerCase().includes("algebra")) {
      if (
        struggle.toLowerCase().includes("solve for x") ||
        struggle.toLowerCase().includes("cannot solve")
      ) {
        return {
          questionText: `**Solve for x:**\n\n2x + 7 = 19\n\n**Show all your working steps.**`,
          solution: `**Step 1:** Subtract 7 from both sides
2x + 7 - 7 = 19 - 7
2x = 12

**Step 2:** Divide both sides by 2
2x ÷ 2 = 12 ÷ 2
x = 6

**Therefore:** x = 6`,
          source: "fallback",
        };
      }
    }

    if (topic.toLowerCase().includes("geometry")) {
      return {
        questionText: `**Find the area of a triangle:**\n\nBase = 8 cm\nHeight = 6 cm\n\n**Show your formula and calculation.**`,
        solution: `**Formula:** Area = ½ × base × height

**Step 1:** Substitute values
Area = ½ × 8 × 6

**Step 2:** Calculate
Area = ½ × 48 = 24

**Therefore:** Area = 24 cm²`,
        source: "fallback",
      };
    }

    if (topic.toLowerCase().includes("trig")) {
      return {
        questionText: `**Find the value of sin θ in this right triangle:**\n\nOpposite = 5 cm\nHypotenuse = 13 cm\n\n**Show your formula and calculation.**`,
        solution: `**Formula:** sin θ = opposite/hypotenuse

**Step 1:** Substitute values
sin θ = 5/13

**Step 2:** Calculate
sin θ = 5/13 ≈ 0.3846

**Therefore:** sin θ = 5/13`,
        source: "fallback",
      };
    }
  }

  // Generic fallback for any subject
  return {
    questionText: `**Grade ${grade} ${subject} Practice Question:**

Topic: ${topic}
Challenge: ${struggle}

**Solve this step by step.**`,
    solution: `**Step 1:** Identify what the question is asking

**Step 2:** Apply the appropriate method for ${topic}

**Step 3:** Show all working clearly

**Step 4:** Check your answer makes sense

**Therefore:** [Complete solution addressing ${struggle}]`,
    source: "generic_fallback",
  };
}

// Helper function to enhance visual formatting of math content
function enhanceVisualFormatting(content) {
  let enhanced = content;

  // Format mathematical expressions
  enhanced = enhanced
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/sqrt\(([^)]+)\)/g, "√($1)")
    .replace(/\+\-/g, "±")
    .replace(/infinity/g, "∞")
    .replace(/pi/g, "π")
    .replace(/theta/g, "θ");

  // Format step-by-step solutions
  enhanced = enhanced
    .replace(/Step (\d+):/g, "**Step $1:**")
    .replace(/Step (\d+)\./g, "**Step $1:**")
    .replace(/(\d+)\.\s/g, "**$1.** ")
    .replace(/Given:/g, "**Given:**")
    .replace(/Solution:/g, "**Solution:**")
    .replace(/Answer:/g, "**Answer:**")
    .replace(/Therefore:/g, "**Therefore:**");

  return enhanced;
}

// Generate a set of questions for an exam
async function generateExamQuestions(profile, count = 3) {
  console.log(`📝 Generating ${count} exam questions for:`, profile);

  const questions = [];

  // Try to generate questions with AI first
  try {
    // Generate main question with AI
    const mainQuestion = await generateRealAIQuestion(profile);
    questions.push(mainQuestion);

    // Generate remaining questions with fallback if needed
    for (let i = questions.length; i < count; i++) {
      try {
        // Add slight variations to prevent repetitive questions
        const variedProfile = {
          ...profile,
          specific_failure: `${profile.specific_failure} (variation ${i})`,
        };

        const question = await generateRealAIQuestion(variedProfile);
        questions.push(question);
      } catch (error) {
        console.error(`Error generating question ${i + 1}:`, error);
        questions.push(generateFallbackQuestion(profile));
      }
    }
  } catch (error) {
    console.error("Failed to generate any AI questions:", error);

    // Fall back to completely manual questions
    for (let i = 0; i < count; i++) {
      questions.push(generateFallbackQuestion(profile));
    }
  }

  return {
    questions,
    metadata: {
      count: questions.length,
      ai_generated: questions.filter((q) => q.source === "ai").length,
      fallback: questions.filter((q) => q.source !== "ai").length,
      generated_at: new Date().toISOString(),
      profile: {
        subject: profile.subject,
        grade: profile.grade,
        topic: profile.topic_struggles,
        specific_challenge: profile.specific_failure,
      },
    },
  };
}

module.exports = {
  generateRealAIQuestion,
  generateFallbackQuestion,
  generateExamQuestions,
};

