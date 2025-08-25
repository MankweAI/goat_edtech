/**
 * Exam Prep Intelligence System
 * GOAT Bot 2.0
 * Updated: 2025-08-25 09:48:44 UTC
 * Developer: DithetoMokgabudi
 * Changes: Fixed generateEnhancedVisualMenu reference
 */

const { generateDynamicTargetedProbe } = require("../../utils/probing");
const {
  formatResponseWithEnhancedSeparation,
} = require("../../utils/formatting");
const { AI_INTEL_STATES } = require("../../core/state");
const { checkSubjectAvailability } = require("../../data/subject-database");

// FIX: Added generateEnhancedVisualMenu function directly since it's not imported properly
function generateEnhancedVisualMenu(aiState, deviceType = "mobile") {
  const spacing = deviceType === "mobile" ? "" : "  ";

  switch (aiState) {
    case AI_INTEL_STATES.EXAM_OR_TEST:
      return `1️⃣${spacing} ➡️ Continue
2️⃣${spacing} 📝 Skip to Question
3️⃣${spacing} 🔄 Switch Topics  
4️⃣${spacing} 🏠 Main Menu`;

    case AI_INTEL_STATES.SUBJECT_GRADE:
      return `1️⃣${spacing} ➡️ Continue Setup
2️⃣${spacing} 📝 Quick Question
3️⃣${spacing} 🔄 Different Subject
4️⃣${spacing} 🏠 Main Menu`;

    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
    case AI_INTEL_STATES.AI_MICRO_TARGETING:
    case AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION:
      return `1️⃣${spacing} ➡️ Continue
2️⃣${spacing} 📝 Skip to Question
3️⃣${spacing} 🔄 Switch Topics  
4️⃣${spacing} 🏠 Main Menu`;

    case AI_INTEL_STATES.AI_QUESTION_GENERATION:
    case AI_INTEL_STATES.GUIDED_DISCOVERY:
      return `1️⃣${spacing} 📚 Solution
2️⃣${spacing} ➡️ Next Question  
3️⃣${spacing} 🔄 Switch Topics
4️⃣${spacing} 🏠 Main Menu`;

    case AI_INTEL_STATES.ALTERNATIVE_PATHS:
      return `1️⃣${spacing} ➡️ Option A (Guided Discovery)
2️⃣${spacing} 📝 Option B (Different Topic)
3️⃣${spacing} 🔄 Option C (Different Subject)
4️⃣${spacing} 🏠 Main Menu`;

    default:
      return `1️⃣${spacing} ➡️ Continue
2️⃣${spacing} 📝 Practice Question
3️⃣${spacing} 🔄 Switch Topics
4️⃣${spacing} 🏠 Main Menu`;
  }
}

