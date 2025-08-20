/**
 * OpenAI Integration Test
 * GOAT Bot 2.0 - SA Student Companion
 * User: sophoniagoat
 * Created: 2025-08-20 18:29:18 UTC
 */

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
        openai: {
          status: "not_configured",
          message: "Please add OPENAI_API_KEY to Vercel environment variables",
          setupSteps: [
            "1. Go to https://platform.openai.com/api-keys",
            "2. Create new API key",
            "3. Add OPENAI_API_KEY to Vercel environment variables",
            "4. Test this endpoint again",
          ],
        },
      });
    }

    // Test OpenAI connection with SA-specific prompt
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: openaiKey });

    const testPrompt = `Generate a simple Grade 10 Mathematics question about linear equations, following South African CAPS curriculum. Include the question and a step-by-step solution.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: testPrompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    const generatedContent = response.choices[0].message.content;

    // Success response
    res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      openai: {
        status: "connected",
        message: "✅ OpenAI API connected and generating SA-specific content!",
        model: "gpt-3.5-turbo",
        test: {
          prompt: "SA CAPS Grade 10 Mathematics question generation",
          response: generatedContent,
          responseLength: generatedContent.length,
          tokensUsed: response.usage?.total_tokens || "unknown",
        },
      },
      nextStep: "Phase 1 complete - Ready for Phase 2: Mock Exams Feature",
    });
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      openai: {
        status: "error",
        error: error.message,
        message: "OpenAI connection test failed",
      },
    });
  }
};

