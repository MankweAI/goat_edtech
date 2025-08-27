// api/index.js (ROUTING FIXES)
/**
 * Main Webhook Entry Point - All ManyChat Traffic
 * GOAT Bot 2.0
 * Updated: 2025-08-27 10:59:00 UTC
 * Developer: DithetoMokgabudi
 * Fixes:
 *  - Use GOAT_COMMANDS constants (case-correct) for routing comparisons
 *  - Prioritise Exam/Test Help routing before Homework to support exam image-first flow
 *  - Correct response object routing and return handling
 */

const { ManyCompatResponse } = require("../lib/core/responses");
const { parseGoatCommand, extractImageData } = require("../lib/core/commands");
const {
  getOrCreateUserState,
  trackManyState,
  GOAT_COMMANDS,
} = require("../lib/core/state");
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

    // ROUTE BASED ON COMMAND TYPE (use GOAT_COMMANDS constants)

    // 1) Menu selections (1/2/3)
    if (command.type === GOAT_COMMANDS.MENU_CHOICE) {
      console.log(`🎯 Menu choice detected: ${command.choice}`);
      return await routeToFeature(
        command.choice,
        req,
        res,
        user,
        manyCompatRes
      );
    }

    // 2) Exam/Test Help should take priority (image-first flow)
    if (
      command.type === GOAT_COMMANDS.EXAM_PREP_CONVERSATION ||
      user.current_menu === "exam_prep_conversation"
    ) {
      const examPrepHandler = require("./exam-prep");
      return await examPrepHandler(req, res);
    }

    // 3) Homework Help (fallback when user is in homework flow or uploads image outside exam mode)
    if (
      command.type === GOAT_COMMANDS.HOMEWORK_UPLOAD ||
      command.type === GOAT_COMMANDS.HOMEWORK_HELP ||
      user.current_menu === "homework_help"
    ) {
      const {
        ConsolidatedHomeworkHelp,
      } = require("../lib/features/homework/processor");
      const homeworkHelper = new ConsolidatedHomeworkHelp();
      return await homeworkHelper.processHomeworkRequest(req, manyCompatRes);
    }

    // 4) Memory Hacks
    if (
      command.type === GOAT_COMMANDS.MEMORY_HACKS ||
      user.current_menu === "memory_hacks_active"
    ) {
      const memoryHacksHandler = require("./memory-hacks");
      return await memoryHacksHandler(req, res);
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

// FIXED: Route to specific feature based on menu choice
async function routeToFeature(choice, req, res, user, manyCompatRes) {
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
    console.log(`📅 Routing to exam-prep.js`);
    const examPrepHandler = require("./exam-prep");
    return await examPrepHandler(req, res); // Proper return
  } else if (choice === 2) {
    // Homework Help → Route to homework processor
    console.log(`📚 Routing to homework processor`);
    const {
      ConsolidatedHomeworkHelp,
    } = require("../lib/features/homework/processor");
    const homeworkHelper = new ConsolidatedHomeworkHelp();
    return await homeworkHelper.processHomeworkRequest(req, manyCompatRes); // Proper return
  } else if (choice === 3) {
    // Memory Hacks → Route to memory-hacks.js
    console.log(`🧮 Routing to memory-hacks.js`);
    const memoryHacksHandler = require("./memory-hacks");
    return await memoryHacksHandler(req, res); // Proper return
  } else {
    // Invalid choice, show main menu
    console.log(`❌ Invalid choice: ${choice}, showing main menu`);
    return await showMainMenu(user, manyCompatRes);
  }
}

// FIXED: Show main menu
async function showMainMenu(user, manyCompatRes) {
  user.current_menu = "welcome";

  const message = `**Welcome to The GOAT.** I'm here help you study with calm and clarity.

**What do you need right now?**

1️⃣ 📅 Exam/Test Help
2️⃣ 📚 Homework Help 🫶 ⚡  
3️⃣ 🧮 Tips & Hacks

Just pick a number! ✨`;

  return manyCompatRes.json({
    message,
    status: "success",
    echo: message,
  });
}
