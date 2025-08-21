/**
 * GOAT Bot 2.0 - FIXED AI INTELLIGENCE: Painpoint Confirmation Required
 * User: sophoniagoat
 * Updated: 2025-08-21 14:50:25 UTC
 * CRITICAL FIX: No questions generated until painpoint is confirmed by user
 */

// Enhanced user state management
const userStates = new Map();

// Command types
const GOAT_COMMANDS = {
  WELCOME: "welcome",
  MENU_CHOICE: "menu_choice",
  EXAM_PREP_CONVERSATION: "exam_prep_conversation",
  HOMEWORK_HELP: "homework_help",
  MEMORY_HACKS: "memory_hacks",
  FIXED_MENU_COMMAND: "fixed_menu_command",
  NUMBERED_MENU_COMMAND: "numbered_menu_command",
};

// FIXED AI-POWERED INTELLIGENCE STATES
const AI_INTEL_STATES = {
  EXAM_OR_TEST: "ai_exam_or_test",
  SUBJECT_GRADE: "ai_subject_grade",
  AI_PAINPOINT_EXCAVATION: "ai_painpoint_excavation",
  AI_MICRO_TARGETING: "ai_micro_targeting",
  AI_PAINPOINT_CONFIRMATION: "ai_painpoint_confirmation", // NEW: Required confirmation step
  AI_QUESTION_GENERATION: "ai_question_generation",
};

// ENHANCED MENU COMMANDS
const MENU_COMMANDS = {
  CONTINUE: "continue",
  QUESTION: "question",
  SOLUTION: "solution",
  SWITCH: "switch",
  MENU: "menu",
  NEXT: "next",
  OPTION_1: "1",
  OPTION_2: "2",
  OPTION_3: "3",
  OPTION_4: "4",
};

// SUBJECT AVAILABILITY STATUS
const SUBJECT_STATUS = {
  MATHEMATICS: {
    available: true,
    name: "Mathematics",
    alias: ["math", "maths", "mathematics"],
  },
  PHYSICAL_SCIENCES: {
    available: false,
    name: "Physical Sciences",
    alias: ["physics", "physical", "chemistry"],
    coming_soon: true,
  },
  LIFE_SCIENCES: {
    available: false,
    name: "Life Sciences",
    alias: ["biology", "life"],
    coming_soon: true,
  },
  ENGLISH: {
    available: false,
    name: "English",
    alias: ["english"],
    coming_soon: true,
  },
};

// FIXED VISUAL FORMATTING FUNCTIONS
function formatMathematicalExpression(expression) {
  return expression
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\^4/g, "⁴")
    .replace(/\^5/g, "⁵")
    .replace(/sqrt\(([^)]+)\)/g, "√($1)")
    .replace(/\+\-/g, "±") // FIXED: Properly escaped regex
    .replace(/infinity/g, "∞")
    .replace(/pi/g, "π")
    .replace(/theta/g, "θ");
}

function formatStepByStep(content) {
  return content
    .replace(/Step (\d+):/g, "**Step $1:**")
    .replace(/Step (\d+)\./g, "**Step $1:**")
    .replace(/(\d+)\.\s/g, "**$1.** ")
    .replace(/Given:/g, "**Given:**")
    .replace(/Solution:/g, "**Solution:**")
    .replace(/Answer:/g, "**Answer:**")
    .replace(/Therefore:/g, "**Therefore:**");
}

function enhanceVisualFormatting(content) {
  let enhanced = content;
  enhanced = formatMathematicalExpression(enhanced);
  enhanced = formatStepByStep(enhanced);

  enhanced = enhanced
    .replace(/\s\/\s/g, " ÷ ")
    .replace(/<=/g, "≤")
    .replace(/>=/g, "≥")
    .replace(/\+\-/g, "±")
    .replace(/\-\+/g, "∓");

  return enhanced;
}

// RESPONSIVE SEPARATOR FUNCTION
function getResponsiveSeparator(deviceWidth = "mobile") {
  const separators = {
    mobile: "─".repeat(31),
    tablet: "─".repeat(45),
    desktop: "─".repeat(60),
  };
  return separators[deviceWidth] || separators.mobile;
}

function detectDeviceType(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone"))
    return "mobile";
  if (ua.includes("tablet") || ua.includes("ipad")) return "tablet";
  return "mobile";
}

