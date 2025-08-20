/**
 * Monitoring Endpoint
 * User: sophoniagoat
 */

module.exports = (req, res) => {
  const { check } = req.query;

  res.setHeader("Content-Type", "application/json");

  if (check === "database") {
    res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      check: "database",
      status: "not_configured_yet",
      message: "Database will be configured in Phase 1",
      provider: "Supabase",
      readyForSetup: true,
    });
  } else if (check === "services") {
    res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      check: "services",
      openai: "not_configured_yet",
      googleVision: "not_configured_yet",
      supabase: "not_configured_yet",
      message: "External services will be configured in Phase 1",
    });
  } else {
    res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      project: "GOAT Bot 2.0 - SA Student Companion",
      monitoring: "ACTIVE",
      phase: "Foundation",
      system: {
        status: "operational",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
      availableChecks: [
        "/api/monitor?check=database",
        "/api/monitor?check=services",
      ],
    });
  }
};
