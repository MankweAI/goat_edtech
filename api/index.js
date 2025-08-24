/**
 * GOAT Bot 2.0 - Main Router
 * Updated: 2025-08-24 13:35:00 UTC
 * Developer: DithetoMokgabudi
 * REFACTORING: Modular architecture using new lib structure
 */

// Import core modules
const {
  userStates,
  MANYCHAT_STATES,
  setupStateCleanup,
} = require("../lib/core/state");
const { extractImageData, parseGoatCommand } = require("../lib/core/commands");
const { formatGoatResponse } = require("../lib/core/responses");
const { detectDeviceType } = require("../lib/utils/device-detection");

// Import feature endpoints
const homeworkHelp = require("./homework.js");
const examPrep = require("./exam-prep.js");
const memoryHacks = require("./memory-hacks.js");

// Setup state cleanup
setupStateCleanup();

// Main export function - Simplified router
module.exports = async (req, res) => {
  const start = Date.now();
  console.log(
    `📩 ${req.method} request to ${
      req.url || "/api/index"
    } | ${new Date().toISOString()}`
  );

  try {
    const query = req.query || {};
    const endpoint = query.endpoint || "webhook";

    // Route to appropriate handler
    switch (endpoint) {
      case "webhook":
        return await handleWebhook(req, res, start);
      case "mock-exam":
        return await examPrep(req, res);
      case "homework-ocr":
        return await homeworkHelp(req, res);
      case "memory-hacks":
        return await memoryHacks(req, res);
      default:
        return await handleWebhook(req, res, start);
    }
  } catch (error) {
    console.error("❌ GOAT Bot fatal error:", error);

    if (!res.headersSent) {
      return res.status(500).json(
        formatGoatResponse(
          "Sorry, I encountered an error. Please try typing 'menu' to restart! 🔄",
          {
            status: "error",
            error: error.message,
            elapsed_ms: Date.now() - start,
          }
        )
      );
    }
  }
};

// Main webhook handler - determines which feature to route to
async function handleWebhook(req, res, start) {
  // GET handler for health check
  if (req.method === "GET") {
    return res
      .status(200)
      .json(formatGoatResponse("GOAT Bot webhook is operational"));
  }

  // Method validation
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST requests supported",
      echo: "Only POST requests supported",
    });
  }

  // Extract request data safely
  const subscriberId =
    req.body.psid || req.body.subscriber_id || "default_user";
  const message = req.body.message || req.body.user_input || "";
  const userAgent = req.headers["user-agent"] || "";
  console.log(
    `📥 User ${subscriberId}: "${message}" (${message.length} chars)`
  );

  // Extract image data
  const imageInfo = extractImageData(req);

  // Initialize or get user state
  let user = userStates.get(subscriberId) || {
    id: subscriberId,
    current_menu: "welcome",
    context: {},
    preferences: {
      device_type: detectDeviceType(userAgent),
    },
    last_active: new Date().toISOString(),
  };

  // Reconcile with ManyChat lastMenu tracking to maintain continuity across requests
  const lastMenuEntry = MANYCHAT_STATES.lastMenu.get(subscriberId);
  if (
    lastMenuEntry &&
    lastMenuEntry.menu &&
    user.current_menu !== lastMenuEntry.menu
  ) {
    console.log(
      `🔗 Reconciling user menu from "${user.current_menu}" -> "${lastMenuEntry.menu}" based on ManyChat tracking`
    );
    user.current_menu = lastMenuEntry.menu;
    userStates.set(subscriberId, user);
  }

  // If we have any image, route to homework handler and pass through
  if (imageInfo) {
    console.log(`🖼️ Image detected, routing to homework handler`);
    req.body.has_image = true;
    req.body.imageInfo = imageInfo;
    if (imageInfo.type === "direct") {
      req.body.imageData = imageInfo.data; // base64
    } else if (imageInfo.type === "url") {
      req.body.imageUrl = imageInfo.data; // URL to fetch
    }
    user.current_menu = "homework_help";
    userStates.set(subscriberId, user);
    return await homeworkHelp(req, res);
  }

  // Parse the command
  const command = parseGoatCommand(message, user, { imageInfo });
  console.log(`🎯 Command parsed:`, command.type);

  // Route to appropriate handler based on command type
  switch (command.type) {
    case "homework_help":
    case "homework_upload": {
      user.current_menu = "homework_help";
      userStates.set(subscriberId, user);

      if (command.hasImage) {
        req.body.has_image = true;
        if (command.imageInfo) req.body.imageInfo = command.imageInfo;
        if (command.imageData) req.body.imageData = command.imageData;
        if (command.imageUrl) req.body.imageUrl = command.imageUrl;
      }
      return await homeworkHelp(req, res);
    }

    case "exam_prep_conversation": {
      user.current_menu = "exam_prep_conversation";
      userStates.set(subscriberId, user);
      return await examPrep(req, res);
    }

    case "numbered_menu_command":
      return await examPrep(req, res);

    case "memory_hacks": {
      user.current_menu = "memory_hacks_active";
      userStates.set(subscriberId, user);
      return await memoryHacks(req, res);
    }

    case "menu_choice": {
      if (command.choice === 1) {
        user.current_menu = "exam_prep_conversation";
        userStates.set(subscriberId, user);
        return await examPrep(req, res);
      } else if (command.choice === 2) {
        user.current_menu = "homework_help";
        userStates.set(subscriberId, user);
        return await homeworkHelp(req, res);
      } else if (command.choice === 3) {
        user.current_menu = "memory_hacks_active";
        userStates.set(subscriberId, user);
        return await memoryHacks(req, res);
      }
      break;
    }

    case "welcome":
    default: {
      // If ManyChat says the user was in homework, keep them there
      if (user.current_menu === "homework_help") {
        return await homeworkHelp(req, res);
      }

      const welcomeResponse = await showWelcomeMenu(user);
      userStates.set(subscriberId, user);
      return res.status(200).json(formatGoatResponse(welcomeResponse));
    }
  }
}

// Welcome menu generator
async function showWelcomeMenu(user) {
  console.log(`🏠 Welcome menu for user ${user.id}`);

  user.current_menu = "welcome";
  user.context = {};

  const welcomeBack = user.preferences.last_subject
    ? `\n\n👋 **Welcome back!** Ready to continue with *${user.preferences.last_subject}*?`
    : "";

  return `**Welcome to The GOAT.** I'm here help you study with calm and clarity.${welcomeBack}

**What do you need right now?**

1️⃣ 📅 Exam/Test coming 😰
2️⃣ 📚 Homework Help 🫶 ⚡  
3️⃣ 🧮 Tips & Hacks

Just pick a number! ✨`;
}
