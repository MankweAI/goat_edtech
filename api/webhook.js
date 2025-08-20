/**
 * GOAT Bot ManyChat Webhook - Serverless Function
 * GOAT Bot 2.0 - SA Student Companion
 * User: sophoniagoat
 * Fixed: 2025-08-20 19:55:38 UTC
 */

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    console.log("GOAT Bot webhook received:", {
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString(),
    });

    const { psid, message } = req.body;

    // Handle GET requests (for ManyChat setup verification)
    if (req.method === "GET") {
      return res.status(200).json({
        message: "GOAT Bot webhook is ready!",
        status: "active",
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
        setup: "Ready for ManyChat integration",
        testWith: {
          method: "POST",
          body: { psid: "test123", message: "start" },
        },
      });
    }

    // Basic validation for POST requests
    if (!psid) {
      return res.status(400).json({
        message: "User ID is required",
        status: "error",
        echo: "User ID is required",
        timestamp: new Date().toISOString(),
        error: "Missing psid parameter",
      });
    }

    // Process the message based on content
    let response;
    const userMessage = message?.toLowerCase() || "";

    // Main menu - exact GOAT specification
    if (
      userMessage.includes("hi") ||
      userMessage.includes("hello") ||
      userMessage.includes("start") ||
      userMessage.includes("menu") ||
      !message ||
      message === ""
    ) {
      response = {
        message:
          `Welcome to The GOAT. I'm here help you study with calm and clarity.\n\n` +
          `What do you need right now?\n\n` +
          `1️⃣ 📅 Exam/Test coming 😰\n` +
          `2️⃣ 📚 Homework Help 🫶\n` +
          `3️⃣ 🧮 Tips & Hacks\n\n` +
          `Just pick a number! ✨`,
        status: "success",
        echo: "Welcome to The GOAT. I'm here help you study with calm and clarity.",
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
      };
    }
    // Option 1: Exam/Test preparation
    else if (
      userMessage.includes("1") ||
      userMessage.includes("exam") ||
      userMessage.includes("test")
    ) {
      response = {
        message:
          `📅 **Exam/Test Prep Mode Activated!** 😰➡️😎\n\n` +
          `I'll help you prepare step by step:\n\n` +
          `📝 What subject is your exam/test in?\n` +
          `📚 What grade are you? (10, 11, or 12)\n` +
          `📖 Any specific topics you're worried about?\n\n` +
          `Example: "Grade 11 Mathematics - Trigonometry test next week"`,
        status: "success",
        echo: "Exam/Test Prep Mode Activated!",
        timestamp: new Date().toISOString(),
        feature: "mock_exams",
        user: "sophoniagoat",
      };
    }
    // Option 2: Homework Help
    else if (userMessage.includes("2") || userMessage.includes("homework")) {
      response = {
        message:
          `📚 **Homework Helper Ready!** 🫶\n\n` +
          `I can help you solve any homework problem:\n\n` +
          `✍️ Type your question directly\n` +
          `📸 Upload a photo of your homework (coming soon)\n` +
          `📝 I'll give you step-by-step solutions\n` +
          `🎯 Plus extra practice problems!\n\n` +
          `Go ahead - paste your homework question here! 📝`,
        status: "success",
        echo: "Homework Helper Ready!",
        timestamp: new Date().toISOString(),
        feature: "homework_help",
        user: "sophoniagoat",
      };
    }
    // Option 3: Tips & Hacks
    else if (
      userMessage.includes("3") ||
      userMessage.includes("tips") ||
      userMessage.includes("hacks")
    ) {
      response = {
        message:
          `🧮 **Tips & Hacks Vault!** ✨\n\n` +
          `Get SA-specific memory tricks and study hacks:\n\n` +
          `🧠 Memory aids using SA culture\n` +
          `🎵 Songs and rhymes in local languages\n` +
          `🏛️ Mnemonics with SA landmarks\n` +
          `📚 Subject-specific study techniques\n\n` +
          `What subject do you need memory hacks for?\n` +
          `Example: "Mathematics algebra" or "Physical Sciences chemistry"`,
        status: "success",
        echo: "Tips & Hacks Vault!",
        timestamp: new Date().toISOString(),
        feature: "memory_hacks",
        user: "sophoniagoat",
      };
    }
    // Handle specific homework or study requests
    else {
      response = {
        message:
          `I got your message: "${message}" 📝\n\n` +
          `I'm analyzing this for you... Let me help step by step! 🤔\n\n` +
          `If this is homework, I'll solve it with detailed explanations.\n` +
          `If you need something else, just type "menu" to see all options! ✨`,
        status: "success",
        echo: `Processing: ${message}`,
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
      };
    }

    // Log successful interaction
    console.log("GOAT Bot response sent:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error("GOAT Bot webhook error:", error);
    res.status(500).json({
      message: "Sorry, I encountered an error. Please try again! 🔄",
      status: "error",
      echo: "Sorry, I encountered an error. Please try again.",
      timestamp: new Date().toISOString(),
      error: error.message,
      user: "sophoniagoat",
    });
  }
};
