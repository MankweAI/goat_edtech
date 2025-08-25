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
const { enhanceTopicSuggestions } = require("./personalization");

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

  // Check if user has previous subject/grade preferences
  const resumePrompt = generateResumePrompt(user);
  if (resumePrompt) {
    return resumePrompt;
  }

  user.current_menu = "exam_prep_conversation";
  user.context = {
    ai_intel_state: AI_INTEL_STATES.EXAM_OR_TEST,
    painpoint_profile: {},
    painpoint_confirmed: false,
    probing_attempts: 0,
  };

  // NEW: Show alternative paths if we have persistent user history
  if (user.preferences?.painpoint_history?.length > 0) {
    // User has previous painpoints, offer to use one
    user.context.ai_intel_state = AI_INTEL_STATES.ALTERNATIVE_PATHS;
    return generateAlternativePathsPrompt(user);
  }

  return `📅 **Exam/Test Prep Mode Activated!** 😰➡️😎

📍 **Step 1/5:** Assessment Type

Exam or test stress? I'll generate questions to unstuck you!

**First** - is this an **EXAM** or **TEST**? *(Different question styles!)*`;
}

function generateAlternativePathsPrompt(user) {
  // Get the most recent painpoint
  const recentPainpoint = user.preferences.painpoint_history[0];

  const content = `📅 **Exam/Test Prep Mode Activated!** 😰➡️😎

I see you've previously worked on:
**${recentPainpoint.subject} (Grade ${recentPainpoint.grade})**
Topic: *${recentPainpoint.topic}*
Challenge: *${recentPainpoint.specific_failure}*

**How would you like to proceed?**`;

  const menu = `A️⃣ Continue with this topic & challenge
B️⃣ Same subject but new topic
C️⃣ Start with a completely different subject

Or just tell me if it's for an EXAM or TEST preparation.`;

  user.context.ai_intel_state = AI_INTEL_STATES.ALTERNATIVE_PATHS;

  return formatResponseWithEnhancedSeparation(
    content,
    menu,
    user.preferences.device_type
  );
}


// NEW: Generate resume prompt if user has previous preferences
function generateResumePrompt(user) {
  // Check for previous subject and grade
  const prevSubject =
    user.painpoint_profile?.subject || user.preferences?.last_subject;
  const prevGrade =
    user.painpoint_profile?.grade || user.preferences?.last_grade;

  if (prevSubject && prevGrade) {
    return `📅 **Welcome back to Exam/Test Prep!**

I see you've previously worked on **${prevSubject} Grade ${prevGrade}**.

Would you like to:
1️⃣ Continue with ${prevSubject} Grade ${prevGrade}
2️⃣ Start fresh with a different subject/grade

*Reply with 1 or 2*`;
  }

  return null;
}


// Process user responses based on current state
async function processUserResponse(user, userResponse) {
  const currentState =
    user.context?.ai_intel_state || AI_INTEL_STATES.EXAM_OR_TEST;

  // Log incoming response and current state
  console.log(
    `🧠 Processing exam prep response: "${userResponse}" | Current state: ${currentState}`
  );

  // NEW: Handle resume prompt response
  if (user.context?.resuming_session) {
    if (
      userResponse === "1" ||
      userResponse.toLowerCase().includes("continue")
    ) {
      // Continue with previous subject/grade
      user.context.resuming_session = false;

      const subject =
        user.painpoint_profile?.subject || user.preferences?.last_subject;
      const grade =
        user.painpoint_profile?.grade || user.preferences?.last_grade;

      user.context.painpoint_profile = {
        subject,
        grade,
        assessment_type:
          user.context.painpoint_profile?.assessment_type || "test",
      };

      // Skip to topic selection
      user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION;
      return generateSubjectSpecificTopicPrompt(user);
    } else {
      // Start fresh
      user.context.resuming_session = false;
      user.context.ai_intel_state = AI_INTEL_STATES.EXAM_OR_TEST;
      return `📅 **Let's start fresh!**

📍 **Step 1/5:** Assessment Type

Is this an **EXAM** or **TEST**? *(Different question styles!)*`;
    }
  }

  // Original switch statement for processing responses
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

        // CRITICAL FIX: Ensure the current_menu is set properly
        user.current_menu = "exam_prep_conversation";

        // Transition to the next state
        user.context.ai_intel_state = AI_INTEL_STATES.SUBJECT_GRADE;

        // Generate the next prompt (subject and grade)
        return generateSubjectGradePrompt(user); // This return is working correctly
      }

      // CRITICAL FIX: This should ONLY execute if exam/test was NOT found
      // The bug was that this always executed regardless
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

    case AI_INTEL_STATES.AI_DIAGNOSTIC_QUESTION:
      return await handleDiagnosticAnalysis(user, userResponse);

    case AI_INTEL_STATES.AI_DIAGNOSTIC_ANALYSIS:
      return await handleDiagnosticAnalysis(user, userResponse);
    default:
      // Default fallback to reset the flow
      user.context.ai_intel_state = AI_INTEL_STATES.EXAM_OR_TEST;
      return startAIIntelligenceGathering(user);
  }
}

