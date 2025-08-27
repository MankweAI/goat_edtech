// api/index.js (COMPLETE WEBHOOK ROUTER)
/**
 * Main Webhook Entry Point - All ManyChat Traffic
 * GOAT Bot 2.0
 * Updated: 2025-08-27 10:30:00 UTC
 * Developer: DithetoMokgabudi
 * Fix: Single webhook entry point that routes to all features
 */

const { ManyCompatResponse } = require("../lib/core/responses");
const { parseGoatCommand, extractImageData } = require("../lib/core/commands");
const { getOrCreateUserState, trackManyState } = require("../lib/core/state");
const { detectDeviceType } = require("../lib/utils/device-detection");

module.exports = async (req, res) => {
  try {
    const manyCompatRes = new ManyCompatResponse(res);
    const subscriberId =
      req.body.psid || req.body.subscriber_id || "default_user";
    const message = req.body.message || req.body.user_input || "";
    const userAgent = req.headers["user-agent"] || "";

    console.log(`🔄 Webhook entry: ${subscriberId} -> "${message}"`);

    // Get user state to determine routing
    let user = await getOrCreateUserState(subscriberId);
    if (!user.preferences.device_type) {
      user.preferences.device_type = detectDeviceType(userAgent);
    }

    // Extract image data for routing decisions
    const imageInfo = extractImageData(req);

    // Parse command with context
    const command = parseGoatCommand(message, user, { imageInfo });

    console.log(`🎯 Routing command: ${command.type}`);

    // ROUTE BASED ON COMMAND TYPE
    if (command.type === "MENU_CHOICE") {
      // Handle main menu selections: 1=exam, 2=homework, 3=memory
      return await routeToFeature(command.choice, req, manyCompatRes, user);
    }

    if (
      command.type === "HOMEWORK_UPLOAD" ||
      command.type === "HOMEWORK_HELP" ||
      user.current_menu === "homework_help"
    ) {
      // Route to homework feature
      const {
        ConsolidatedHomeworkHelp,
      } = require("../lib/features/homework/processor");
      const homeworkHelper = new ConsolidatedHomeworkHelp();
      return await homeworkHelper.processHomeworkRequest(req, manyCompatRes);
    }

    if (
      command.type === "EXAM_PREP_CONVERSATION" ||
      user.current_menu === "exam_prep_conversation"
    ) {
      // Route to exam prep feature
      const examPrepHandler = require("./exam-prep");
      return await examPrepHandler(req, res._res || res);
    }

    if (
      command.type === "MEMORY_HACKS" ||
      user.current_menu === "memory_hacks_active"
    ) {
      // Route to memory hacks feature
      const memoryHacksHandler = require("./memory-hacks");
      return await memoryHacksHandler(req, res._res || res);
    }

    // Default: Show main menu
    return await showMainMenu(user, manyCompatRes);
  } catch (error) {
    console.error("Main webhook error:", error);
    const manyCompatRes = new ManyCompatResponse(res);
    return manyCompatRes.json({
      message: "Sorry, I encountered an error. Please try again.",
      status: "error",
      echo: "Sorry, I encountered an error. Please try again.",
    });
  }
};

// Route to specific feature based on menu choice
async function routeToFeature(choice, req, res, user) {
  console.log(`🎯 Routing to feature: ${choice}`);

  // Update user's current menu
  user.current_menu =
    choice === 1
      ? "exam_prep_conversation"
      : choice === 2
      ? "homework_help"
      : choice === 3
      ? "memory_hacks_active"
      : "welcome";

  trackManyState(user.id, {
    type: "menu_selection",
    current_menu: user.current_menu,
  });

  if (choice === 1) {
    // Exam/Test Help → Route to exam-prep.js
    const examPrepHandler = require("./exam-prep");
    return await examPrepHandler(req, res._res || res);
  } else if (choice === 2) {
    // Homework Help → Route to homework processor
    const {
      ConsolidatedHomeworkHelp,
    } = require("../lib/features/homework/processor");
    const homeworkHelper = new ConsolidatedHomeworkHelp();
    return await homeworkHelper.processHomeworkRequest(req, res);
  } else if (choice === 3) {
    // Memory Hacks → Route to memory-hacks.js
    const memoryHacksHandler = require("./memory-hacks");
    return await memoryHacksHandler(req, res._res || res);
  } else {
    return await showMainMenu(user, res);
  }
}

// Show main menu
async function showMainMenu(user, res) {
  user.current_menu = "welcome";

  const message = `**Welcome to The GOAT.** I'm here help you study with calm and clarity.

**What do you need right now?**

1️⃣ 📅 Exam/Test Help
2️⃣ 📚 Homework Help 🫶 ⚡  
3️⃣ 🧮 Tips & Hacks

Just pick a number! ✨`;

  return res.json({
    message,
    status: "success",
    echo: message,
  });
}

