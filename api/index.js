/**
 * GOAT Bot 2.0 - SA Student Companion
 * Main Vercel Serverless Function
 * User: sophoniagoat
 * Updated: 2025-08-20 18:18:58 UTC
 */

module.exports = (req, res) => {
  // Handle different paths
  const { url, method } = req;

  console.log(`Request: ${method} ${url}`);

  if (url === "/" || url === "") {
    return handleRoot(req, res);
  } else if (url === "/health" || url.startsWith("/health")) {
    return handleHealth(req, res);
  } else {
    return handle404(req, res);
  }
};

function handleRoot(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    name: "GOAT Bot 2.0 - SA Student Companion",
    version: "1.0.0",
    user: "sophoniagoat",
    timestamp: new Date().toISOString(),
    status: "Phase 0 - Foundation Ready",
    deployment: "Fresh project successfully deployed!",
    features: {
      mockExams: "Coming Phase 2",
      homeworkOCR: "Coming Phase 3",
      memoryHacks: "Coming Phase 4",
    },
    endpoints: [
      "GET / - This info",
      "GET /health - System health",
      "GET /api/monitor - System monitoring",
    ],
  });
}

function handleHealth(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    project: "GOAT Bot 2.0 - SA Student Companion",
    phase: "Foundation",
    deployment: "Vercel serverless function working!",
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
}

function handle404(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(404).json({
    error: "Not Found",
    message: "Endpoint does not exist",
    requestedPath: req.url,
    method: req.method,
    availableEndpoints: ["/", "/health", "/api/monitor"],
    timestamp: new Date().toISOString(),
  });
}