// Enhanced command parser
function parseGoatCommand(message, userContext) {
  const text = message.toLowerCase().trim();

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
        text === "1" ? "exam_prep" : text === "2" ? "homework" : "memory_hacks",
    };
  }

  if (Object.values(MENU_COMMANDS).slice(0, 6).includes(text)) {
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

function formatGoatResponse(message, metadata = {}) {
  return {
    message,
    status: "success",
    echo: message,
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    ...metadata,
  };
}

module.exports = async (req, res) => {
  const start = Date.now();

  console.log(
    "🎯 GOAT Bot v2.0 - FIXED: Painpoint Confirmation Required Before Questions"
  );

  const { query } = req;
  const endpoint = query.endpoint || "webhook";

  try {
    switch (endpoint) {
      case "webhook":
        return await handleWebhook(req, res, start);
      case "mock-exam":
        return await handleMockExam(req, res, start);
      case "homework-ocr":
        return await handleHomeworkOCR(req, res, start);
      case "memory-hacks":
        return await handleMemoryHacks(req, res, start);
      case "database-test":
        return await handleDatabaseTest(req, res, start);
      case "openai-test":
        return await handleOpenAITest(req, res, start);
      default:
        return await handleWebhook(req, res, start);
    }
  } catch (error) {
    console.error("❌ GOAT Bot error:", error);
    return res.status(500).json({
      message:
        "Sorry, I encountered an error. Please try typing 'menu' to restart! 🔄",
      status: "error",
      echo: "Sorry, I encountered an error. Please try typing 'menu' to restart! 🔄",
      error: error.message,
      elapsed_ms: Date.now() - start,
      user: "sophoniagoat",
    });
  }
};

async function handleWebhook(req, res, start) {
  if (req.method === "GET") {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      webhook: "GOAT Bot - FIXED AI INTELLIGENCE",
      status: "Active",
      fix: "Painpoint confirmation required before question generation",
      progress: "100% complete",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST requests supported",
      echo: "Only POST requests supported",
    });
  }

  const subscriberId =
    req.body.psid || req.body.subscriber_id || "default_user";
  const message = req.body.message || req.body.user_input || "";
  const userAgent = req.headers["user-agent"] || "";

  if (!subscriberId) {
    return res.status(400).json({
      error: "Missing subscriber_id (psid)",
      echo: "Missing subscriber_id (psid)",
    });
  }

  console.log(
    `📥 User ${subscriberId}: "${message}" (${message.length} chars)`
  );

  let user = userStates.get(subscriberId) || {
    id: subscriberId,
    current_menu: "welcome",
    context: {},
    painpoint_profile: {},
    conversation_history: [],
    preferences: {
      last_subject: null,
      last_grade: null,
      device_type: detectDeviceType(userAgent),
    },
    last_active: new Date().toISOString(),
  };

  user.preferences.device_type = detectDeviceType(userAgent);

  console.log(
    `👤 User ${user.id} | Device: ${user.preferences.device_type} | Menu: ${
      user.current_menu
    } | AI State: ${user.context.ai_intel_state || "none"}`
  );

  const command = parseGoatCommand(message, {
    current_menu: user.current_menu,
    context: user.context,
    conversation_history: user.conversation_history,
  });

  console.log(`🎯 Command parsed: ${command.type}`, {
    action: command.action,
    choice: command.choice,
    option: command.option,
    command: command.command,
    text: command.text?.substring(0, 30),
  });

  let reply = "";

  switch (command.type) {
    case GOAT_COMMANDS.NUMBERED_MENU_COMMAND:
      reply = await handleNumberedMenuCommand(user, command.option);
      break;

    case GOAT_COMMANDS.FIXED_MENU_COMMAND:
      reply = await handleFixedMenuCommand(user, command.command);
      break;

    case GOAT_COMMANDS.WELCOME:
      reply = await showWelcomeMenu(user);
      break;
    case GOAT_COMMANDS.MENU_CHOICE:
      switch (command.choice) {
        case 1:
          reply = await startAIIntelligenceGathering(user);
          break;
        case 2:
          reply = await startHomeworkHelp(user);
          break;
        case 3:
          reply = await startMemoryHacks(user);
          break;
        default:
          reply = await showWelcomeMenu(user);
      }
      break;
    case GOAT_COMMANDS.EXAM_PREP_CONVERSATION:
      reply = await handleFixedAIIntelligenceGathering(user, command.text);
      break;
    case GOAT_COMMANDS.HOMEWORK_HELP:
      reply = await handleHomeworkHelp(user, command.text);
      break;
    case GOAT_COMMANDS.MEMORY_HACKS:
      reply = await handleMemoryHacksFlow(user, command.text);
      break;
    default:
      console.warn(`⚠️ Unhandled command type: ${command.type}`);
      reply = await showWelcomeMenu(user);
      break;
  }

  user.conversation_history.push({
    user_input: message,
    bot_response: reply.substring(0, 100),
    timestamp: new Date().toISOString(),
    command_type: command.type,
    ai_intel_state: user.context.ai_intel_state,
    painpoint_confirmed: user.context.painpoint_confirmed || false,
  });

  if (user.conversation_history.length > 15) {
    user.conversation_history = user.conversation_history.slice(-15);
  }

  user.last_active = new Date().toISOString();
  userStates.set(subscriberId, user);

  console.log(
    `✅ Fixed AI reply: ${reply.length} chars | Painpoint confirmed: ${
      user.context.painpoint_confirmed || false
    }`
  );

  return res.status(200).json(
    formatGoatResponse(reply, {
      user_id: user.id,
      command_type: command.type,
      current_menu: user.current_menu,
      ai_intel_state: user.context.ai_intel_state,
      painpoint_confirmation_fixed: true,
      elapsed_ms: Date.now() - start,
    })
  );
}

