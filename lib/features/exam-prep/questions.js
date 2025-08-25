/**
 * Exam Preparation Question Generation
 * GOAT Bot 2.0
 * Created: 2025-08-23 16:04:32 UTC
 * Developer: DithetoMokgabudi
 * Fixes (2025-08-25 21:40:00 UTC):
 * - generateExamQuestions now accepts optional userId param (prevents ReferenceError)
 */

const OpenAI = require("openai");
let openai;
const latexRenderer = require("../../utils/latex-renderer");
const {
  personalizeQuestionProfile,
  adjustQuestionDifficulty,
} = require("./personalization");
const analyticsModule = require("../../utils/analytics");

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

    const questionPrompt = `Generate a Grade ${profile.grade} ${profile.subject} practice question following South African CAPS curriculum that specifically targets a student who struggles with: "${profile.specific_failure}"

Topic: ${profile.topic_struggles}
Student's Challenge: ${profile.specific_failure}
Assessment Type: ${profile.assessment_type}
Grade: ${profile.grade}
Subject: ${profile.subject}

Requirements:
1. Create ONE specific practice question that directly addresses their struggle
2. Follow CAPS curriculum standards for Grade ${profile.grade} ${profile.subject}
3. Focus specifically on "${profile.specific_failure}"
4. Include clear instructions
5. Make it appropriate for ${profile.assessment_type} preparation
6. Make sure the question follows standard South African exam/test format for this subject

Return ONLY the question text, no solution. Keep it concise and focused.`;

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

    const solutionPrompt = `Provide a step-by-step solution for this ${profile.subject} question, following South African CAPS curriculum standards for Grade ${profile.grade}, specifically helping a student who "${profile.specific_failure}":

Question: ${questionText}

Student's struggle: ${profile.specific_failure}

Provide a clear, educational step-by-step solution that:
1. Addresses their specific challenge
2. Uses bold formatting for steps
3. Follows South African marking guidelines
4. Uses appropriate subject terminology
5. Shows all working clearly as would be required in a South African ${profile.assessment_type}`;

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

  const fallbacks = {
    Mathematics: getMathFallbackQuestion(topic, struggle),
    "Mathematical Literacy": getMathLitFallbackQuestion(topic, struggle),
    Geography: getGeographyFallbackQuestion(topic, struggle),
    "Physical Sciences": getPhysicalSciencesFallbackQuestion(topic, struggle),
    "Life Sciences": getLifeSciencesFallbackQuestion(topic, struggle),
    History: getHistoryFallbackQuestion(topic, struggle),
    Economics: getEconomicsFallbackQuestion(topic, struggle),
    "Business Studies": getBusinessFallbackQuestion(topic, struggle),
    Accounting: getAccountingFallbackQuestion(topic, struggle),
    English: getEnglishFallbackQuestion(topic, struggle),
  };

  return fallbacks[subject] || getGenericFallbackQuestion(profile);
}

// ... subject-specific fallback helpers remain unchanged ...

// Helper function to enhance visual formatting of math content
function enhanceVisualFormatting(content) {
  let enhanced = content;

  enhanced = enhanced
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/sqrt\(([^)]+)\)/g, "√($1)")
    .replace(/\+\-/g, "±")
    .replace(/infinity/g, "∞")
    .replace(/pi/g, "π")
    .replace(/theta/g, "θ");

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