// Fix the generateSubjectGradePrompt function to include menu
function generateSubjectGradePrompt(user) {
  const content = `📚 **Great!** Let's get you ready for your ${user.context.painpoint_profile.assessment_type}.

📍 **Step 2/5:** Subject & Grade

What **subject** and **grade** are you working on?
*(e.g., "Grade 11 Mathematics" or "Grade 9 Physical Sciences")*`;

  const menu = generateEnhancedVisualMenu(
    AI_INTEL_STATES.SUBJECT_GRADE,
    user.preferences.device_type
  );

  return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
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

  // Extract subject with enhanced subject detection
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

  // NEW: Store subject/grade in user preferences for persistence
  user.preferences = user.preferences || {};
  user.preferences.last_subject = subject;
  user.preferences.last_grade = grade;

  // Transition to next state
  user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION;

  // Generate subject-specific topic struggles prompt
  return generateSubjectSpecificTopicPrompt(user);
}


// NEW FUNCTION: Generate subject-specific topic prompt
function generateSubjectSpecificTopicPrompt(user) {
  const profile = user.context.painpoint_profile;
  const subject = profile.subject;

  // Fix: Use synchronous version of topic suggestions
  const topicSuggestions = getTopicSuggestionsSync(subject);

  return `📚 **${subject} Grade ${profile.grade}** - Got it!

📍 **Step 3/5:** Topic Focus

Which **topics** in ${subject} are giving you trouble?

*Common ${subject} topics include:*
${topicSuggestions}

*Just tell me which topic is challenging you.*`;
}

function getTopicSuggestionsSync(subject) {
  const suggestionsMap = {
    Mathematics:
      "Algebra, Geometry, Trigonometry, Functions, Calculus, Probability",
    "Mathematical Literacy":
      "Finance, Measurement, Maps & Plans, Data Handling, Probability",
    "Physical Sciences":
      "Mechanics, Electricity, Chemistry, Waves, Matter & Materials",
    "Life Sciences":
      "Cells, Genetics, Plant Biology, Human Physiology, Ecology",
    Geography:
      "Mapwork, Climate, Geomorphology, Settlement, Economic Geography",
    History:
      "South African History, Cold War, Civil Rights, Capitalism vs Communism",
    Economics:
      "Microeconomics, Macroeconomics, Economic Development, Contemporary Issues",
    "Business Studies":
      "Business Environments, Business Ventures, Business Operations, Ethics",
    Accounting:
      "Financial Statements, VAT, Budgeting, Inventory Valuation, Ethics",
  };

  return (
    suggestionsMap[subject] || "various topics specific to your curriculum"
  );
}