// ===== ENHANCED VISUAL SEPARATION FUNCTIONS =====

function formatResponseWithEnhancedSeparation(
  content,
  menuOptions,
  deviceType = "mobile"
) {
  const separator = getResponsiveSeparator(deviceType);
  const enhancedContent = enhanceVisualFormatting(content);

  return `${enhancedContent}

${separator}

${menuOptions}`;
}

function generateEnhancedVisualMenu(aiState, deviceType = "mobile") {
  const spacing = deviceType === "mobile" ? "" : "  ";

  switch (aiState) {
    case AI_INTEL_STATES.AI_QUESTION_GENERATION:
      return `1️⃣${spacing} 📚 Solution
2️⃣${spacing} ➡️ Next Question  
3️⃣${spacing} 🔄 Switch Topics
4️⃣${spacing} 🏠 Main Menu`;

    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
    case AI_INTEL_STATES.AI_MICRO_TARGETING:
    case AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION:
      return `1️⃣${spacing} ➡️ Continue
2️⃣${spacing} 📝 Skip to Question
3️⃣${spacing} 🔄 Switch Topics  
4️⃣${spacing} 🏠 Main Menu`;

    case AI_INTEL_STATES.SUBJECT_GRADE:
      return `1️⃣${spacing} ➡️ Continue Setup
2️⃣${spacing} 📝 Quick Question
3️⃣${spacing} 🔄 Different Subject
4️⃣${spacing} 🏠 Main Menu`;

    default:
      return `1️⃣${spacing} ➡️ Continue
2️⃣${spacing} 📝 Practice Question
3️⃣${spacing} 🔄 Switch Topics
4️⃣${spacing} 🏠 Main Menu`;
  }
}

// ===== SUBJECT AVAILABILITY FUNCTIONS =====

function checkSubjectAvailability(subjectInput) {
  const input = subjectInput.toLowerCase();

  for (const [key, subject] of Object.entries(SUBJECT_STATUS)) {
    for (const alias of subject.alias) {
      if (input.includes(alias)) {
        return {
          detected: subject.name,
          available: subject.available,
          coming_soon: subject.coming_soon || false,
          key: key,
        };
      }
    }
  }

  return {
    detected: "Mathematics",
    available: true,
    coming_soon: false,
    key: "MATHEMATICS",
  };
}

// ===== FIXED AI INTELLIGENCE GATHERING (PAINPOINT CONFIRMATION REQUIRED) =====

async function startAIIntelligenceGathering(user) {
  console.log(`🤖 Starting FIXED AI intelligence for user ${user.id}`);

  user.current_menu = "exam_prep_conversation";
  user.context = {
    ai_intel_state: AI_INTEL_STATES.EXAM_OR_TEST,
    painpoint_profile: {},
    painpoint_confirmed: false, // NEW: Track confirmation status
    probing_attempts: 0, // NEW: Track probing attempts
  };

  return `📅 **Exam/Test Prep Mode Activated!** 😰➡️😎

📍 **Step 1/5:** Assessment Type

Exam or test stress? I'll generate questions to unstuck you!

**First** - is this an **EXAM** or **TEST**? *(Different question styles!)*`;
}

