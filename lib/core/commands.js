/**
 * Command Processing
 * GOAT Bot 2.0
 * Updated: 2025-08-23 14:58:19 UTC
 */

const { GOAT_COMMANDS, AI_INTEL_STATES, MANYCHAT_STATES } = require("./state");


function extractImageData(req) {
  // More thorough check for all possible image data formats
  const imageData =
    req.body.imageData ||
    (req.body.attachments && req.body.attachments.image) ||
    (req.body.media && req.body.media.image) ||
    (req.body.message &&
      req.body.message.attachments &&
      req.body.message.attachments[0] &&
      req.body.message.attachments[0].payload &&
      req.body.message.attachments[0].payload.url) || // Facebook Messenger format
    null;

  // Check for media URL in various locations
  const mediaUrl =
    (req.body.media && req.body.media.url) ||
    req.body.attachment_url ||
    (req.body.payload && req.body.payload.url) ||
    (req.body.message && req.body.message.attachment_url) ||
    null;

  // Log what we found for debugging
  if (imageData) {
    const dataSize =
      typeof imageData === "string"
        ? `(${(imageData.length / 1024).toFixed(2)}KB)`
        : "(size unknown)";
    console.log(`📸 Found direct image data: ${typeof imageData} ${dataSize}`);
    return { type: "direct", data: imageData };
  }

  if (mediaUrl) {
    console.log(`📸 Found media URL: ${mediaUrl.substring(0, 100)}`);
    return { type: "url", data: mediaUrl };
  }

  // Deep inspection for debugging - expanded for more potential locations
  console.log(`📸 Deep request inspection for image data`);

  // Check top-level properties
  if (req.body.media) {
    console.log(
      `📸 Media object keys: ${Object.keys(req.body.media).join(", ")}`
    );
  }

  if (req.body.message) {
    console.log(
      `📸 Message object keys: ${Object.keys(req.body.message).join(", ")}`
    );
  }

  if (req.body.attachments) {
    console.log(`📸 Attachments present: ${typeof req.body.attachments}`);
  }

  // Enhanced flag detection - check for any property that might indicate an image
  const hasImageIndicators =
    req.body.has_image === true ||
    req.body.has_attachment === true ||
    req.body.has_media === true ||
    (req.body.message && req.body.message.has_attachment) ||
    (req.body.message &&
      req.body.message.attachments &&
      req.body.message.attachments.length > 0) ||
    (req.body.event_type &&
      (req.body.event_type.includes("image") ||
        req.body.event_type.includes("media") ||
        req.body.event_type.includes("attachment")));

  if (hasImageIndicators) {
    console.log(
      `📸 Image flag/indicator detected - routing to homework handler anyway`
    );
    // Log the entire body structure for debugging (with sensitive data removed)
    console.log(
      `📸 Request body structure:`,
      JSON.stringify(sanitizeObject(req.body), null, 2).substring(0, 500) +
        "..."
    );
    return { type: "pending", data: null };
  }

  console.log(`📸 No image found in request`);
  return null;
}

// Helper function to sanitize the object before logging (remove potentially sensitive data)
function sanitizeObject(obj) {
  if (!obj) return obj;
  const sanitized = { ...obj };

  // Remove potentially sensitive fields
  const sensitiveFields = ["token", "password", "api_key", "secret"];
  for (const key in sanitized) {
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
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

