/**
 * State Management
 * GOAT Bot 2.0
 * Updated: 2025-08-25 10:47:12 UTC
 * Developer: DithetoMokgabudi
 * Changes: Adapted persistence to match existing schema
 */

const { createClient } = require("@supabase/supabase-js");
const { queueForRetry } = require("../utils/network-resilience");

// Initialize Supabase client for persistence
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log("🔄 Supabase initialized for state persistence");
  } else {
    console.log(
      "⚠️ Supabase credentials missing, running with in-memory state only"
    );
  }
} catch (error) {
  console.error("❌ Supabase initialization error:", error);
}

// Enhanced user state management with persistence capabilities
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
  // Add new states
  AI_DIAGNOSTIC_QUESTION: "ai_diagnostic_question",
  AI_DIAGNOSTIC_ANALYSIS: "ai_diagnostic_analysis",
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

/**
 * NEW: Track analytics event in the database
 * @param {string} userId - User identifier
 * @param {string} type - Event type
 * @param {object} details - Event details
 */
async function trackAnalytics(userId, type, details = {}) {
  if (!supabase || !userId || !type) return false;

  try {
    const eventData = {
      userID: userId,
      type,
      details,
      feature_used: "exam_prep",
      ts: new Date().toISOString(),
    };

    const { error } = await supabase.from("analytics_events").insert(eventData);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`❌ Analytics tracking error for ${userId}:`, error);
    return false;
  }
}

/**
 * Persist user state to database
 * @param {string} userId - User identifier
 * @param {object} state - User state to persist
 * @returns {Promise<boolean>} - Success indicator
 */
async function persistUserState(userId, state) {
  if (!supabase || !userId) return false;

  try {
    // Don't block on database operations - make them fire-and-forget
    // with appropriate error handling
    const persistPromise = async () => {
      try {
        // Use a timeout for the operation
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("State persistence timeout")),
            5000
          );
        });

        // Ensure base user exists without blocking
        await Promise.race([
          ensureUserExists(userId, state).catch((err) => {
            console.error(`❌ Error ensuring user ${userId} exists:`, {
              message: err.message,
              timestamp: new Date().toISOString(),
            });
          }),
          timeoutPromise,
        ]);

        const stateToSave = {
          userID: userId,
          current_menu: state.current_menu || "welcome",
          context: state.context || {},
          painpoint_profile:
            state.painpoint_profile || state.context?.painpoint_profile || {},
          preferences: state.preferences || {},
          conversation_history: (state.conversation_history || []).slice(-10), // Keep last 10 messages
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Check if user state already exists
        const { data: existingState, error: queryError } = await Promise.race([
          supabase
            .from("user_states")
            .select("userID")
            .eq("userID", userId)
            .single(),
          timeoutPromise,
        ]);

        if (queryError && queryError.code !== "PGRST116") throw queryError;

        if (existingState) {
          // Update existing state
          const { error } = await Promise.race([
            supabase
              .from("user_states")
              .update(stateToSave)
              .eq("userID", userId),
            timeoutPromise,
          ]);

          if (error) throw error;
        } else {
          // Insert new state
          const { error } = await Promise.race([
            supabase
              .from("user_states")
              .insert({ ...stateToSave, created_at: new Date().toISOString() }),
            timeoutPromise,
          ]);

          if (error) throw error;
        }

        console.log(`💾 State persisted for user ${userId}`);
        return true;
      } catch (error) {
        console.error(`❌ Error persisting state for user ${userId}:`, {
          message: error.message,
          timestamp: new Date().toISOString(),
        });

        // Queue for retry
        if (typeof queueForRetry === "function") {
          queueForRetry("state", userId, state);
        } else {
          console.error("❌ queueForRetry not available for retry queueing");
        }

        return false;
      }
    };

    // Fire and forget - don't await this
    persistPromise().catch((err) => {
      console.error(`❌ Unhandled state persistence error for ${userId}:`, err);
    });

    // Always return success immediately - we've stored in memory already
    return true;
  } catch (error) {
    console.error(
      `❌ Error initiating state persistence for user ${userId}:`,
      error
    );
    return false;
  }
}