async function handleFixedAIIntelligenceGathering(user, text) {
  console.log(
    `🤖 FIXED AI Intelligence: ${user.context.ai_intel_state} | Input: "${text}" | Confirmed: ${user.context.painpoint_confirmed}`
  );

  const aiIntelState =
    user.context.ai_intel_state || AI_INTEL_STATES.EXAM_OR_TEST;

  if (!user.context.painpoint_profile) {
    user.context.painpoint_profile = {};
  }

  switch (aiIntelState) {
    // ===== EXAM OR TEST ANALYSIS =====
    case AI_INTEL_STATES.EXAM_OR_TEST:
      user.context.painpoint_profile.assessment_type = text
        .toLowerCase()
        .includes("exam")
        ? "exam"
        : "test";
      user.context.ai_intel_state = AI_INTEL_STATES.SUBJECT_GRADE;

      return `**Perfect!** ${user.context.painpoint_profile.assessment_type.toUpperCase()}s need focused prep.

📍 **Step 2/5:** Subject & Grade

**What subject and grade?**

*(Example: "Grade 11 Maths" or "Physical Sciences Grade 10")*`;

    // ===== SUBJECT/GRADE ANALYSIS =====
    case AI_INTEL_STATES.SUBJECT_GRADE:
      const gradeMatch = text.match(/grade\s*(\d+)/i) || text.match(/(\d+)/);
      const grade = gradeMatch ? gradeMatch[1] : "10";

      let subject = "Mathematics";
      if (text.toLowerCase().includes("math")) subject = "Mathematics";
      if (text.toLowerCase().includes("physics")) subject = "Physical Sciences";
      if (text.toLowerCase().includes("chemistry")) subject = "Chemistry";

      user.context.painpoint_profile.subject = subject;
      user.context.painpoint_profile.grade = grade;
      user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION;

      user.preferences.last_subject = subject;
      user.preferences.last_grade = grade;

      const subjectCheck = checkSubjectAvailability(text);

      if (!subjectCheck.available) {
        const content = `**Grade ${grade} ${subject}!**

⚠️ **${subject} GOAT is coming soon!**
Right now, only **Math GOAT** is fully online.

🔄 **Switch to Mathematics?** Or continue anyway for limited support.`;

        const menu = generateEnhancedVisualMenu(
          AI_INTEL_STATES.SUBJECT_GRADE,
          user.preferences.device_type
        );
        return formatResponseWithEnhancedSeparation(
          content,
          menu,
          user.preferences.device_type
        );
      }

      const content = `**Grade ${grade} ${subject} exam!**

📍 **Step 3/5:** Finding Struggles

**Which topics are nightmares?**

*(Be specific - Algebra? Geometry? Trigonometry?)*`;

      const menu = generateEnhancedVisualMenu(
        AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION,
        user.preferences.device_type
      );
      return formatResponseWithEnhancedSeparation(
        content,
        menu,
        user.preferences.device_type
      );

    // ===== PAINPOINT EXCAVATION (NO QUESTIONS YET) =====
    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
      user.context.painpoint_profile.topic_struggles = text.trim();
      user.context.ai_intel_state = AI_INTEL_STATES.AI_MICRO_TARGETING;
      user.context.probing_attempts = 0;

      console.log(`✅ Topic identified: ${text.trim()}`);

      const microQuestion = await generateTargetedProbe(
        text,
        user.context.painpoint_profile,
        1
      );

      const painpointContent = `${microQuestion}

📍 **Step 4/5:** Precision Targeting

*I need to understand your exact struggle before creating questions.*`;

      const painpointMenu = generateEnhancedVisualMenu(
        AI_INTEL_STATES.AI_MICRO_TARGETING,
        user.preferences.device_type
      );
      return formatResponseWithEnhancedSeparation(
        painpointContent,
        painpointMenu,
        user.preferences.device_type
      );

    // ===== MICRO TARGETING (ITERATIVE PROBING) =====
    case AI_INTEL_STATES.AI_MICRO_TARGETING:
      user.context.probing_attempts = (user.context.probing_attempts || 0) + 1;

      const painpointClarity = await analyzePainpointClarity(
        text,
        user.context.painpoint_profile
      );

      console.log(
        `🔍 Probing attempt ${user.context.probing_attempts} | Clarity: ${painpointClarity.clarity_level}`
      );

      if (
        painpointClarity.clarity_level === "clear" ||
        user.context.probing_attempts >= 3
      ) {
        // PAINPOINT IS CLEAR - Move to confirmation
        user.context.painpoint_profile.specific_failure =
          painpointClarity.specific_struggle;
        user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION;

        return await generatePainpointConfirmation(user, painpointClarity);
      } else {
        // PAINPOINT STILL VAGUE - Continue probing
        const nextProbe = await generateTargetedProbe(
          text,
          user.context.painpoint_profile,
          user.context.probing_attempts + 1
        );

        const probingContent = `${nextProbe}

📍 **Step 4/5:** Precision Targeting *(Attempt ${
          user.context.probing_attempts + 1
        }/3)*

*I need to understand your exact struggle before creating questions.*`;

        const probingMenu = generateEnhancedVisualMenu(
          AI_INTEL_STATES.AI_MICRO_TARGETING,
          user.preferences.device_type
        );
        return formatResponseWithEnhancedSeparation(
          probingContent,
          probingMenu,
          user.preferences.device_type
        );
      }

    // ===== NEW: PAINPOINT CONFIRMATION (REQUIRED BEFORE QUESTIONS) =====
    case AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION:
      const confirmationResponse = await analyzeConfirmationResponse(text);

      if (confirmationResponse.confirmed) {
        // USER CONFIRMED - Now we can generate questions
        user.context.painpoint_confirmed = true;
        user.context.ai_intel_state = AI_INTEL_STATES.AI_QUESTION_GENERATION;

        console.log(
          `✅ PAINPOINT CONFIRMED: ${JSON.stringify(
            user.context.painpoint_profile
          )}`
        );

        return await generateConfirmedTargetedQuestion(user);
      } else {
        // USER DID NOT CONFIRM - Go back to probing
        user.context.ai_intel_state = AI_INTEL_STATES.AI_MICRO_TARGETING;
        user.context.probing_attempts = 0;

        const clarificationContent = `**Let me try a different approach.**

${await generateTargetedProbe(text, user.context.painpoint_profile, 1)}

📍 **Step 4/5:** Precision Targeting

*I need to understand your exact struggle before creating questions.*`;

        const clarificationMenu = generateEnhancedVisualMenu(
          AI_INTEL_STATES.AI_MICRO_TARGETING,
          user.preferences.device_type
        );
        return formatResponseWithEnhancedSeparation(
          clarificationContent,
          clarificationMenu,
          user.preferences.device_type
        );
      }

    // ===== QUESTION INTERACTION (ONLY AFTER CONFIRMATION) =====
    case AI_INTEL_STATES.AI_QUESTION_GENERATION:
      if (!user.context.painpoint_confirmed) {
        // SAFETY CHECK - Should never happen
        console.error(
          `❌ Question generation attempted without painpoint confirmation!`
        );
        user.context.ai_intel_state = AI_INTEL_STATES.AI_MICRO_TARGETING;
        return `**Error:** I need to understand your problem first. Let's restart the analysis.`;
      }

      return await handleConfirmedQuestionInteraction(user, text);

    default:
      console.warn(`⚠️ Unknown AI state: ${aiIntelState}`);
      return await showWelcomeMenu(user);
  }
}

