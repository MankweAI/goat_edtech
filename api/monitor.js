/**
 * System Monitoring Endpoint
 * GOAT Bot 2.0 - SA Student Companion
 * User: sophoniagoat
 * Updated: 2025-08-20 18:18:58 UTC
 */

module.exports = (req, res) => {
  const { check } = req.query;

  console.log(`Monitor request: check=${check}`);

  try {
    if (check === "database") {
      return handleDatabaseCheck(req, res);
    } else if (check === "services") {
      return handleServicesCheck(req, res);
    } else {
      // Default monitoring info
      res.setHeader("Content-Type", "application/json");
      res.status(200).json({
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
        project: "GOAT Bot 2.0 - SA Student Companion",
        phase: "Foundation",
        deployment: "Monitor endpoint working!",
        system: {
          status: "operational",
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform,
        },
        checks: [
          "GET /api/monitor?check=database - Database status",
          "GET /api/monitor?check=services - External services status",
        ],
        nextPhases: [
          "Phase 1: Database & AI Setup",
          "Phase 2: Mock Exams Feature",
          "Phase 3: Homework OCR Feature",
          "Phase 4: Memory Hacks Feature",
        ],
      });
    }
  } catch (error) {
    console.error("Monitor error:", error);
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({
      error: "Monitoring check failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

function handleDatabaseCheck(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    database: {
      status: "not_configured",
      message: "Database will be configured in Phase 1",
      provider: "Supabase (planned)",
      schema: "SA Student Companion enhanced schema",
    },
  });
}

function handleServicesCheck(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    services: {
      openai: {
        status: process.env.OPENAI_API_KEY ? "configured" : "not_configured",
        message: "Will be configured in Phase 1",
      },
      googleVision: {
        status: "not_configured",
        message: "OCR service - Phase 3",
      },
      supabase: {
        status: "not_configured",
        message: "Database service - Phase 1",
      },
    },
  });
}
