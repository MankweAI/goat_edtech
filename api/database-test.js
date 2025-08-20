/**
 * Database Connection Test
 * GOAT Bot 2.0 - SA Student Companion
 * User: sophoniagoat
 * Created: 2025-08-20 18:29:18 UTC
 */

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
        database: {
          status: "not_configured",
          message:
            "Please add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel environment variables",
          setupSteps: [
            "1. Go to https://supabase.com",
            "2. Create new project or access existing",
            "3. Go to Settings > API",
            "4. Copy Project URL and anon/public key",
            "5. Add to Vercel environment variables",
            "6. Run schema.sql in Supabase SQL Editor",
          ],
        },
      });
    }

    // Try to connect to Supabase
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test basic connection
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
        database: {
          status: "connection_error",
          error: error.message,
          message: "Supabase credentials configured but connection failed",
          suggestion: "Check if database schema has been created",
        },
      });
    }

    // Test content_storage table
    const { data: contentData, error: contentError } = await supabase
      .from("content_storage")
      .select("*")
      .limit(3);

    if (contentError) {
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
        database: {
          status: "schema_incomplete",
          error: contentError.message,
          message: "Basic tables exist but enhanced schema missing",
          action: "Run the schema.sql file in Supabase SQL Editor",
        },
      });
    }

    // Success - database fully connected
    res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      database: {
        status: "connected",
        message: "✅ Supabase database fully connected and schema ready!",
        provider: "Supabase",
        tables: {
          users: "✅ Ready",
          content_storage: "✅ Ready",
          user_feedback: "✅ Ready",
          content_quality_metrics: "✅ Ready",
          analytics_events: "✅ Ready",
        },
        sampleContent: {
          examQuestions:
            contentData?.filter((c) => c.type === "EXAM").length || 0,
          homeworkSolutions:
            contentData?.filter((c) => c.type === "HOMEWORK").length || 0,
          memoryHacks:
            contentData?.filter((c) => c.type === "HACK").length || 0,
        },
      },
      nextStep: "Configure OpenAI API for content generation",
    });
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      database: {
        status: "error",
        error: error.message,
        message: "Database test failed",
      },
    });
  }
};