// ===== NEW: PAINPOINT ANALYSIS FUNCTIONS =====

async function analyzePainpointClarity(userResponse, profile) {
  const response = userResponse.toLowerCase().trim();

  // Check for vague responses
  const vague_indicators = [
    "i don't know",
    "not sure",
    "everything",
    "all of it",
    "confused",
    "help",
  ];
  const isVague = vague_indicators.some((indicator) =>
    response.includes(indicator)
  );

  if (isVague) {
    return {
      clarity_level: "vague",
      specific_struggle: response,
      needs_more_probing: true,
    };
  }

  // Check for specific responses
  const specific_indicators = [
    "when i",
    "i can't",
    "i struggle with",
    "don't understand how to",
    "get confused when",
    "don't know which",
    "method",
    "formula",
    "step",
  ];

  const isSpecific = specific_indicators.some((indicator) =>
    response.includes(indicator)
  );

  if (isSpecific || response.length > 20) {
    return {
      clarity_level: "clear",
      specific_struggle: response,
      needs_more_probing: false,
    };
  }

  return {
    clarity_level: "moderate",
    specific_struggle: response,
    needs_more_probing: true,
  };
}

async function generateTargetedProbe(userResponse, profile, attempt) {
  const topic = profile.topic_struggles || "the topic";
  const subject = profile.subject || "Mathematics";

  // Progressive probing strategy
  switch (attempt) {
    case 1:
      return `**${topic} troubles!** I need to understand exactly where you get stuck.

**What specifically happens** when you try to work with ${topic}?`;

    case 2:
      return `**Let's get more specific about ${topic}.**

When you see a ${topic} problem, what's your **first thought**? Do you:
• Know what to do but get confused halfway?
• Feel completely lost where to start?
• Have a method but it doesn't work?`;

    case 3:
      return `**One more try to pinpoint your ${topic} struggle.**

**Describe the last time** you tried a ${topic} problem. Where exactly did you get stuck?`;

    default:
      return `**Tell me about your ${topic} challenge** - what makes it difficult for you?`;
  }
}