// Start AI intelligence gathering
async function startAIIntelligenceGathering(user) {
  console.log(`🤖 Starting AI intelligence for user ${user.id}`);

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

// Process user responses based on current state
async function processUserResponse(user, userResponse) {
  const currentState =
    user.context?.ai_intel_state || AI_INTEL_STATES.EXAM_OR_TEST;

  // Log incoming response and current state
  console.log(
    `🧠 Processing exam prep response: "${userResponse}" | Current state: ${currentState}`
  );

  switch (currentState) {
    case AI_INTEL_STATES.EXAM_OR_TEST:
      // Handle exam/test response and transition to next state
      if (
        userResponse.toLowerCase().includes("exam") ||
        userResponse.toLowerCase().includes("test")
      ) {
        // Update the assessment type in the profile
        user.context.painpoint_profile = {
          ...user.context.painpoint_profile,
          assessment_type: userResponse.toLowerCase().includes("exam")
            ? "exam"
            : "test",
        };

        // Transition to the next state
        user.context.ai_intel_state = AI_INTEL_STATES.SUBJECT_GRADE;

        // Generate the next prompt (subject and grade)
        return generateSubjectGradePrompt(user);
      }
      // If response doesn't contain exam/test, ask again more clearly
      return `📝 I need to know if this is an **EXAM** or **TEST** to customize questions.
      
Please type "exam" or "test" to continue.`;

    case AI_INTEL_STATES.SUBJECT_GRADE:
      return await handleSubjectGradeResponse(user, userResponse);

    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
      return await handlePainpointExcavation(user, userResponse);

    case AI_INTEL_STATES.AI_MICRO_TARGETING:
      return await handleMicroTargeting(user, userResponse);

    case AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION:
      return await handlePainpointConfirmation(user, userResponse);

    case AI_INTEL_STATES.AI_QUESTION_GENERATION:
      return await handleQuestionGeneration(user, userResponse);

    case AI_INTEL_STATES.GUIDED_DISCOVERY:
      return await handleGuidedDiscovery(user, userResponse);

    case AI_INTEL_STATES.ALTERNATIVE_PATHS:
      return await handleAlternativePaths(user, userResponse);

    default:
      // Default fallback to reset the flow
      user.context.ai_intel_state = AI_INTEL_STATES.EXAM_OR_TEST;
      return startAIIntelligenceGathering(user);
  }
}

// Generate subject and grade prompt
function generateSubjectGradePrompt(user) {
  return `📚 **Great!** Let's get you ready for your ${user.context.painpoint_profile.assessment_type}.

📍 **Step 2/5:** Subject & Grade

What **subject** and **grade** are you working on?
*(e.g., "Grade 11 Mathematics" or "Grade 9 Physical Sciences")*`;
}

// Handle subject and grade response
async function handleSubjectGradeResponse(user, userResponse) {
  // Extract subject and grade information
  const text = userResponse.toLowerCase();
  let grade = 11; // Default
  let subject = "Mathematics"; // Default

  // Extract grade
  const gradeMatch = text.match(/grade\s*(\d+)|gr\s*(\d+)|(\d+)\s*grade/i);
  if (gradeMatch) {
    const extractedGrade = parseInt(
      gradeMatch[1] || gradeMatch[2] || gradeMatch[3]
    );
    if (extractedGrade >= 8 && extractedGrade <= 11) {
      grade = extractedGrade;
    }
  }

  // Extract subject
  const subjectInfo = checkSubjectAvailability(text);
  if (subjectInfo.detected) {
    subject = subjectInfo.detected;
  }

  // Update user profile
  user.context.painpoint_profile = {
    ...user.context.painpoint_profile,
    grade,
    subject,
  };

  // Transition to next state
  user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION;

  // Generate topic struggles prompt
  return `📚 **${subject} Grade ${grade}** - Got it!

📍 **Step 3/5:** Topic Focus

Which **topics** in ${subject} are giving you trouble?
*(e.g., "Algebra" or "Chemical Reactions" or "Shakespeare")*`;
}

// Handle painpoint excavation
async function handlePainpointExcavation(user, userResponse) {
  const profile = user.context.painpoint_profile;

  // Update topic struggles
  profile.topic_struggles = userResponse.trim();
  user.context.painpoint_profile = profile;

  // Transition to next state
  user.context.ai_intel_state = AI_INTEL_STATES.AI_MICRO_TARGETING;

  // Generate micro-targeting prompt
  return `🎯 **${profile.topic_struggles}** - Let's zero in!

📍 **Step 4/5:** Specific Challenge

What **specifically** about ${profile.topic_struggles} is difficult for you?
*(e.g., "I don't understand how to factorize quadratics" or "I get confused with balancing equations")*`;
}

// Handle micro targeting
async function handleMicroTargeting(user, userResponse) {
  const profile = user.context.painpoint_profile;

  // Analyze painpoint clarity
  const painpointClarity = await analyzeEnhancedPainpointClarity(
    userResponse,
    profile
  );

  // If painpoint is clear enough, proceed to confirmation
  if (
    painpointClarity.clarity_level === "clear" &&
    !painpointClarity.needs_more_probing
  ) {
    profile.specific_failure = painpointClarity.specific_struggle;
    user.context.painpoint_profile = profile;

    // Transition to confirmation state
    user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION;

    // Generate confirmation
    return await generateImprovedPainpointConfirmation(user, painpointClarity);
  }

  // If painpoint needs more probing
  user.context.probing_attempts = (user.context.probing_attempts || 0) + 1;

  // Generate targeted probe
  const probe = await generateDynamicTargetedProbe(
    userResponse,
    profile,
    user.context.probing_attempts
  );

  return probe;
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

// Handle painpoint confirmation
async function handlePainpointConfirmation(user, userResponse) {
  const text = userResponse.toLowerCase().trim();

  // Check for confirmation
  if (
    text.includes("yes") ||
    text.includes("correct") ||
    text.includes("right")
  ) {
    // Mark painpoint as confirmed
    user.context.painpoint_confirmed = true;

    // Transition to question generation
    user.context.ai_intel_state = AI_INTEL_STATES.AI_QUESTION_GENERATION;

    // Generate targeted question message
    return `🎯 **Perfect! Generating your targeted question...**

I'm creating a practice question specifically for:
"${user.context.painpoint_profile.specific_failure}"

⏳ One moment please...`;
  }

  // If not confirmed, adjust based on response
  user.context.painpoint_profile.specific_failure = userResponse;

  // Generate updated confirmation
  return await generateImprovedPainpointConfirmation(user, {
    specific_struggle: userResponse,
    clarity_level: "clear",
  });
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

// Handle question generation
async function handleQuestionGeneration(user, userResponse) {
  // This function would generate a targeted question using the generateExamQuestions function
  // For now we'll just return a placeholder

  return `📝 **Here's your targeted practice question:**

Based on your specific struggle with "${user.context.painpoint_profile.specific_failure}"

[Question would be generated here using the generateExamQuestions function]

Reply with your answer, or type "solution" to see the solution.`;
}

// Handle guided discovery
async function handleGuidedDiscovery(user, userResponse) {
  // This would implement guided discovery educational approach
  return `🔍 **Guided Discovery:**

Let's explore this concept together step by step...`;
}

// Handle alternative paths
async function handleAlternativePaths(user, userResponse) {
  // This would handle different alternative paths based on user response
  return `🛣️ **Alternative Learning Paths:**

I can offer different approaches to help you with this topic...`;
}

module.exports = {
  startAIIntelligenceGathering,
  analyzeEnhancedPainpointClarity,
  generateImprovedPainpointConfirmation,
  processUserResponse,
  // Export other functions...
  generateEnhancedVisualMenu, // Export the function we added
};
