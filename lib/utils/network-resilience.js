/**
 * Network Resilience Utilities
 * GOAT Bot 2.0
 * Created: 2025-08-25 13:50:12 UTC
 * Developer: DithetoMokgabudi
 */

const RETRY_INTERVAL = 60 * 1000; // 1 minute
const MAX_RETRIES = 3;

// Retry queues for different operation types
const retryQueues = {
  analytics: [],
  state: [],
  users: [],
};

// Retry counters to avoid infinite retry loops
const retryCounters = new Map();

/**
 * Queue an operation for retry
 * @param {string} type - Operation type
 * @param {...any} args - Operation arguments
 */
function queueForRetry(type, ...args) {
  if (!retryQueues[type]) return;

  const key = `${type}:${JSON.stringify(args[0])}`;
  const retryCount = retryCounters.get(key) || 0;

  if (retryCount >= MAX_RETRIES) {
    console.log(`⚠️ Max retries reached for ${type} operation: ${key}`);
    retryCounters.delete(key);
    return;
  }

  retryCounters.set(key, retryCount + 1);

  if (retryQueues[type].length < 100) {
    // Limit queue size
    retryQueues[type].push({
      args,
      timestamp: Date.now(),
      retryCount,
    });

    console.log(
      `🔄 Queued ${type} operation for retry: ${key} (attempt ${
        retryCount + 1
      })`
    );
  }
}

/**
 * Process retry queues
 * @param {object} modules - Modules containing retry functions
 */
function processRetryQueues(modules) {
  const { analyticsModule, stateModule, userModule } = modules;

  // Process analytics retries
  if (analyticsModule && retryQueues.analytics.length > 0) {
    console.log(
      `🔄 Processing ${retryQueues.analytics.length} analytics retries`
    );

    const batch = retryQueues.analytics.splice(0, 10);
    batch.forEach((item) => {
      analyticsModule.trackEvent(...item.args).catch((err) => {
        console.error("Retry failed for analytics:", err);
      });
    });
  }

  // Process state persistence retries
  if (stateModule && retryQueues.state.length > 0) {
    console.log(
      `🔄 Processing ${retryQueues.state.length} state persistence retries`
    );

    const batch = retryQueues.state.splice(0, 5);
    batch.forEach((item) => {
      stateModule.persistUserState(...item.args).catch((err) => {
        console.error("Retry failed for state persistence:", err);
      });
    });
  }

  // Process user management retries
  if (userModule && retryQueues.users.length > 0) {
    console.log(
      `🔄 Processing ${retryQueues.users.length} user management retries`
    );

    const batch = retryQueues.users.splice(0, 5);
    batch.forEach((item) => {
      userModule.ensureUserExists(...item.args).catch((err) => {
        console.error("Retry failed for user management:", err);
      });
    });
  }
}

/**
 * Start retry scheduler
 * @param {object} modules - Modules containing retry functions
 */
function startRetryScheduler(modules) {
  // Process retries every minute
  setInterval(() => {
    processRetryQueues(modules);
  }, RETRY_INTERVAL).unref();

  console.log("🔄 Network resilience retry scheduler started");
}

module.exports = {
  queueForRetry,
  processRetryQueues,
  startRetryScheduler,
};