/**
 * Ensure user exists in the users table
 * @param {string} userId - User identifier
 * @param {object} state - Current user state
 */
async function ensureUserExists(userId, state) {
  if (!supabase || !userId) return;

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("userID")
      .eq("userID", userId)
      .single();

    if (!existingUser) {
      // Create user with information from state
      const grade =
        state?.painpoint_profile?.grade || state?.preferences?.last_grade;
      const subject =
        state?.painpoint_profile?.subject || state?.preferences?.last_subject;

      const userData = {
        userID: userId,
        grade: grade || null,
        examSubject: subject || null,
        studyPlan: {},
        optInStatus: true,
      };

      const { error } = await supabase.from("users").insert(userData);
      if (error) throw error;

      console.log(`👤 Created new user ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Error ensuring user ${userId} exists:`, error);
  }
}

/**
 * Retrieve user state from database
 * @param {string} userId - User identifier
 * @returns {Promise<object|null>} - Retrieved user state or null
 */
async function retrieveUserState(userId) {
  if (!supabase || !userId) return null;

  try {
    // First check if the user state exists
    const { data: stateData, error: stateError } = await supabase
      .from("user_states")
      .select("*")
      .eq("userID", userId)
      .single();

    if (stateError && stateError.code !== "PGRST116") throw stateError;

    if (stateData) {
      // Update in-memory state
      userStates.set(userId, {
        id: userId,
        current_menu: stateData.current_menu,
        context: stateData.context || {},
        painpoint_profile: stateData.painpoint_profile || {},
        preferences: stateData.preferences || {},
        conversation_history: stateData.conversation_history || [],
        last_active: stateData.last_active,
      });

      console.log(`📂 Retrieved state for user ${userId}`);
      return userStates.get(userId);
    }

    // If no state exists, check the users table for grade/subject info
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("userID", userId)
      .single();

    if (userError && userError.code !== "PGRST116") throw userError;

    if (userData) {
      // Create initial state based on user data
      const initialState = {
        id: userId,
        current_menu: "welcome",
        context: {},
        painpoint_profile: {},
        preferences: {
          last_grade: userData.grade,
          last_subject: userData.examSubject,
        },
        conversation_history: [],
        last_active: new Date().toISOString(),
      };

      userStates.set(userId, initialState);
      console.log(`📂 Created initial state for existing user ${userId}`);
      return initialState;
    }

    return null;
  } catch (error) {
    console.error(`❌ Error retrieving state for user ${userId}:`, error);
    return null;
  }
}

/**
 * Get or create user state with persistence
 * @param {string} userId - User identifier
 * @returns {Promise<object>} - User state
 */
async function getOrCreateUserState(userId) {
  // First check in-memory state
  if (userStates.has(userId)) {
    const state = userStates.get(userId);
    state.last_active = new Date().toISOString();
    return state;
  }

  // Try to retrieve from database
  const retrievedState = await retrieveUserState(userId);
  if (retrievedState) return retrievedState;

  // Create new state if not found
  const newState = {
    id: userId,
    current_menu: "welcome",
    context: {},
    painpoint_profile: {},
    preferences: {},
    conversation_history: [],
    last_active: new Date().toISOString(),
  };

  userStates.set(userId, newState);

  // Try to persist the new state (fire and forget)
  persistUserState(userId, newState).catch((err) =>
    console.error(`❌ Initial persistence failed for ${userId}:`, err)
  );

  return newState;
}

// Export enhanced module
module.exports = {
  userStates,
  MANYCHAT_STATES,
  GOAT_COMMANDS,
  AI_INTEL_STATES,
  trackManyState,
  setupStateCleanup,
  // Export new functions
  persistUserState,
  retrieveUserState,
  getOrCreateUserState,
  trackAnalytics,
};