// FIX: add optional userId param (prevents ReferenceError)
async function generateExamQuestions(profile, count = 3, userId = null) {
  console.log(`📝 Generating ${count} exam questions for:`, profile);

  let enhancedProfile = profile;
  if (userId) {
    enhancedProfile = await personalizeQuestionProfile(profile, userId);
    console.log(`👤 Applied personalization for user ${userId}`);
  }

  const questions = [];

  try {
    // Generate main question with AI
    const mainQuestion = await generateRealAIQuestion(enhancedProfile);

    const adjustedQuestion = userId
      ? adjustQuestionDifficulty(mainQuestion, enhancedProfile)
      : mainQuestion;

    if (latexRenderer.needsLatexRendering(adjustedQuestion.questionText)) {
      try {
        const processedQuestion = await latexRenderer.processTextWithLatex(
          adjustedQuestion.questionText
        );
        if (processedQuestion.needsRendering) {
          adjustedQuestion.latexImage = processedQuestion.image;
          adjustedQuestion.hasLatex = true;
        }
      } catch (latexError) {
        console.error("LaTeX rendering error:", latexError);
      }
    }

    if (latexRenderer.needsLatexRendering(adjustedQuestion.solution)) {
      try {
        const processedSolution = await latexRenderer.processTextWithLatex(
          adjustedQuestion.solution
        );
        if (processedSolution.needsRendering) {
          adjustedQuestion.solutionLatexImage = processedSolution.image;
          adjustedQuestion.hasSolutionLatex = true;
        }
      } catch (latexError) {
        console.error("LaTeX solution rendering error:", latexError);
      }
    }

    adjustedQuestion.contentId = generateContentId(
      enhancedProfile.subject,
      enhancedProfile.topic_struggles
    );

    questions.push(adjustedQuestion);

    // Generate remaining questions
    for (let i = questions.length; i < count; i++) {
      try {
        const variedProfile = {
          ...profile,
          specific_failure: `${profile.specific_failure} (variation ${i})`,
        };

        const question = await generateRealAIQuestion(variedProfile);

        if (latexRenderer.needsLatexRendering(question.questionText)) {
          try {
            const processedQuestion = await latexRenderer.processTextWithLatex(
              question.questionText
            );
            if (processedQuestion.needsRendering) {
              question.latexImage = processedQuestion.image;
              question.hasLatex = true;
            }
          } catch (latexError) {
            console.error("LaTeX rendering error:", latexError);
          }
        }

        if (latexRenderer.needsLatexRendering(question.solution)) {
          try {
            const processedSolution = await latexRenderer.processTextWithLatex(
              question.solution
            );
            if (processedSolution.needsRendering) {
              question.solutionLatexImage = processedSolution.image;
              question.hasSolutionLatex = true;
            }
          } catch (latexError) {
            console.error("LaTeX solution rendering error:", latexError);
          }
        }

        questions.push(question);
      } catch (error) {
        console.error(`Error generating question ${i + 1}:`, error);
        questions.push(generateFallbackQuestion(profile));
      }
    }

    if (userId) {
      analyticsModule
        .trackEvent(userId, "exam_questions_generated", {
          subject: enhancedProfile.subject,
          grade: enhancedProfile.grade,
          topic: enhancedProfile.topic_struggles,
          count,
          personalized: true,
          content_id: questions[0].contentId,
        })
        .catch((err) => console.error("Analytics error:", err));
    }
  } catch (error) {
    console.error("Failed to generate any AI questions:", error);

    for (let i = 0; i < count; i++) {
      questions.push(generateFallbackQuestion(enhancedProfile));
    }
  }

  return {
    questions,
    metadata: {
      count: questions.length,
      ai_generated: questions.filter((q) => q.source === "ai").length,
      fallback: questions.filter((q) => q.source !== "ai").length,
      latex_rendered: questions.filter((q) => q.hasLatex || q.hasSolutionLatex)
        .length,
      personalized: enhancedProfile !== profile,
      generated_at: new Date().toISOString(),
      profile: {
        subject: enhancedProfile.subject,
        grade: enhancedProfile.grade,
        topic: enhancedProfile.topic_struggles,
        specific_challenge: enhancedProfile.specific_failure,
      },
    },
  };
}

// Generate a unique content ID
function generateContentId(subject, topic) {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 7);
  const subjectCode = subject ? subject.substring(0, 3).toLowerCase() : "gen";
  const topicCode = topic ? topic.substring(0, 3).toLowerCase() : "gen";

  return `qst_${subjectCode}${topicCode}_${timestamp}${randomPart}`;
}

module.exports = {
  generateRealAIQuestion,
  generateFallbackQuestion,
  generateExamQuestions,
  getMathFallbackQuestion,
  getMathLitFallbackQuestion,
  getGeographyFallbackQuestion,
  getGenericFallbackQuestion,
  // plus other fallback helpers already defined in this file...
};