// NEW FUNCTION: Get subject-specific topic suggestions
async function getTopicSuggestions(subject) {
  const baseTopics = getTopicSuggestionsSync(subject);

  try {
    const baseTopicArray = baseTopics.split(", ");
    // This still runs asynchronously but doesn't block the UI
    const enhancedTopics = await enhanceTopicSuggestions(
      subject,
      baseTopicArray
    );
    // We can use this data for future interactions
    return enhancedTopics.join(", ");
  } catch (error) {
    console.error(`❌ Error enhancing topics for ${subject}:`, error);
    return baseTopics;
  }
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

async function handleDiagnosticAnalysis(user, userResponse) {
  // Skip analysis if user explicitly can't solve
  if (
    userResponse === "1" ||
    userResponse.toLowerCase().includes("can't solve")
  ) {
    const diagnostic = user.context.diagnostic_question;

    // Set painpoint based on diagnostic purpose
    user.context.painpoint_profile.specific_failure = `difficulty with ${user.context.painpoint_profile.topic_struggles}: ${diagnostic.purpose}`;

    // Transition to confirmation
    user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION;
    return await generateImprovedPainpointConfirmation(user, {
      specific_struggle: user.context.painpoint_profile.specific_failure,
      clarity_level: "clear",
    });
  }

  // Skip if requested
  if (userResponse === "2" || userResponse.toLowerCase().includes("skip")) {
    user.context.ai_intel_state = AI_INTEL_STATES.AI_MICRO_TARGETING;
    return `📍 **Let's try a different approach.**

What **specifically** about ${user.context.painpoint_profile.topic_struggles} is difficult for you?

*(e.g., "I don't understand how to start" or "I mix up the formulas")*`;
  }

  // Switch topics
  if (userResponse === "3" || userResponse.toLowerCase().includes("switch")) {
    user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION;
    return generateSubjectSpecificTopicPrompt(user);
  }

  // Main menu
  if (userResponse === "4" || userResponse.toLowerCase().includes("menu")) {
    user.current_menu = "welcome";
    user.context = {};
    return `**Welcome to The GOAT.** I'm here help you study with calm and clarity.

**What do you need right now?**

1️⃣ 📅 Exam/Test Help
2️⃣ 📚 Homework Help 🫶 ⚡  
3️⃣ 🧮 Tips & Hacks

Just pick a number! ✨`;
  }

  // Analyze the response
  try {
    const diagnosticQuestion = user.context.diagnostic_question;
    const analysis = await analyzeDiagnosticAnswer(
      userResponse,
      diagnosticQuestion
    );

    // Update user context with analysis
    user.context.diagnostic_analysis = analysis;

    // Set painpoint based on analysis
    if (analysis.specific_issues.length > 0) {
      const mainIssue = analysis.specific_issues[0];
      let issueDescription = "";

      switch (mainIssue) {
        case "no_calculation_shown":
          issueDescription = "not showing working steps";
          break;
        case "uncertainty_expressed":
          issueDescription = "uncertainty about core concepts";
          break;
        case "too_brief":
          issueDescription = "difficulty expressing mathematical reasoning";
          break;
        default:
          issueDescription = `difficulty with ${user.context.painpoint_profile.topic_struggles}`;
      }

      user.context.painpoint_profile.specific_failure = issueDescription;
    } else {
      user.context.painpoint_profile.specific_failure = `difficulty with ${user.context.painpoint_profile.topic_struggles}`;
    }

    // Generate feedback
    const content = `📊 **Based on your answer, I think I understand your challenge.**

${analysis.feedback}

I see that you're specifically struggling with: 
*${user.context.painpoint_profile.specific_failure}*

Is this correct? This helps me create targeted practice questions.`;

    // Transition to confirmation
    user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION;

    const menu = generateEnhancedVisualMenu(
      AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION,
      user.preferences.device_type
    );

    return formatResponseWithEnhancedSeparation(
      content,
      menu,
      user.preferences.device_type
    );
  } catch (error) {
    console.error("Diagnostic analysis error:", error);

    // Fallback to micro targeting
    user.context.ai_intel_state = AI_INTEL_STATES.AI_MICRO_TARGETING;
    return `📍 Let me ask differently:

What **specifically** about ${user.context.painpoint_profile.topic_struggles} is difficult for you?

*(e.g., "I don't understand how to start" or "I mix up the formulas")*`;
  }
}

async function generateDiagnosticQuestion(user) {
  const { subject, grade, topic_struggles } = user.context.painpoint_profile;
  console.log(
    `🔍 Generating diagnostic question for ${subject} - ${topic_struggles}`
  );

  try {
    // Get a diagnostic question
    const diagnosticQuestion = await getDiagnosticQuestion(
      subject,
      topic_struggles
    );

    // Store in user context
    user.context.diagnostic_question = diagnosticQuestion;
    user.context.ai_intel_state = AI_INTEL_STATES.AI_DIAGNOSTIC_ANALYSIS;

    const content = `📝 **Let me understand your specific challenge better.**

Here's a ${subject} question about ${topic_struggles}:

${diagnosticQuestion.questionText}

**Please attempt this question so I can identify exactly where you're getting stuck.**`;

    const menu = `1️⃣ ➡️ I can't solve this
2️⃣ 📝 Skip diagnostic
3️⃣ 🔄 Switch topics
4️⃣ 🏠 Main Menu`;

    return formatResponseWithEnhancedSeparation(
      content,
      menu,
      user.preferences.device_type
    );
  } catch (error) {
    console.error("Diagnostic question error:", error);

    // Fallback
    user.context.ai_intel_state = AI_INTEL_STATES.AI_MICRO_TARGETING;
    return handleMicroTargeting(
      user,
      "I'm not sure exactly what I'm struggling with"
    );
  }
}

// Handle micro targeting
async function handleMicroTargeting(user, userResponse) {
  const profile = user.context.painpoint_profile;

  // NEW: Handle "not sure" responses
  if (
    userResponse.toLowerCase().includes("not sure") ||
    userResponse.toLowerCase().includes("don't know") ||
    userResponse.toLowerCase().includes("uncertain")
  ) {
    // Transition to diagnostic question
    console.log(`🔍 User uncertain about painpoint, starting diagnostic`);
    user.context.ai_intel_state = AI_INTEL_STATES.AI_DIAGNOSTIC_QUESTION;
    return generateDiagnosticQuestion(user);
  }

  // Existing code for clarity analysis
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

  // After 2 probing attempts, suggest diagnostic
  if (user.context.probing_attempts >= 2) {
    // Add a "Not Sure" option in the response
    const probe = await generateDynamicTargetedProbe(
      userResponse,
      profile,
      user.context.probing_attempts
    );

    return `${probe}\n\n**Not sure? Type "not sure" and I'll ask a diagnostic question to help.**`;
  }

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
  const subject = profile.subject;

  console.log(`🔍 Enhanced analysis for: "${userResponse}" in ${subject}`);

  // SUBJECT-SPECIFIC CLEAR INDICATORS
  const subjectIndicators = {
    Mathematics: {
      trigonometry: [
        "don't understand ratios",
        "can't understand ratios",
        "ratios confuse me",
        "sin cos tan",
        "don't understand angles",
      ],
      algebra: [
        "solve for x",
        "cannot solve",
        "can't solve",
        "equations confuse me",
        "factoring",
      ],
      geometry: [
        "can't visualize",
        "don't understand shapes",
        "proofs confuse me",
        "theorems",
      ],
    },
    "Mathematical Literacy": {
      finance: [
        "interest calculations",
        "loan repayments",
        "tax returns",
        "budgeting",
      ],
      measurement: ["conversions", "scale", "perimeter", "area calculation"],
    },
    Geography: {
      mapwork: [
        "can't read maps",
        "contour lines",
        "gradient calculation",
        "grid references",
      ],
      climate: ["weather patterns", "climate graphs", "rainfall distribution"],
    },
  };

  // Get indicators for the specific subject
  const subjectSpecificIndicators = subjectIndicators[subject] || {};

  // Check for subject-specific clarity
  const topic = profile.topic_struggles?.toLowerCase() || "";

  // Topic-specific checks based on subject
  for (const [topicKey, indicators] of Object.entries(
    subjectSpecificIndicators
  )) {
    if (topic.includes(topicKey)) {
      const hasTopicClarity = indicators.some((indicator) =>
        response.includes(indicator)
      );

      if (hasTopicClarity) {
        return {
          clarity_level: "clear",
          specific_struggle: userResponse,
          needs_more_probing: false,
          recognition_reason: `${subject}_${topicKey}_specific_indicator`,
        };
      }
    }
  }

  // General checks remain the same
  const clear_struggle_phrases = [
    "i don't understand",
    "i can't understand",
    "confused by",
    "struggle with",
    "difficult for me",
    "can't grasp",
    "having trouble with",
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
    "everything",
    "all of it",
    "the whole subject",
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

    // NEW: Save confirmed painpoint to history
    const profile = user.context.painpoint_profile;
    user.preferences.painpoint_history =
      user.preferences.painpoint_history || [];
    user.preferences.painpoint_history.unshift({
      subject: profile.subject,
      grade: profile.grade,
      topic: profile.topic_struggles,
      specific_failure: profile.specific_failure,
      timestamp: new Date().toISOString(),
    });

    // Limit history size
    if (user.preferences.painpoint_history.length > 10) {
      user.preferences.painpoint_history =
        user.preferences.painpoint_history.slice(0, 10);
    }

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

// Implement immediate fallback questions for question generation
async function handleQuestionGeneration(user, userResponse) {
  // Update personalization preferences based on user interactions
  user.preferences.personalization = user.preferences.personalization || {
    difficulty: "adaptive",
    explanations: "detailed",
    examples: true,
    visualStyle: "clear",
  };

  // Add message about personalization
  const personalizationMsg = user.preferences.painpoint_history
    ? `\n\n📊 **Personalized for you** based on your learning patterns`
    : `\n\n📊 **Customized for your needs**`;

  // First send loading message
  const loadingMessage = `🎯 **Perfect! Generating your targeted question...**

I'm creating a practice question specifically for:
"${user.context.painpoint_profile.specific_failure}"
${personalizationMsg}

⏳ One moment please...

─────────────────────────────────

1️⃣ ➡️ Continue
2️⃣ 📝 Skip to Next Question
3️⃣ 🔄 Switch Topics  
4️⃣ 🏠 Main Menu`;

  // CRITICAL FIX: Set state to ensure immediate fallback if user requests again
  user.context.ai_intel_state = AI_INTEL_STATES.IMMEDIATE_FALLBACK;
  user.context.generation_started = Date.now();
  user.context.failureType = user.context.painpoint_profile.specific_failure;
  user.context.subjectArea = user.context.painpoint_profile.subject;
  
  return loadingMessage;
}

// NEW HANDLER: Add this case to the processUserResponse function
// Inside the switch statement in processUserResponse function
async function processUserResponse(user, userResponse) {
  const currentState =
    user.context?.ai_intel_state || AI_INTEL_STATES.EXAM_OR_TEST;

  // Log incoming response and current state
  console.log(
    `🧠 Processing exam prep response: "${userResponse}" | Current state: ${currentState}`
  );

  // NEW: Handle resume prompt response
  if (user.context?.resuming_session) {
    // Existing code...
  }

  // Original switch statement for processing responses
  switch (currentState) {
    // Existing cases...
    
    // NEW CASE: Add immediate fallback handling
    case AI_INTEL_STATES.IMMEDIATE_FALLBACK: {
      // Generate fallback question immediately
      const fallbackQuestion = generateFallbackQuestion(user.context.failureType, user.context.subjectArea);
      
      // Update state to guided discovery
      user.context.ai_intel_state = AI_INTEL_STATES.GUIDED_DISCOVERY;
      
      return `**Practice Question for ${user.context.painpoint_profile.topic_struggles}**
📊 **Personalized for your challenge**

${fallbackQuestion.questionText}

─────────────────────────────────

1️⃣ 📚 View Solution
2️⃣ ➡️ Try Another Question  
3️⃣ 🔄 Switch Topics
4️⃣ 🏠 Main Menu`;
    }
    
    default:
      // Default fallback to reset the flow
      user.context.ai_intel_state = AI_INTEL_STATES.EXAM_OR_TEST;
      return startAIIntelligenceGathering(user);
  }
}
// Handle guided discovery
async function handleGuidedDiscovery(user, userResponse) {
  // This would implement guided discovery educational approach
  return `🔍 **Guided Discovery:**

Let's explore this concept together step by step...`;
}

// Handle alternative paths
async function handleAlternativePaths(user, userResponse) {
  const response = userResponse.toUpperCase();

  // Get the most recent painpoint
  const recentPainpoint = user.preferences.painpoint_history[0];

  if (
    response === "A" ||
    response.includes("CONTINUE") ||
    response.includes("SAME")
  ) {
    // Continue with the same topic and challenge
    user.context.painpoint_profile = {
      subject: recentPainpoint.subject,
      grade: recentPainpoint.grade,
      topic_struggles: recentPainpoint.topic,
      specific_failure: recentPainpoint.specific_failure,
      assessment_type: user.context.painpoint_profile.assessment_type || "test",
    };

    // Skip straight to question generation
    user.context.ai_intel_state = AI_INTEL_STATES.AI_QUESTION_GENERATION;
    user.context.painpoint_confirmed = true;

    return `🎯 **Perfect! Continuing with your previous challenge:**

Subject: ${recentPainpoint.subject} (Grade ${recentPainpoint.grade})
Topic: ${recentPainpoint.topic}
Challenge: ${recentPainpoint.specific_failure}

Generating a targeted practice question...`;
  } else if (response === "B" || response.includes("NEW TOPIC")) {
    // Same subject but new topic
    user.context.painpoint_profile = {
      subject: recentPainpoint.subject,
      grade: recentPainpoint.grade,
      assessment_type: user.context.painpoint_profile.assessment_type || "test",
    };

    // Go to topic selection
    user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION;
    return generateSubjectSpecificTopicPrompt(user);
  } else if (response === "C" || response.includes("DIFFERENT")) {
    // Start with a completely different subject
    user.context.painpoint_profile = {
      assessment_type: user.context.painpoint_profile.assessment_type || "test",
    };

    // Go to subject/grade selection
    user.context.ai_intel_state = AI_INTEL_STATES.SUBJECT_GRADE;
    return generateSubjectGradePrompt(user);
  } else if (response.includes("EXAM") || response.includes("TEST")) {
    // User is specifying exam or test
    user.context.painpoint_profile = {
      assessment_type: response.includes("EXAM") ? "exam" : "test",
    };

    // Go to subject/grade selection
    user.context.ai_intel_state = AI_INTEL_STATES.SUBJECT_GRADE;
    return generateSubjectGradePrompt(user);
  }

  // If none of the above, default to asking for exam/test
  user.context.ai_intel_state = AI_INTEL_STATES.EXAM_OR_TEST;
  return `📅 I need to know if this is for **EXAM** or **TEST** preparation.

Please type "exam" or "test" to continue, or select one of the options:

A️⃣ Continue with previous topic & challenge
B️⃣ Same subject but new topic
C️⃣ Start with a completely different subject`;
}

module.exports = {
  startAIIntelligenceGathering,
  analyzeEnhancedPainpointClarity,
  generateImprovedPainpointConfirmation,
  processUserResponse,
  generateEnhancedVisualMenu,
  // Add new exports
  generateDiagnosticQuestion,
  handleDiagnosticAnalysis,
  getTopicSuggestions,
  generateSubjectSpecificTopicPrompt,
  getTopicSuggestions,
};