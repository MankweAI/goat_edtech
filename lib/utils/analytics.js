/**
 * Analytics System
 * GOAT Bot 2.0
 * Created: 2025-08-25 11:36:53 UTC
 * Developer: DithetoMokgabudi
 */

const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log("🔄 Supabase initialized for analytics");
  } else {
    console.log(
      "⚠️ Supabase credentials missing, running with in-memory analytics only"
    );
  }
} catch (error) {
  console.error("❌ Supabase initialization error:", error);
}

// In-memory analytics store for when DB is unavailable
const localAnalytics = {
  events: [],
  contentMetrics: new Map(),
};

/**
 * Track an analytics event
 * @param {string} userId - User identifier
 * @param {string} eventType - Type of event
 * @param {object} details - Event details
 * @returns {Promise<boolean>} - Success indicator
 */
async function trackEvent(userId, eventType, details = {}) {
  // Always store locally first
  localAnalytics.events.push({
    userID: userId,
    type: eventType,
    details,
    ts: new Date().toISOString(),
  });

  // Trim local storage if it gets too large
  if (localAnalytics.events.length > 1000) {
    localAnalytics.events = localAnalytics.events.slice(-500);
  }

  // Try to store in database if available
  if (supabase) {
    try {
      // Add timeout handling with INCREASED TIMEOUT (10s instead of 5s)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Database operation timeout")),
          10000
        );
      });

      // Create the actual database operation
      const dbPromise = supabase.from("analytics_events").insert({
        userID: userId,
        type: eventType,
        details,
        ts: new Date().toISOString(),
      });

      // Race between timeout and DB operation
      const { error } = await Promise.race([dbPromise, timeoutPromise]);

      if (error) throw error;
      return true;
    } catch (error) {
      // Enhanced error logging but don't stop the application flow
      console.error(`❌ Failed to track event for ${userId}:`, {
        message: error.message,
        eventType,
        timestamp: new Date().toISOString(),
      });

      // Queue for retry if appropriate
      if (typeof queueForRetry === "function") {
        queueForRetry("analytics", userId, eventType, details);
      } else {
        console.error(
          "❌ queueForRetry not available for analytics retry queueing"
        );
      }

      return false;
    }
  }

  return false;
}

// Simple retry queue for network operations
const retryQueue = {
  analytics: [],
  state: [],
  users: []
};

function queueForRetry(type, ...args) {
  if (retryQueue[type].length < 100) {
    // Limit queue size
    retryQueue[type].push({
      args,
      timestamp: Date.now(),
    });
  }
}

/**
 * Record content quality metrics
 * @param {string} contentId - Content identifier
 * @param {number} rating - User rating (1-5)
 * @param {object} metadata - Content metadata
 * @returns {Promise<boolean>} - Success indicator
 */