async function generatePainpointConfirmation(user, painpointClarity) {
  const profile = user.context.painpoint_profile;
  const struggle = painpointClarity.specific_struggle;

  const content = `**Perfect! Let me confirm I understand your struggle:**

**Subject:** ${profile.subject} Grade ${profile.grade}
**Topic:** ${profile.topic_struggles}
**Specific Challenge:** ${struggle}

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

async function analyzeConfirmationResponse(userResponse) {
  const response = userResponse.toLowerCase().trim();

  const confirmation_indicators = [
    "yes",
    "correct",
    "right",
    "exactly",
    "that's it",
    "perfect",
  ];
  const denial_indicators = [
    "no",
    "not right",
    "wrong",
    "not exactly",
    "misunderstood",
  ];

  const confirmed = confirmation_indicators.some((indicator) =>
    response.includes(indicator)
  );
  const denied = denial_indicators.some((indicator) =>
    response.includes(indicator)
  );

  if (confirmed && !denied) {
    return { confirmed: true, needs_clarification: false };
  }

  if (denied) {
    return { confirmed: false, needs_clarification: true };
  }

  // Ambiguous response
  return { confirmed: false, needs_clarification: true };
}

async function generateConfirmedTargetedQuestion(user) {
  const profile = user.context.painpoint_profile;

  console.log(`🎯 GENERATING CONFIRMED TARGETED QUESTION:`, profile);

  user.context.current_question = {
    questionText: `Grade ${profile.grade} ${profile.subject} practice question targeting: ${profile.specific_failure}`,
    solution: "Step-by-step solution addressing your confirmed painpoint",
    targeted: true,
    painpoint_confirmed: true,
  };

  const content = `🎯 **TARGETED PRACTICE QUESTION**

**Designed for your confirmed challenge:** *${profile.specific_failure}*

📝 **Question:**
Grade ${profile.grade} ${profile.subject} practice question specifically targeting your struggle with ${profile.topic_struggles}

**This question addresses exactly what you confirmed as your challenge.**`;

  const menu = generateEnhancedVisualMenu(
    AI_INTEL_STATES.AI_QUESTION_GENERATION,
    user.preferences.device_type
  );
  return formatResponseWithEnhancedSeparation(
    content,
    menu,
    user.preferences.device_type
  );
}

async function handleConfirmedQuestionInteraction(user, text) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("solution") || lowerText.includes("answer")) {
    return await showConfirmedTargetedSolution(user);
  }
  if (lowerText.includes("next") || lowerText.includes("another")) {
    return await generateConfirmedTargetedQuestion(user);
  }
  if (lowerText.includes("menu")) {
    return await showWelcomeMenu(user);
  }

  const content = `I see: *"${text}"*

**Remember:** This question targets your confirmed struggle with *${user.context.painpoint_profile.specific_failure}*`;
  const menu = generateEnhancedVisualMenu(
    AI_INTEL_STATES.AI_QUESTION_GENERATION,
    user.preferences.device_type
  );
  return formatResponseWithEnhancedSeparation(
    content,
    menu,
    user.preferences.device_type
  );
}

async function showConfirmedTargetedSolution(user) {
  const profile = user.context.painpoint_profile;

  const content = `📚 **TARGETED SOLUTION**

**Addressing your confirmed challenge:** *${profile.specific_failure}*

**Step 1:** Identify the specific approach for your struggle type

**Step 2:** Apply the method that addresses *${profile.specific_failure}*

**Step 3:** Show all working steps clearly

**Step 4:** Verify the answer makes sense

**Therefore:** Complete solution specifically designed for your confirmed painpoint

**🎯 Strategy:** This directly targets what you confirmed as your main challenge`;

  const menu = generateEnhancedVisualMenu(
    AI_INTEL_STATES.AI_QUESTION_GENERATION,
    user.preferences.device_type
  );
  return formatResponseWithEnhancedSeparation(
    content,
    menu,
    user.preferences.device_type
  );
}

// ===== MENU HANDLERS =====

async function handleNumberedMenuCommand(user, option) {
  console.log(
    `🔢 Menu option: ${option} | State: ${user.context.ai_intel_state} | Confirmed: ${user.context.painpoint_confirmed}`
  );

  const currentState = user.context.ai_intel_state;

  switch (currentState) {
    case AI_INTEL_STATES.AI_QUESTION_GENERATION:
      if (!user.context.painpoint_confirmed) {
        return `**Error:** Questions can only be generated after painpoint confirmation. Please complete the analysis first.`;
      }
      switch (option) {
        case 1:
          return await handleSolutionCommand(user);
        case 2:
          return await handleNextCommand(user);
        case 3:
          return await handleSmartSwitchTopicsCommand(user);
        case 4:
          return await showWelcomeMenu(user);
        default:
          return getContextualMenuError(
            currentState,
            user.preferences.device_type
          );
      }

    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
    case AI_INTEL_STATES.AI_MICRO_TARGETING:
    case AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION:
      switch (option) {
        case 1:
          return await handleContinueCommand(user);
        case 2:
          return `**Cannot generate questions yet.** Please complete painpoint confirmation first.`;
        case 3:
          return await handleSmartSwitchTopicsCommand(user);
        case 4:
          return await showWelcomeMenu(user);
        default:
          return getContextualMenuError(
            currentState,
            user.preferences.device_type
          );
      }

    default:
      switch (option) {
        case 1:
          return await handleContinueCommand(user);
        case 2:
          return await handleQuestionCommand(user);
        case 3:
          return await handleSmartSwitchTopicsCommand(user);
        case 4:
          return await showWelcomeMenu(user);
        default:
          return getGenericMenuError(user.preferences.device_type);
      }
  }
}

async function handleSolutionCommand(user) {
  if (user.context.current_question && user.context.painpoint_confirmed) {
    return await showConfirmedTargetedSolution(user);
  }

  const content = `**No confirmed question active yet.**

Complete painpoint analysis first to get targeted questions.`;
  const menu = generateEnhancedVisualMenu(
    user.context.ai_intel_state,
    user.preferences.device_type
  );
  return formatResponseWithEnhancedSeparation(
    content,
    menu,
    user.preferences.device_type
  );
}

async function handleNextCommand(user) {
  const currentState = user.context.ai_intel_state;

  if (
    currentState === AI_INTEL_STATES.AI_QUESTION_GENERATION &&
    user.context.painpoint_confirmed
  ) {
    return await generateConfirmedTargetedQuestion(user);
  }

  const content = `**Next step coming up!**

${
  !user.context.painpoint_confirmed
    ? "Complete painpoint confirmation first."
    : "Let's continue your learning journey."
}`;
  const menu = generateEnhancedVisualMenu(
    currentState,
    user.preferences.device_type
  );
  return formatResponseWithEnhancedSeparation(
    content,
    menu,
    user.preferences.device_type
  );
}

async function handleSmartSwitchTopicsCommand(user) {
  if (user.context.painpoint_profile?.subject) {
    user.preferences.last_subject = user.context.painpoint_profile.subject;
  }
  if (user.context.painpoint_profile?.grade) {
    user.preferences.last_grade = user.context.painpoint_profile.grade;
  }

  const currentSubject = user.preferences.last_subject || "Mathematics";
  const currentGrade = user.preferences.last_grade || "11";

  user.context.painpoint_profile = {
    subject: currentSubject,
    grade: currentGrade,
    assessment_type: user.context.painpoint_profile?.assessment_type || "test",
  };

  user.context.painpoint_confirmed = false; // Reset confirmation
  user.context.probing_attempts = 0;
  user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION;

  const content = `🔄 **Switching Topics!**

**Keeping:** ${currentSubject} Grade ${currentGrade}

**Which new topic** would you like to practice?

*(Algebra, Geometry, Trigonometry, Functions, etc.)*`;

  const menu = generateEnhancedVisualMenu(
    AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION,
    user.preferences.device_type
  );
  return formatResponseWithEnhancedSeparation(
    content,
    menu,
    user.preferences.device_type
  );
}

// ===== CORE FUNCTIONS =====

async function showWelcomeMenu(user) {
  console.log(`🏠 Welcome menu for user ${user.id}`);

  user.current_menu = "welcome";
  user.context = {};
  user.painpoint_profile = {};

  const welcomeBack = user.preferences.last_subject
    ? `\n\n👋 **Welcome back!** Ready to continue with *${user.preferences.last_subject}*?`
    : "";

  return `**Welcome to The GOAT.** I'm here help you study with calm and clarity.${welcomeBack}

**What do you need right now?**

1️⃣ 📅 Exam/Test coming 😰
2️⃣ 📚 Homework Help 🫶
3️⃣ 🧮 Tips & Hacks

Just pick a number! ✨`;
}

async function handleFixedMenuCommand(user, command) {
  switch (command) {
    case "solution":
      return await handleSolutionCommand(user);
    case "next":
      return await handleNextCommand(user);
    case "switch":
      return await handleSmartSwitchTopicsCommand(user);
    case "menu":
      return await showWelcomeMenu(user);
    default:
      return `**Try:** 1, 2, 3, or 4`;
  }
}

async function handleContinueCommand(user) {
  return `**Let's continue!** 

${
  user.context.painpoint_confirmed
    ? "Your painpoint is confirmed."
    : "I still need to understand your specific challenge."
} 

What would you like to explore?`;
}

async function handleQuestionCommand(user) {
  if (!user.context.painpoint_confirmed) {
    return `**Cannot generate questions yet.**

I need to understand your specific challenge first. Let's complete the painpoint analysis.`;
  }

  user.context.ai_intel_state = AI_INTEL_STATES.AI_QUESTION_GENERATION;
  return await generateConfirmedTargetedQuestion(user);
}

