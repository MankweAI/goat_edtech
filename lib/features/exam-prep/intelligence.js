/**
 * Exam Prep Intelligence System
 * GOAT Bot 2.0
 * Updated: 2025-08-23 15:21:03 UTC
 */

const { generateDynamicTargetedProbe } = require("../../utils/probing");
const {
  formatResponseWithEnhancedSeparation,
  generateEnhancedVisualMenu,
} = require("../../utils/formatting");
const { AI_INTEL_STATES } = require("../../core/state");
const { checkSubjectAvailability } = require("../../data/subject-database");

// Start AI intelligence gathering
async function startAIIntelligenceGathering(user) {
  console.log(`🤖 Starting FIXED AI intelligence for user ${user.id}`);

  user.current_menu = "exam_prep_conversation";
  user.context = {
    ai_intel_state: AI_INTEL_STATES.EXAM_OR_TEST,
    painpoint_profile: {},
    painpoint_confirmed: false,
    probing_attempts: 0,
  };

  return `📅 **Exam/Test Prep Mode Activated!** 😰➡️😎

📍 **Step 1/5:** Assessment Type

Exam or test stress? I'll generate questions to unstuck you!

**First** - is this an **EXAM** or **TEST**? *(Different question styles!)*`;
}

// Analyze painpoint clarity
async function analyzeEnhancedPainpointClarity(userResponse, profile) {
  const response = userResponse.toLowerCase().trim();

  console.log(`🔍 Enhanced analysis for: "${userResponse}"`);

  // TRIGONOMETRY SPECIFIC CLEAR INDICATORS
  const trig_clear_indicators = [
    "don't understand ratios",
    "can't understand ratios",
    "ratios confuse me",
    // More indicators...
  ];

  // ALGEBRA SPECIFIC CLEAR INDICATORS
  const algebra_clear_indicators = [
    "solve for x",
    "cannot solve",
    "can't solve",
    // More indicators...
  ];

  // GEOMETRY SPECIFIC CLEAR INDICATORS
  const geometry_clear_indicators = [
    "can't visualize",
    "don't understand shapes",
    // More indicators...
  ];

  // GENERAL MATHEMATICAL CLEAR INDICATORS
  const general_math_clear_indicators = [
    "get confused when",
    "stuck on",
    // More indicators...
  ];

  // CHECK FOR SUBJECT-SPECIFIC CLARITY
  const topic = profile.topic_struggles?.toLowerCase() || "";

  // Topic-specific checks
  if (topic.includes("trig")) {
    const hasTrigClarity = trig_clear_indicators.some((indicator) =>
      response.includes(indicator)
    );

    if (hasTrigClarity) {
      return {
        clarity_level: "clear",
        specific_struggle: userResponse,
        needs_more_probing: false,
        recognition_reason: "trigonometry_specific_clear_indicator",
      };
    }
  }

  // More topic checks...

  // Check for clear struggle phrases
  const clear_struggle_phrases = [
    "i don't understand",
    "i can't understand",
    // More phrases...
  ];

  const hasClearStrugglePhrase = clear_struggle_phrases.some((phrase) =>
    response.includes(phrase)
  );

  if (hasClearStrugglePhrase && response.length > 8) {
    return {
      clarity_level: "clear",
      specific_struggle: userResponse,
      needs_more_probing: false,
      recognition_reason: "clear_struggle_phrase_detected",
    };
  }

  // Check for vague responses
  const definite_vague_indicators = [
    "i don't know",
    "not sure",
    // More indicators...
  ];

  const isDefinitelyVague = definite_vague_indicators.some(
    (indicator) => response === indicator || response === indicator + "."
  );

  if (isDefinitelyVague) {
    return {
      clarity_level: "vague",
      specific_struggle: response,
      needs_more_probing: true,
      recognition_reason: "vague_response_detected",
    };
  }

  // Default to clear for reasonable length
  if (response.length > 10) {
    return {
      clarity_level: "clear",
      specific_struggle: response,
      needs_more_probing: false,
      recognition_reason: "sufficient_length_and_content",
    };
  }

  return {
    clarity_level: "unclear",
    specific_struggle: response,
    needs_more_probing: true,
    recognition_reason: "insufficient_detail",
  };
}

// Generate painpoint confirmation
async function generateImprovedPainpointConfirmation(user, painpointClarity) {
  const profile = user.context.painpoint_profile;
  const struggle = painpointClarity.specific_struggle;

  console.log(`✅ Generating confirmation for: ${struggle}`);

  const content = `**Perfect! Let me confirm I understand your struggle:**

**Subject:** ${profile.subject} Grade ${profile.grade}
**Topic:** ${profile.topic_struggles}
**Specific Challenge:** "${struggle}"

**Is this correct?** I'll create practice questions targeting exactly this challenge.

**Type 'yes' if this is right, or tell me what I misunderstood.**

📍 **Step 5/5:** Confirmation Required`;

  const menu = generateEnhancedVisualMenu(
    AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION,
    user.preferences.device_type
  );
  return formatResponseWithEnhancedSeparation(
    content,
    menu,
    user.preferences.device_type
  );
}

// More intelligence functions...

module.exports = {
  startAIIntelligenceGathering,
  analyzeEnhancedPainpointClarity,
  generateImprovedPainpointConfirmation,
  // Export other functions...
};