async function recordContentQuality(contentId, rating, metadata = {}) {
  // Store locally
  if (!localAnalytics.contentMetrics.has(contentId)) {
    localAnalytics.contentMetrics.set(contentId, {
      ratings: [],
      total_ratings: 0,
      user_rating_avg: 0,
      metadata,
    });
  }

  const metrics = localAnalytics.contentMetrics.get(contentId);
  metrics.ratings.push(rating);
  metrics.total_ratings = metrics.ratings.length;
  metrics.user_rating_avg =
    metrics.ratings.reduce((sum, r) => sum + r, 0) / metrics.total_ratings;

  // Try to store in database
  if (supabase) {
    try {
      // Check if record exists
      const { data, error: fetchError } = await supabase
        .from("content_quality_metrics")
        .select("contentID, user_rating_avg, total_ratings")
        .eq("contentID", contentId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      if (data) {
        // Update existing record
        const newAvg =
          (data.user_rating_avg * data.total_ratings + rating) /
          (data.total_ratings + 1);
        const { error } = await supabase
          .from("content_quality_metrics")
          .update({
            user_rating_avg: newAvg,
            total_ratings: data.total_ratings + 1,
            updated: new Date().toISOString(),
          })
          .eq("contentID", contentId);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from("content_quality_metrics")
          .insert({
            contentID: contentId,
            user_rating_avg: rating,
            total_ratings: 1,
            caps_alignment: metadata.caps_alignment || 1.0,
            accuracy_score: metadata.accuracy_score || 0.8,
            sa_terminology_score: metadata.sa_terminology_score || 1.0,
            educational_value: metadata.educational_value || rating / 5,
            updated: new Date().toISOString(),
          });

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error(
        `❌ Failed to record content quality for ${contentId}:`,
        error
      );
      return false;
    }
  }

  return false;
}

/**
 * Get personalized recommendations based on user history
 * @param {string} userId - User identifier
 * @param {object} currentContext - Current user context
 * @returns {Promise<object>} - Personalized recommendations
 */
async function getPersonalizedRecommendations(userId, currentContext = {}) {
  const recommendations = {
    recommended_subjects: [],
    recommended_topics: [],
    learning_pattern: "sequential",
    difficulty_preference: "mixed",
    visual_preference: false,
    next_best_topic: null,
  };

  try {
    if (!supabase) return recommendations;

    // Get user's recent analytics events
    const { data: events, error: eventsError } = await supabase
      .from("analytics_events")
      .select("type, details, ts")
      .eq("userID", userId)
      .order("ts", { ascending: false })
      .limit(100);

    if (eventsError) throw eventsError;

    // Analyze learning patterns
    if (events && events.length > 0) {
      // Extract subjects and topics
      const subjectCounts = {};
      const topicCounts = {};
      let questionViewCount = 0;
      let solutionViewCount = 0;
      let complexContentCount = 0;
      let simpleContentCount = 0;
      let lastSubject = null;
      let lastTopic = null;

      events.forEach((event) => {
        // Track subjects and topics
        const subject = event.details?.subject;
        const topic = event.details?.topic;

        if (subject) {
          subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
          lastSubject = lastSubject || subject;
        }

        if (topic) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          lastTopic = lastTopic || topic;
        }

        // Track interaction patterns
        if (event.type === "exam_question_generated") {
          questionViewCount++;
        } else if (event.type === "solution_viewed") {
          solutionViewCount++;
        }

        // Track content complexity preferences
        if (
          event.details?.complexity === "complex" ||
          event.details?.has_latex
        ) {
          complexContentCount++;
        } else {
          simpleContentCount++;
        }
      });

      // Determine recommendations based on usage patterns
      // 1. Preferred subjects
      recommendations.recommended_subjects = Object.entries(subjectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((entry) => entry[0]);

      // 2. Preferred topics
      recommendations.recommended_topics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((entry) => entry[0]);

      // 3. Learning pattern
      recommendations.learning_pattern =
        solutionViewCount / Math.max(questionViewCount, 1) > 0.7
          ? "comprehensive"
          : "practice-focused";

      // 4. Content complexity preference
      recommendations.visual_preference =
        complexContentCount /
          Math.max(complexContentCount + simpleContentCount, 1) >
        0.5;

      // 5. Difficulty preference
      const { data: userFeedback } = await supabase
        .from("user_feedback")
        .select("rating, helpful")
        .eq("userID", userId)
        .order("timestamp", { ascending: false })
        .limit(20);

      if (userFeedback && userFeedback.length > 0) {
        const avgRating =
          userFeedback.reduce((sum, item) => sum + (item.rating || 0), 0) /
          userFeedback.length;

        // Higher ratings on difficult content suggest preference for challenge
        recommendations.difficulty_preference =
          avgRating > 3.5
            ? "challenging"
            : avgRating > 2.5
            ? "mixed"
            : "simplified";
      }

      // 6. Next best topic recommendation
      if (currentContext.subject && lastSubject === currentContext.subject) {
        // Get related topics for the current subject
        const { data: relatedTopics } = await supabase
          .from("content_storage")
          .select("topic, subject, quality_score")
          .eq("subject", currentContext.subject)
          .neq("topic", currentContext.topic || "")
          .order("quality_score", { ascending: false })
          .limit(5);

        if (relatedTopics && relatedTopics.length > 0) {
          recommendations.next_best_topic = relatedTopics[0].topic;
        }
      }
    }

    return recommendations;
  } catch (error) {
    console.error(
      `❌ Failed to get personalized recommendations for ${userId}:`,
      error
    );
    return recommendations;
  }
}

/**
 * Get popular topics for a subject
 * @param {string} subject - Academic subject
 * @returns {Promise<Array>} - List of popular topics
 */
async function getPopularTopics(subject) {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("analytics_events")
      .select("details")
      .eq("type", "exam_question_generated")
      .filter("details->subject", "eq", subject)
      .order("ts", { ascending: false })
      .limit(100);

    if (error) throw error;

    if (!data || data.length === 0) return [];

    // Count topics
    const topicCounts = {};
    data.forEach((event) => {
      const topic = event.details?.topic;
      if (topic) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    });

    // Return sorted topics
    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0]);
  } catch (error) {
    console.error(`❌ Failed to get popular topics for ${subject}:`, error);
    return [];
  }
}

module.exports = {
  trackEvent,
  recordContentQuality,
  getPersonalizedRecommendations,
  getPopularTopics,
};

