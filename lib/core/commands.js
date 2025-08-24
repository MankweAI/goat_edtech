/**
 * Command Processing
 * GOAT Bot 2.0
 * Updated: 2025-08-23 14:58:19 UTC
 */

const { GOAT_COMMANDS, AI_INTEL_STATES, MANYCHAT_STATES } = require("./state");


// In extractImageData function:
function extractImageData(req) {
  // Check all possible ManyChat image formats
  const imageData =
    req.body.imageData ||
    (req.body.attachments && req.body.attachments.image) ||
    (req.body.media && req.body.media.image) ||
    null;

  // CRITICAL FIX: Also check for media URL (common ManyChat format)
  const mediaUrl = (req.body.media && req.body.media.url) || null;

  // Log what we found for debugging
  if (imageData) {
    console.log(
      `📸 Found direct image data: ${typeof imageData} (${(
        imageData.length / 1024
      ).toFixed(2)}KB)`
    );
    return { type: "direct", data: imageData };
  }

  if (mediaUrl) {
    console.log(`📸 Found media URL: ${mediaUrl.substring(0, 100)}`);
    return { type: "url", data: mediaUrl };
  }

  // Deep inspection for debugging
  if (req.body.media) {
    console.log(
      `📸 Media object keys: ${Object.keys(req.body.media).join(", ")}`
    );
  }

  // Also check for has_image flag (added for some ManyChat integrations)
  if (req.body.has_image === true || req.body.has_attachment === true) {
    console.log(`📸 Image flag detected but no image data found - routing to homework handler anyway`);
    return { type: "pending", data: null };
  }

  console.log(`📸 No image found in request`);
  return null;
}
// Enhanced command parser
function parseGoatCommand(message, userContext, attachments = {}) {
  // Handle undefined message
  const text = message?.toLowerCase().trim() || "";

  // Extract image data with enhanced logging
  const imageInfo = attachments?.imageInfo || null;
  const attachmentImageData = imageInfo?.data || null;

  if (imageInfo) {
    console.log(`📸 Command parser received image of type: ${imageInfo.type}`);
  }

  // Check previous menu state from ManyChat tracking
  const subscriberId = userContext.id || "unknown";
  const lastMenu = MANYCHAT_STATES.lastMenu.get(subscriberId);

  // If user was previously in homework_help menu, maintain that state
  if (lastMenu && lastMenu.menu === "homework_help") {
    console.log(`🔄 Maintaining homework_help state for user: ${subscriberId}`);
    userContext.current_menu = "homework_help";
  }

  // Handle homework-specific states with safer checks
  if (
    userContext.current_menu === "homework_help" ||
    userContext.current_menu === "homework_active"
  ) {
    // More robust image detection
    if (attachmentImageData) {
      console.log(
        `📸 Image data detected in homework mode for user: ${
          userContext.id || "unknown"
        }`
      );
      return {
        type: GOAT_COMMANDS.HOMEWORK_UPLOAD,
        imageData: attachmentImageData,
        imageInfo: imageInfo,
        original_text: message || "",
        current_menu: "homework_help", // Explicitly set menu
        hasImage: true, // Flag for clearer processing
      };
    } else {
      return {
        type: GOAT_COMMANDS.HOMEWORK_HELP,
        text: message || "",
        current_menu: "homework_help", // Explicitly set menu
      };
    }
  }

  if (
    /^[1234]$/.test(text) &&
    userContext.current_menu === "exam_prep_conversation"
  ) {
    return {
      type: GOAT_COMMANDS.NUMBERED_MENU_COMMAND,
      option: parseInt(text),
      original_text: message,
    };
  }

  if (/^[123]$/.test(text) && userContext.current_menu === "welcome") {
    return {
      type: GOAT_COMMANDS.MENU_CHOICE,
      choice: parseInt(text),
      action:
        text === "1"
          ? "exam_prep"
          : text === "2"
          ? "homework_help"
          : "memory_hacks",
    };
  }

  // Handle A, B, C options for alternative paths
  if (
    /^[abc]$/i.test(text) &&
    userContext.ai_intel_state === AI_INTEL_STATES.ALTERNATIVE_PATHS
  ) {
    return {
      type: GOAT_COMMANDS.EXAM_PREP_CONVERSATION,
      text: message,
      alternative_choice: text.toUpperCase(),
    };
  }

  // Define menu commands
  const MENU_COMMANDS = {
    CONTINUE: "continue",
    QUESTION: "question",
    SOLUTION: "solution",
    SWITCH: "switch",
    MENU: "menu",
    NEXT: "next",
  };

  if (Object.values(MENU_COMMANDS).includes(text)) {
    return {
      type: GOAT_COMMANDS.FIXED_MENU_COMMAND,
      command: text,
      original_text: message,
    };
  }

  if (
    !message ||
    text.includes("start") ||
    text.includes("hi") ||
    text.includes("hello")
  ) {
    return { type: GOAT_COMMANDS.WELCOME };
  }

  const currentMenu = userContext.current_menu || "welcome";

  switch (currentMenu) {
    case "exam_prep_conversation":
      return { type: GOAT_COMMANDS.EXAM_PREP_CONVERSATION, text: message };
    case "homework_active":
      return { type: GOAT_COMMANDS.HOMEWORK_HELP, text: message };
    case "memory_hacks_active":
      return { type: GOAT_COMMANDS.MEMORY_HACKS, text: message };
    default:
      return { type: GOAT_COMMANDS.WELCOME };
  }
}

module.exports = {
  extractImageData,
  parseGoatCommand,
};

