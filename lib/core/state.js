/**
 * State Management
 * GOAT Bot 2.0
 * Updated: 2025-08-25 09:48:44 UTC
 * Developer: DithetoMokgabudi
 * Changes: Added error handling to trackManyState
 */

// Enhanced user state management
const userStates = new Map();

// Add ManyChat state tracking code
const MANYCHAT_STATES = {
  // Track last command by subscriber_id
  lastCommand: new Map(),
  // Track last menu by subscriber_id
  lastMenu: new Map(),
  // Max retention time (12 hours)
  TTL: 12 * 60 * 60 * 1000,
};

// Define constants for state tracking
const GOAT_COMMANDS = {
  WELCOME: "welcome",
  MENU_CHOICE: "menu_choice",
  EXAM_PREP_CONVERSATION: "exam_prep_conversation",
  HOMEWORK_HELP: "homework_help",
  HOMEWORK_UPLOAD: "homework_upload",
  MEMORY_HACKS: "memory_hacks",
  FIXED_MENU_COMMAND: "fixed_menu_command",
  NUMBERED_MENU_COMMAND: "numbered_menu_command",
};

const AI_INTEL_STATES = {
  EXAM_OR_TEST: "ai_exam_or_test",
  SUBJECT_GRADE: "ai_subject_grade",
  AI_PAINPOINT_EXCAVATION: "ai_painpoint_excavation",
  AI_MICRO_TARGETING: "ai_micro_targeting",
  AI_PAINPOINT_CONFIRMATION: "ai_painpoint_confirmation",
  AI_QUESTION_GENERATION: "ai_question_generation",
  GUIDED_DISCOVERY: "guided_discovery",
  ALTERNATIVE_PATHS: "alternative_paths",
};

// Enhanced state tracking function with error handling
function trackManyState(subscriberId, state) {
  try {
    if (!subscriberId || typeof subscriberId !== "string") {
      console.warn(`⚠️ Invalid subscriberId: ${subscriberId}`);
      return;
    }

    // Track user's last command type
    MANYCHAT_STATES.lastCommand.set(subscriberId, {
      command: state?.type || "unknown",
      timestamp: Date.now(),
    });

    // Track user's menu position
    MANYCHAT_STATES.lastMenu.set(subscriberId, {
      menu: state?.current_menu || "welcome",
      timestamp: Date.now(),
    });

    console.log(
      `🔄 ManyChat state tracked: ${subscriberId} | Menu: ${
        state?.current_menu || "welcome"
      }`
    );
  } catch (error) {
    console.error(`❌ Error tracking state for user ${subscriberId}:`, error);
  }
}

// Add memory cleanup for ManyChat state
function setupStateCleanup() {
  // Add .unref() to prevent keeping the process alive
  return setInterval(() => {
    const now = Date.now();
    let cleanedEntries = 0;

    // Clean lastCommand map
    for (const [key, data] of MANYCHAT_STATES.lastCommand.entries()) {
      if (now - data.timestamp > MANYCHAT_STATES.TTL) {
        MANYCHAT_STATES.lastCommand.delete(key);
        cleanedEntries++;
      }
    }

    // Clean lastMenu map
    for (const [key, data] of MANYCHAT_STATES.lastMenu.entries()) {
      if (now - data.timestamp > MANYCHAT_STATES.TTL) {
        MANYCHAT_STATES.lastMenu.delete(key);
        cleanedEntries++;
      }
    }

    if (cleanedEntries > 0) {
      console.log(
        `🧹 Cleaned up ${cleanedEntries} expired ManyChat state entries`
      );
    }
  }, 60 * 60 * 1000).unref(); // Run cleanup every hour and allow process to exit
}

module.exports = {
  userStates,
  MANYCHAT_STATES,
  GOAT_COMMANDS,
  AI_INTEL_STATES,
  trackManyState,
  setupStateCleanup,
};
