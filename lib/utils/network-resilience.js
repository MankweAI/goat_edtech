/**
 * Network Resilience Utilities
 * GOAT Bot 2.0
 * Created: 2025-08-25 13:50:12 UTC
 * Developer: DithetoMokgabudi
 */

const RETRY_INTERVAL = 30 * 1000; // 30 seconds (reduced from 60)
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second base delay

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

function getBackoffDelay(attempt) {
  const delay = BASE_DELAY * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * delay; // 10% jitter
  return Math.min(delay + jitter, 30000); // Max 30 seconds
}


function queueForRetry(type, ...args) {
  if (!retryQueues[type]) {
    console.log(`⚠️ Attempted to queue for unknown retry type: ${type}`);
    return;
  }

  const keyString =
    typeof args[0] === "string" ? args[0] : JSON.stringify(args[0]);
  const key = `${type}:${keyString}`;
  const retryCount = retryCounters.get(key) || 0;

  if (retryCount >= MAX_RETRIES) {
    console.log(`⚠️ Max retries reached for ${type} operation: ${key}`);
    retryCounters.delete(key);
    return;
  }

  retryCounters.set(key, retryCount + 1);

  if (retryQueues[type].length < 50) {
    // Reduced queue size
    const delay = getBackoffDelay(retryCount + 1);

    retryQueues[type].push({
      args,
      timestamp: Date.now(),
      retryCount,
      executeAt: Date.now() + delay,
    });

    console.log(
      `🔄 Queued ${type} operation for retry: ${key} (attempt ${
        retryCount + 1
      }, delay: ${Math.round(delay / 1000)}s)`
    );
  }
}

/**
 * Process retry queues
 * @param {object} modules - Modules containing retry functions
 */
function processRetryQueues(modules) {
  const { analyticsModule, stateModule } = modules;
  const now = Date.now();

  // Process analytics retries
  if (analyticsModule && retryQueues.analytics.length > 0) {
    const readyItems = retryQueues.analytics.filter(
      (item) => now >= item.executeAt
    );
    if (readyItems.length > 0) {
      console.log(`🔄 Processing ${readyItems.length} analytics retries`);

      // Remove processed items from queue
      retryQueues.analytics = retryQueues.analytics.filter(
        (item) => now < item.executeAt
      );

      // Process ready items
      readyItems.slice(0, 5).forEach((item) => {
        // Limit concurrent retries
        analyticsModule.trackEvent(...item.args).catch((err) => {
          console.error("Analytics retry failed:", err.message);
          // Re-queue if not at max retries
          if (item.retryCount < MAX_RETRIES - 1) {
            queueForRetry("analytics", ...item.args);
          }
        });
      });
    }
  }

  // Process state persistence retries
  if (stateModule && retryQueues.state.length > 0) {
    const readyItems = retryQueues.state.filter(
      (item) => now >= item.executeAt
    );
    if (readyItems.length > 0) {
      console.log(
        `🔄 Processing ${readyItems.length} state persistence retries`
      );

      // Remove processed items from queue
      retryQueues.state = retryQueues.state.filter(
        (item) => now < item.executeAt
      );

      // Process ready items
      readyItems.slice(0, 3).forEach((item) => {
        // Limit concurrent retries
        stateModule.persistUserState(...item.args).catch((err) => {
          console.error("State persistence retry failed:", err.message);
          // Re-queue if not at max retries
          if (item.retryCount < MAX_RETRIES - 1) {
            queueForRetry("state", ...item.args);
          }
        });
      });
    }
  }
}

/**
 * Start retry scheduler
 * @param {object} modules - Modules containing retry functions
 */
function startRetryScheduler(modules) {
  // Process retries every 30 seconds
  setInterval(() => {
    try {
      processRetryQueues(modules);
    } catch (error) {
      console.error("❌ Error in retry scheduler:", error);
    }
  }, RETRY_INTERVAL).unref();

  console.log("🔄 Network resilience retry scheduler started (30s interval)");
}

function getRetryStats() {
  return {
    analytics: retryQueues.analytics.length,
    state: retryQueues.state.length,
    users: retryQueues.users.length,
    totalRetryCounters: retryCounters.size,
    timestamp: new Date().toISOString(),
  };
}


module.exports = {
  queueForRetry,
  processRetryQueues,
  startRetryScheduler,
  getRetryStats,
  MAX_RETRIES,
};