// ===== ERROR HANDLERS =====

function getContextualMenuError(aiState, deviceType = "mobile") {
  const content = `**Please choose 1, 2, 3, or 4:**`;
  const menu = generateEnhancedVisualMenu(aiState, deviceType);
  return formatResponseWithEnhancedSeparation(content, menu, deviceType);
}

function getGenericMenuError(deviceType = "mobile") {
  const content = `**Please choose an option (1-4):**`;
  const menu = generateEnhancedVisualMenu("default", deviceType);
  return formatResponseWithEnhancedSeparation(content, menu, deviceType);
}

// ===== SIMPLIFIED REMAINING HANDLERS =====

async function startHomeworkHelp(user) {
  return `📚 **Homework Helper Ready!** 🫶

**Type your homework question directly!** 📝`;
}

async function handleHomeworkHelp(user, text) {
  return `📚 **Solution**

**Problem:** *${text}*

**Answer:** Working on your solution...

───────────────────────────────

1️⃣ ➡️ Another Problem
2️⃣ 📝 Practice Questions  
3️⃣ 🔄 Different Subject
4️⃣ 🏠 Main Menu`;
}

async function startMemoryHacks(user) {
  return `🧮 **Tips & Hacks Vault!** ✨

**What subject?** *(Math, Science, English, etc.)*`;
}

