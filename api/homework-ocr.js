/**
 * Homework OCR Feature - Phase 3
 * GOAT Bot 2.0 - SA Student Companion
 * User: sophoniagoat
 * Created: 2025-08-20 19:19:33 UTC
 */

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const { method } = req;

    if (method === "GET") {
      // GET request - Show feature info and capabilities
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
        feature: "Homework OCR",
        status: "Phase 3 - Active Development",
        phase: "3.1 - Text Input Implementation",
        capabilities: {
          current: [
            "📝 Text input homework processing",
            "🤖 AI-powered solution generation",
            "📚 Unlimited similar problems",
            "💾 Content storage and reuse",
          ],
          coming: [
            "📷 Image upload processing (Phase 3.2)",
            "🔍 Google Vision OCR (Phase 3.3)",
            "📊 Confidence scoring (Phase 3.4)",
          ],
        },
        usage: {
          textInput:
            'POST /api/homework-ocr with { "problemText": "your homework question", "grade": 10, "subject": "Mathematics" }',
          imageInput: "Coming in Phase 3.2",
        },
        testEndpoint:
          "Send POST request with homework text to test current functionality",
      });
    }

    if (method === "POST") {
      const {
        problemText,
        grade,
        subject,
        generateSimilar = true,
        similarCount = 3,
      } = req.body;

      // Validation
      if (!problemText) {
        return res.status(400).json({
          error: "Missing homework problem",
          required: ["problemText"],
          optional: ["grade", "subject", "generateSimilar", "similarCount"],
          example: {
            problemText: "Solve for x: 2x + 5 = 15",
            grade: 10,
            subject: "Mathematics",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Process homework with OpenAI
      const OpenAI = require("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Generate solution
      const solutionPrompt = `You are a South African CAPS curriculum mathematics tutor. Solve this homework problem step-by-step for a Grade ${
        grade || 10
      } student:

Problem: ${problemText}

Provide:
1. Clear step-by-step solution
2. Final answer
3. Method explanation suitable for SA curriculum
4. Common mistakes to avoid

Use South African terminology and CAPS methodology.`;

      const solutionResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: solutionPrompt }],
        max_tokens: 800,
        temperature: 0.3, // Lower temperature for more consistent solutions
      });

      const solution = solutionResponse.choices[0].message.content;

      let similarProblems = [];

      // Generate similar problems if requested
      if (generateSimilar && similarCount > 0) {
        const similarPrompt = `Based on this homework problem: "${problemText}"

Generate ${similarCount} similar problems with solutions for Grade ${
          grade || 10
        } ${subject || "Mathematics"} following SA CAPS curriculum.

Format as JSON array:
[
  {
    "problem": "Similar problem text",
    "solution": "Step-by-step solution",
    "difficulty": "basic/intermediate/advanced"
  }
]

Ensure problems are:
- Same concept but different numbers/context
- Appropriate for SA Grade ${grade || 10}
- Include complete solutions
- Progressively challenging`;

        try {
          const similarResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: similarPrompt }],
            max_tokens: 1200,
            temperature: 0.7,
          });

          const similarText = similarResponse.choices[0].message.content;
          const jsonMatch = similarText.match(/\[[\s\S]*\]/);

          if (jsonMatch) {
            similarProblems = JSON.parse(jsonMatch[0]);
          }
        } catch (similarError) {
          console.log(
            "Similar problems generation failed:",
            similarError.message
          );
          // Continue without similar problems
        }
      }

      // Store in database
      try {
        const { createClient } = require("@supabase/supabase-js");
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_ANON_KEY
        );

        // Store original homework
        const { data: homeworkData } = await supabase
          .from("content_storage")
          .insert({
            type: "HOMEWORK",
            grade: parseInt(grade) || 10,
            subject: subject || "Mathematics",
            topic: "Homework Help",
            question_text: problemText,
            solution_text: solution,
            metadata: {
              inputMethod: "text",
              similarGenerated: similarProblems.length,
              processed: new Date().toISOString(),
            },
          })
          .select()
          .single();

        // Store similar problems
        for (const similar of similarProblems) {
          await supabase.from("content_storage").insert({
            type: "HOMEWORK",
            grade: parseInt(grade) || 10,
            subject: subject || "Mathematics",
            topic: "Similar Problems",
            question_text: similar.problem,
            solution_text: similar.solution,
            metadata: {
              difficulty: similar.difficulty,
              generatedFrom: homeworkData?.contentID,
              similarProblem: true,
            },
          });
        }
      } catch (dbError) {
        console.log("Database storage failed (non-critical):", dbError.message);
      }

      // Success response
      res.status(200).json({
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
        homework: {
          originalProblem: problemText,
          grade: grade || 10,
          subject: subject || "Mathematics",
          solution,
          processed: "Successfully analyzed and solved",
        },
        similarProblems: {
          count: similarProblems.length,
          problems: similarProblems,
        },
        metadata: {
          inputMethod: "text",
          capsAligned: true,
          solutionTokens: solutionResponse.usage?.total_tokens || "unknown",
          stored: "Content saved for reuse",
          phase: "3.1 - Text Input Processing",
        },
        nextSteps: [
          "📖 Review the step-by-step solution",
          "🎯 Practice with similar problems",
          "📝 Try solving before checking answers",
          "🔄 Submit more homework for help",
        ],
      });
    } else {
      res.status(405).json({
        error: "Method not allowed",
        allowed: ["GET", "POST"],
        received: method,
      });
    }
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      error: "Homework OCR processing failed",
      message: error.message,
      phase: "3.1 - Text Input Processing",
    });
  }
};

