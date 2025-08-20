/**
 * Mock Exam Generator - Phase 2
 * GOAT Bot 2.0 - SA Student Companion
 * User: sophoniagoat
 * Created: 2025-08-20 18:57:31 UTC
 */

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const {
      grade,
      subject,
      topics,
      examType = "TEST",
      questionCount = 3,
    } = req.query;

    // Validation
    if (!grade || !subject) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["grade", "subject"],
        optional: ["topics", "examType", "questionCount"],
        example:
          "/api/mock-exam?grade=10&subject=Mathematics&topics=algebra&examType=TEST&questionCount=3",
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
      });
    }

    // Validate grade
    if (!["10", "11", "12"].includes(grade)) {
      return res.status(400).json({
        error: "Invalid grade",
        message: "Grade must be 10, 11, or 12",
        received: grade,
        timestamp: new Date().toISOString(),
      });
    }

    // Generate CAPS-aligned mock exam
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Generate ${questionCount} ${examType.toLowerCase()} questions for Grade ${grade} ${subject} following South African CAPS curriculum.
    
    ${topics ? `Focus on topics: ${topics}` : "Cover general curriculum topics"}
    
    IMPORTANT REQUIREMENTS:
    - Questions must be appropriate for SA Grade ${grade} level
    - Use South African terminology and context
    - Follow CAPS curriculum standards
    - Include step-by-step solutions
    - Provide examiner tips for better marks
    
    Format as JSON array with this exact structure:
    [
      {
        "questionNumber": 1,
        "questionText": "Clear question here",
        "solution": "Step-by-step solution with working",
        "commonMistakes": "What students often do wrong",
        "examinerTips": "How to get full marks",
        "marksAllocated": 5
      }
    ]
    
    Topic context: This is for a South African ${
      examType === "EXAM" ? "formal examination" : "class test"
    }.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    });

    let mockExam;
    const responseText = response.choices[0].message.content;

    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        mockExam = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found");
      }
    } catch (parseError) {
      // Fallback: create structured response from text
      mockExam = [
        {
          questionNumber: 1,
          questionText: `Grade ${grade} ${subject} Question`,
          solution: responseText,
          commonMistakes: "Review the working carefully and show all steps",
          examinerTips: "Always show your working for partial marks",
          marksAllocated: 5,
        },
      ];
    }

    // Store in database for reuse
    try {
      const { createClient } = require("@supabase/supabase-js");
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      for (const question of mockExam) {
        await supabase.from("content_storage").insert({
          type: "EXAM",
          grade: parseInt(grade),
          subject,
          topic: topics || "General",
          question_text: question.questionText,
          solution_text: question.solution,
          metadata: {
            examType: examType,
            commonMistakes: question.commonMistakes,
            examinerTips: question.examinerTips,
            marksAllocated: question.marksAllocated || 5,
            generated: new Date().toISOString(),
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
      examType: examType.toUpperCase(),
      grade: parseInt(grade),
      subject,
      topics: topics || "General curriculum",
      questionCount: mockExam.length,
      mockExam,
      metadata: {
        capsAligned: true,
        generatedBy: "OpenAI GPT-3.5-turbo",
        tokensUsed: response.usage?.total_tokens || "unknown",
        difficulty: `Grade ${grade} appropriate`,
        saContext: "South African CAPS curriculum",
        stored: "Content saved for reuse",
      },
      instructions: [
        "📝 Attempt each question before viewing solutions",
        "✅ Show all working steps for full marks",
        "⚠️ Watch out for common mistakes listed",
        "💡 Use examiner tips to improve answers",
        "🔄 Request more questions if needed",
      ],
    });
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      error: "Mock exam generation failed",
      message: error.message,
      debug: {
        openaiConnected: !!process.env.OPENAI_API_KEY,
        requestParams: { grade, subject, topics, examType, questionCount },
      },
    });
  }
};