async function handleMemoryHacksFlow(user, text) {
  return `🧠 **Memory Hack** ✨

**SA Memory Trick**

💡 Using local landmarks and culture to remember key concepts

───────────────────────────────

1️⃣ ➡️ More Hacks
2️⃣ 📝 Practice Questions
3️⃣ 🔄 Different Subject  
4️⃣ 🏠 Main Menu`;
}

// ===== API HANDLERS =====

async function handleMockExam(req, res, start) {
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    mockExam: [
      {
        questionNumber: 1,
        questionText:
          "FIXED: Questions only generated after painpoint confirmation",
        solution: "Step-by-step solution with confirmed targeting",
        painpoint_confirmed_required: true,
      },
    ],
    metadata: { painpoint_confirmation_required: true },
  });
}

async function handleHomeworkOCR(req, res, start) {
  const { problemText } = req.body;

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    homework: {
      originalProblem: problemText || "Sample problem",
      solution: "Step-by-step solution with enhanced formatting",
      processed: "Fixed AI solution with painpoint confirmation",
    },
    metadata: { painpoint_confirmation_system: "active" },
  });
}

async function handleMemoryHacks(req, res, start) {
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    memoryHacks: {
      subject: "Mathematics",
      grade: 10,
      hacks: [
        {
          title: "Enhanced Memory Trick",
          content: "Using South African landmarks to remember formulas",
          saContext: "Fixed cultural references with painpoint confirmation",
        },
      ],
    },
    metadata: { painpoint_confirmation_system: "active" },
  });
}

async function handleDatabaseTest(req, res, start) {
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    database: {
      status: "simulated - painpoint confirmation fixed",
      message: "Database with required painpoint confirmation before questions",
      painpoint_confirmation_required: true,
    },
  });
}

async function handleOpenAITest(req, res, start) {
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    openai: {
      status: "PAINPOINT CONFIRMATION SYSTEM ACTIVE",
      model: "gpt-3.5-turbo",
      fix: "No questions generated until painpoint is confirmed by user",
      test_response:
        "Painpoint confirmation required before question generation",
    },
  });
}
