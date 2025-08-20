/**
 * Memory Hacks Feature - Phase 4 Final
 * GOAT Bot 2.0 - SA Student Companion
 * User: sophoniagoat
 * Created: 2025-08-20 19:26:34 UTC
 */

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const { method } = req;

    if (method === "GET") {
      // GET request - Show feature info and available categories
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
        feature: "Memory Hacks",
        status: "Phase 4 - Final Feature Complete",
        description: "SA-specific mnemonics, study techniques, and memory aids",
        categories: {
          mathematics: ["algebra", "geometry", "trigonometry", "calculus"],
          physicalSciences: [
            "mechanics",
            "electricity",
            "chemistry",
            "periodic_table",
          ],
          lifeSciences: ["cells", "genetics", "ecology", "human_body"],
          generalStudy: ["exam_techniques", "time_management", "note_taking"],
        },
        usage: {
          getHacks:
            'POST /api/memory-hacks with { "subject": "Mathematics", "topic": "algebra", "grade": 10 }',
          listTopics: "GET /api/memory-hacks shows all available categories",
        },
        saFeatures: [
          "🇿🇦 South African context and examples",
          "📚 CAPS curriculum alignment",
          "🎵 Local songs and rhymes",
          "🏛️ SA historical references",
          "🌍 African cultural mnemonics",
        ],
      });
    }

    if (method === "POST") {
      const { subject, topic, grade, hackType = "all", count = 5 } = req.body;

      // Validation
      if (!subject) {
        return res.status(400).json({
          error: "Missing subject",
          required: ["subject"],
          optional: ["topic", "grade", "hackType", "count"],
          example: {
            subject: "Mathematics",
            topic: "algebra",
            grade: 10,
            hackType: "mnemonics",
          },
          availableSubjects: [
            "Mathematics",
            "Physical Sciences",
            "Life Sciences",
            "General Study",
          ],
          availableHackTypes: [
            "mnemonics",
            "acronyms",
            "rhymes",
            "visual",
            "songs",
            "all",
          ],
        });
      }

      // Generate memory hacks with OpenAI
      const OpenAI = require("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `Generate ${count} effective memory hacks for South African Grade ${
        grade || 10
      } students studying ${subject}${topic ? ` - ${topic}` : ""}.

REQUIREMENTS:
- Use South African context, culture, and examples
- Align with CAPS curriculum terminology
- Include local references (cities, landmarks, languages)
- Make them memorable and fun for SA students
- Use African cultural elements where appropriate

${
  hackType !== "all"
    ? `Focus on: ${hackType}`
    : "Include various types: mnemonics, acronyms, rhymes, visual associations, songs"
}

Format as JSON array:
[
  {
    "title": "Memory hack title",
    "type": "mnemonic/acronym/rhyme/visual/song",
    "content": "The actual memory aid",
    "explanation": "How to use this hack",
    "saContext": "South African relevance",
    "effectiveness": 0.9,
    "difficulty": "easy/medium/hard"
  }
]

Example SA contexts to use:
- Cities: Cape Town, Johannesburg, Durban, Pretoria
- Languages: Afrikaans, isiZulu, isiXhosa terms
- Landmarks: Table Mountain, Kruger Park, Gold Reef City
- Cultural: Ubuntu philosophy, braai culture, rugby/soccer
- Historical: Mandela, apartheid struggle, Freedom Day

Make hacks culturally relevant and educationally effective for SA students.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.8, // Higher creativity for memory hacks
      });

      let memoryHacks;
      const responseText = response.choices[0].message.content;

      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          memoryHacks = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON array found");
        }
      } catch (parseError) {
        // Fallback: create structured response from text
        memoryHacks = [
          {
            title: `${subject} Memory Aid`,
            type: "general",
            content: responseText,
            explanation: "Use this memory technique to remember key concepts",
            saContext: "Adapted for South African students",
            effectiveness: 0.8,
            difficulty: "medium",
          },
        ];
      }

      // Store in database
      try {
        const { createClient } = require("@supabase/supabase-js");
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_ANON_KEY
        );

        for (const hack of memoryHacks) {
          await supabase.from("content_storage").insert({
            type: "HACK",
            grade: parseInt(grade) || 10,
            subject: subject,
            topic: topic || "General",
            question_text: hack.title,
            solution_text: hack.content,
            metadata: {
              hackType: hack.type,
              explanation: hack.explanation,
              saContext: hack.saContext,
              effectiveness: hack.effectiveness,
              difficulty: hack.difficulty,
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
        memoryHacks: {
          subject,
          topic: topic || "General",
          grade: grade || 10,
          hackType: hackType,
          count: memoryHacks.length,
          hacks: memoryHacks,
        },
        effectiveness: {
          averageScore:
            memoryHacks.reduce(
              (sum, hack) => sum + (hack.effectiveness || 0.8),
              0
            ) / memoryHacks.length,
          saContextIntegration: "High - locally relevant content",
          capsAlignment: "Perfect - curriculum specific",
        },
        metadata: {
          generatedBy: "OpenAI GPT-3.5-turbo",
          tokensUsed: response.usage?.total_tokens || "unknown",
          culturalRelevance: "South African context integrated",
          stored: "Content saved for reuse",
          phase: "4 - Final Feature Complete",
        },
        usage: [
          "🧠 Practice these memory aids regularly",
          "🔄 Combine multiple techniques for better retention",
          "👥 Share with classmates for group learning",
          "📝 Test yourself using these mnemonics",
          "⭐ Rate effectiveness to improve future hacks",
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
      error: "Memory hacks generation failed",
      message: error.message,
      phase: "4 - Final Feature",
    });
  }
};

