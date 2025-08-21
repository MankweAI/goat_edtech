/**
 * GOAT Bot 2.0 - INTEGRATED DYNAMIC PROBING SYSTEM
 * User: sophoniagoat
 * Updated: 2025-08-21 15:39:26 UTC
 * INTEGRATION: Dynamic probing system now properly connected to entry point
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

// AI-POWERED INTELLIGENCE STATES
const AI_INTEL_STATES = {
  EXAM_OR_TEST: "ai_exam_or_test",
  SUBJECT_GRADE: "ai_subject_grade",
  AI_PAINPOINT_EXCAVATION: "ai_painpoint_excavation",
  AI_MICRO_TARGETING: "ai_micro_targeting",
  AI_PAINPOINT_CONFIRMATION: "ai_painpoint_confirmation",
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

// ===== INTEGRATED DYNAMIC PROBING SYSTEM =====

// DYNAMIC KNOWLEDGE BASE (INTEGRATED INTO MAIN FILE)
const SUBJECT_PROBING_DATABASE = {
  Mathematics: {
    algebra: {
      examples: [
        "Solving equations (like 2x + 5 = 15)",
        "Factoring expressions (like x² + 5x + 6)",
        "Simplifying expressions (like 3x + 2x)",
        "Substitution (plugging numbers into formulas)",
      ],
      common_struggles: [
        "I don't know which method to use",
        "I get confused with the steps",
        "I make calculation mistakes",
        "I don't understand what X means",
      ],
    },
    geometry: {
      examples: [
        "Finding angles in triangles",
        "Area and perimeter calculations",
        "Coordinate geometry (graphs and points)",
        "Proofs and reasoning",
      ],
      common_struggles: [
        "I can't visualize the shapes",
        "I forget which formula to use",
        "I struggle with proofs",
        "I get confused with coordinates",
      ],
    },
    trigonometry: {
      examples: [
        "Ratios (sin, cos, tan)",
        "Solving trig equations",
        "Graphs of trig functions",
        "Identities and formulas",
      ],
      common_struggles: [
        "I don't understand the ratios",
        "I can't remember which ratio to use",
        "I struggle with unit circle",
        "I get confused with identities",
      ],
    },
    functions: {
      examples: [
        "Linear functions (y = mx + c)",
        "Quadratic functions (y = ax² + bx + c)",
        "Exponential functions",
        "Domain and range",
      ],
      common_struggles: [
        "I don't understand function notation",
        "I can't find domain and range",
        "I struggle with graphing",
        "I get confused with transformations",
      ],
    },
    statistics: {
      examples: [
        "Mean, median, mode calculations",
        "Probability problems",
        "Data interpretation",
        "Standard deviation",
      ],
      common_struggles: [
        "I mix up mean and median",
        "I don't understand probability",
        "I can't read graphs properly",
        "I struggle with data analysis",
      ],
    },
    calculus: {
      examples: [
        "Derivatives and differentiation",
        "Integration and antiderivatives",
        "Limits and continuity",
        "Applications of calculus",
      ],
      common_struggles: [
        "I don't understand derivatives",
        "I can't solve integration",
        "I struggle with limits",
        "I can't apply calculus to problems",
      ],
    },
  },

  "Physical Sciences": {
    physics: {
      examples: [
        "Motion and forces (F = ma)",
        "Electricity (V = IR)",
        "Waves and sound",
        "Energy calculations",
      ],
      common_struggles: [
        "I don't know which formula to use",
        "I get confused with units",
        "I can't solve word problems",
        "I struggle with vector directions",
      ],
    },
    chemistry: {
      examples: [
        "Balancing chemical equations",
        "Mole calculations",
        "Acids and bases",
        "Periodic table patterns",
      ],
      common_struggles: [
        "I can't balance equations",
        "I don't understand moles",
        "I get confused with pH",
        "I struggle with electron configurations",
      ],
    },
    mechanics: {
      examples: [
        "Newton's laws of motion",
        "Projectile motion",
        "Momentum and impulse",
        "Work and energy",
      ],
      common_struggles: [
        "I can't apply Newton's laws",
        "I struggle with projectile problems",
        "I don't understand momentum",
        "I get confused with energy types",
      ],
    },
  },

  "Life Sciences": {
    biology: {
      examples: [
        "Cell structure and function",
        "Genetics and heredity",
        "Ecosystems and environment",
        "Human body systems",
      ],
      common_struggles: [
        "I can't memorize all the parts",
        "I don't understand inheritance",
        "I get confused with cycles",
        "I struggle with diagrams",
      ],
    },
    ecology: {
      examples: [
        "Food chains and webs",
        "Population dynamics",
        "Biodiversity and conservation",
        "Environmental interactions",
      ],
      common_struggles: [
        "I can't remember the levels",
        "I don't understand relationships",
        "I struggle with cycles",
        "I get confused with interactions",
      ],
    },
    genetics: {
      examples: [
        "DNA structure and replication",
        "Mendelian inheritance",
        "Genetic crosses and Punnett squares",
        "Mutations and variations",
      ],
      common_struggles: [
        "I don't understand DNA structure",
        "I can't do genetic crosses",
        "I struggle with Punnett squares",
        "I get confused with inheritance patterns",
      ],
    },
  },

  English: {
    literature: {
      examples: [
        "Poetry analysis and interpretation",
        "Essay writing and structure",
        "Character analysis",
        "Themes and symbolism",
      ],
      common_struggles: [
        "I don't know what to analyze",
        "I can't write good essays",
        "I don't understand symbolism",
        "I struggle with quotes",
      ],
    },
    language: {
      examples: [
        "Grammar rules and usage",
        "Sentence structure",
        "Punctuation and mechanics",
        "Vocabulary building",
      ],
      common_struggles: [
        "I mix up grammar rules",
        "I don't know where to put commas",
        "I can't build proper sentences",
        "I have limited vocabulary",
      ],
    },
    writing: {
      examples: [
        "Creative writing techniques",
        "Persuasive and argumentative essays",
        "Research and citations",
        "Editing and proofreading",
      ],
      common_struggles: [
        "I can't think of ideas",
        "I don't know how to argue",
        "I struggle with research",
        "I can't edit my own work",
      ],
    },
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
    .replace(/\+\-/g, "±")
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
    "🔗 GOAT Bot v2.0 - INTEGRATED: Dynamic Probing System Connected"
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
      webhook: "GOAT Bot - INTEGRATED DYNAMIC PROBING",
      status: "Active",
      integration: "Dynamic probing system properly connected to entry point",
      coverage: "Mathematics, Physical Sciences, Life Sciences, English",
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
      reply = await handleIntegratedAIIntelligenceGathering(user, command.text);
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
    dynamic_probing_integrated: true,
  });

  if (user.conversation_history.length > 15) {
    user.conversation_history = user.conversation_history.slice(-15);
  }

  user.last_active = new Date().toISOString();
  userStates.set(subscriberId, user);

  console.log(
    `✅ Integrated dynamic reply: ${
      reply.length
    } chars | Painpoint confirmed: ${user.context.painpoint_confirmed || false}`
  );

  return res.status(200).json(
    formatGoatResponse(reply, {
      user_id: user.id,
      command_type: command.type,
      current_menu: user.current_menu,
      ai_intel_state: user.context.ai_intel_state,
      dynamic_probing_integrated: true,
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

// ===== INTEGRATED AI INTELLIGENCE GATHERING =====

async function startAIIntelligenceGathering(user) {
  console.log(`🤖 Starting INTEGRATED AI intelligence for user ${user.id}`);

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

async function handleIntegratedAIIntelligenceGathering(user, text) {
  console.log(
    `🤖 INTEGRATED AI Intelligence: ${user.context.ai_intel_state} | Input: "${text}" | Confirmed: ${user.context.painpoint_confirmed}`
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
      if (text.toLowerCase().includes("chemistry"))
        subject = "Physical Sciences";
      if (
        text.toLowerCase().includes("life") ||
        text.toLowerCase().includes("biology")
      )
        subject = "Life Sciences";
      if (text.toLowerCase().includes("english")) subject = "English";

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

    // ===== INTEGRATED PAINPOINT EXCAVATION =====
    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
      user.context.painpoint_profile.topic_struggles = text.trim();
      user.context.ai_intel_state = AI_INTEL_STATES.AI_MICRO_TARGETING;
      user.context.probing_attempts = 0;

      console.log(`✅ Topic identified: ${text.trim()}`);

      // ===== USING INTEGRATED DYNAMIC PROBING SYSTEM =====
      const dynamicProbe = await generateDynamicTargetedProbe(
        text,
        user.context.painpoint_profile,
        1
      );

      const painpointContent = `${dynamicProbe}

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

    // ===== INTEGRATED MICRO TARGETING =====
    case AI_INTEL_STATES.AI_MICRO_TARGETING:
      user.context.probing_attempts = (user.context.probing_attempts || 0) + 1;

      const improvedClarity = await analyzeImprovedPainpointClarity(
        text,
        user.context.painpoint_profile
      );

      console.log(
        `🔍 INTEGRATED Probing attempt ${user.context.probing_attempts} | Clarity: ${improvedClarity.clarity_level} | Response: "${text}"`
      );

      if (
        improvedClarity.clarity_level === "clear" ||
        user.context.probing_attempts >= 3
      ) {
        // PAINPOINT IS CLEAR - Move to confirmation
        user.context.painpoint_profile.specific_failure =
          improvedClarity.specific_struggle;
        user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION;

        return await generateImprovedPainpointConfirmation(
          user,
          improvedClarity
        );
      } else {
        // PAINPOINT STILL VAGUE - Continue probing with dynamic system
        const nextDynamicProbe = await generateDynamicTargetedProbe(
          text,
          user.context.painpoint_profile,
          user.context.probing_attempts + 1
        );

        const probingContent = `${nextDynamicProbe}

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

    // ===== PAINPOINT CONFIRMATION =====
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
        // USER DID NOT CONFIRM - Go back to probing with dynamic system
        user.context.ai_intel_state = AI_INTEL_STATES.AI_MICRO_TARGETING;
        user.context.probing_attempts = 0;

        const clarificationContent = `**Let me try a different approach.**

${await generateDynamicTargetedProbe(text, user.context.painpoint_profile, 1)}

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

// ===== INTEGRATED DYNAMIC PROBING FUNCTIONS =====

async function generateDynamicTargetedProbe(userResponse, profile, attempt) {
  const subject = profile.subject || "Mathematics";
  const topic = profile.topic_struggles?.toLowerCase() || "general";

  console.log(
    `🔄 INTEGRATED Dynamic probing: ${subject} -> ${topic} (attempt ${attempt})`
  );

  // Try to find in knowledge base
  const subjectData = SUBJECT_PROBING_DATABASE[subject];
  if (subjectData) {
    // Look for exact topic match
    const topicData = subjectData[topic];
    if (topicData) {
      console.log(`✅ Found exact topic match: ${topic}`);
      return generateTopicSpecificProbe(topic, topicData, attempt);
    }

    // Look for partial topic matches
    const partialMatch = Object.keys(subjectData).find(
      (key) => topic.includes(key) || key.includes(topic)
    );
    if (partialMatch) {
      console.log(`✅ Found partial topic match: ${partialMatch} for ${topic}`);
      return generateTopicSpecificProbe(
        partialMatch,
        subjectData[partialMatch],
        attempt
      );
    }

    // No specific topic found, but subject exists - use general subject probing
    console.log(
      `⚠️ No topic match for ${topic}, using general ${subject} probing`
    );
    const generalTopicKeys = Object.keys(subjectData);
    if (generalTopicKeys.length > 0) {
      const generalExamples = generalTopicKeys
        .slice(0, 4)
        .map((key) => `**${key.charAt(0).toUpperCase() + key.slice(1)}**`)
        .join(", ");

      switch (attempt) {
        case 1:
          return `**${
            topic.charAt(0).toUpperCase() + topic.slice(1)
          } troubles!** What about ${topic} specifically?

Common ${subject} areas include: ${generalExamples}

**What specifically happens** when you try to work with ${topic}?`;

        default:
          return generateHardcodedProbe(userResponse, profile, attempt);
      }
    }
  }

  // Fallback to hardcoded approach for backward compatibility
  console.log(
    `⚠️ No subject data found for ${subject}, using hardcoded fallback`
  );
  return generateHardcodedProbe(userResponse, profile, attempt);
}

function generateTopicSpecificProbe(topic, topicData, attempt) {
  switch (attempt) {
    case 1:
      const examples = topicData.examples.map((ex) => `• **${ex}**`).join("\n");
      return `**${
        topic.charAt(0).toUpperCase() + topic.slice(1)
      } troubles!** What about ${topic} specifically?

${examples}

**What specifically happens** when you try these?`;

    case 2:
      const struggles = topicData.common_struggles
        .map((s) => `• "${s}"`)
        .join("\n");
      return `**Let's narrow down your ${topic} struggle.**

When you see a ${topic} problem, what's your **first reaction**?
${struggles}`;

    case 3:
      return `**Final attempt to understand your ${topic} challenge.**

**Think of the last ${topic} problem you tried.** What exactly made you get stuck?`;

    default:
      return `**Tell me about your ${topic} challenge** - what makes it difficult for you?`;
  }
}

// HARDCODED FALLBACK (existing code for safety)
function generateHardcodedProbe(userResponse, profile, attempt) {
  const topic = profile.topic_struggles || "the topic";

  switch (attempt) {
    case 1:
      return `**${topic} troubles!** What specifically about ${topic}?

**Tell me exactly what happens** when you try to work with ${topic}.`;

    case 2:
      return `**Let's get more specific about ${topic}.**

When you see a ${topic} problem, what's your **first thought**? Do you:
• Know what to do but get confused halfway?
• Feel completely lost where to start?
• Have a method but it doesn't work?`;

    default:
      return `**Tell me about your ${topic} challenge** - what makes it difficult for you?`;
  }
}

// ===== KEEP ALL EXISTING ANALYSIS AND CONFIRMATION FUNCTIONS =====

async function analyzeImprovedPainpointClarity(userResponse, profile) {
  const response = userResponse.toLowerCase().trim();

  console.log(`🔍 Analyzing painpoint clarity for: "${userResponse}"`);

  const specific_math_indicators = [
    "solve for x",
    "cannot solve",
    "can't solve",
    "solving equations",
    "factoring",
    "expanding",
    "simplifying",
    "substitution",
    "don't know which formula",
    "which method",
    "what steps",
    "get confused when",
    "stuck on",
    "problem with",
  ];

  const hasSpecificMathStruggle = specific_math_indicators.some((indicator) =>
    response.includes(indicator)
  );

  if (hasSpecificMathStruggle) {
    console.log(`✅ CLEAR painpoint detected: ${userResponse}`);
    return {
      clarity_level: "clear",
      specific_struggle: userResponse,
      needs_more_probing: false,
      recognition_reason: "specific_math_struggle_detected",
    };
  }

  const vague_indicators = [
    "i don't know",
    "not sure",
    "everything",
    "all of it",
    "confused",
    "help me",
  ];
  const isVague = vague_indicators.some((indicator) =>
    response.includes(indicator)
  );

  if (isVague) {
    console.log(`❌ VAGUE painpoint detected: ${userResponse}`);
    return {
      clarity_level: "vague",
      specific_struggle: response,
      needs_more_probing: true,
      recognition_reason: "vague_response_detected",
    };
  }

  if (response.length > 15) {
    console.log(`✅ MODERATE painpoint detected: ${userResponse}`);
    return {
      clarity_level: "clear",
      specific_struggle: response,
      needs_more_probing: false,
      recognition_reason: "sufficient_detail_provided",
    };
  }

  console.log(`❓ MODERATE painpoint detected: ${userResponse}`);
  return {
    clarity_level: "moderate",
    specific_struggle: response,
    needs_more_probing: true,
    recognition_reason: "insufficient_detail",
  };
}

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

async function analyzeConfirmationResponse(userResponse) {
  const response = userResponse.toLowerCase().trim();

  const confirmation_indicators = [
    "yes",
    "correct",
    "right",
    "exactly",
    "that's it",
    "perfect",
    "true",
  ];
  const denial_indicators = [
    "no",
    "not right",
    "wrong",
    "not exactly",
    "misunderstood",
    "not correct",
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

  return { confirmed: false, needs_clarification: true };
}

async function generateConfirmedTargetedQuestion(user) {
  const profile = user.context.painpoint_profile;

  console.log(`🎯 GENERATING REAL TARGETED QUESTION:`, profile);

  try {
    // ===== REAL AI QUESTION GENERATION =====
    const realQuestion = await generateRealAIQuestion(profile);

    user.context.current_question = {
      questionText: realQuestion.questionText,
      solution: realQuestion.solution,
      explanation: realQuestion.explanation,
      targeted: true,
      painpoint_confirmed: true,
      dynamic_probing_used: true,
      ai_generated: true,
    };

    const content = `🎯 **TARGETED PRACTICE QUESTION**

**Designed for your confirmed challenge:** *${profile.specific_failure}*

📝 **Question:**
${realQuestion.questionText}

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
  } catch (error) {
    console.error("Real question generation failed:", error);

    // Enhanced fallback with subject-specific questions
    const fallbackQuestion = generateFallbackQuestion(profile);

    user.context.current_question = {
      questionText: fallbackQuestion.questionText,
      solution: fallbackQuestion.solution,
      targeted: true,
      painpoint_confirmed: true,
      fallback_used: true,
    };

    const content = `🎯 **TARGETED PRACTICE QUESTION**

**Designed for your confirmed challenge:** *${profile.specific_failure}*

📝 **Question:**
${fallbackQuestion.questionText}

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
}

async function generateRealAIQuestion(profile) {
  console.log(`🤖 Generating real AI question for:`, profile);

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Construct detailed prompt for question generation
    const questionPrompt = `Generate a Grade ${profile.grade} ${profile.subject} practice question that specifically targets a student who struggles with: "${profile.specific_failure}"

Topic: ${profile.topic_struggles}
Student's Challenge: ${profile.specific_failure}
Assessment Type: ${profile.assessment_type}

Requirements:
1. Create ONE specific practice question that directly addresses their struggle
2. Make it appropriate for Grade ${profile.grade} level
3. Focus specifically on "${profile.specific_failure}"
4. Include clear instructions
5. Make it solvable but challenging

Return ONLY the question text, no solution. Keep it concise and focused.

Example format: "Solve for x: 3x + 8 = 23. Show all your working steps."`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: questionPrompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.4,
    });

    const questionText = response.choices[0].message.content.trim();

    // Generate corresponding solution
    const solutionPrompt = `Provide a step-by-step solution for this question, specifically helping a student who "${profile.specific_failure}":

Question: ${questionText}

Student's struggle: ${profile.specific_failure}

Provide a clear, educational step-by-step solution that addresses their specific challenge. Use bold formatting for steps.`;

    const solutionResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: solutionPrompt,
        },
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const solution = enhanceVisualFormatting(
      solutionResponse.choices[0].message.content
    );

    console.log(
      `✅ Real AI question generated: ${questionText.substring(0, 50)}...`
    );

    return {
      questionText: enhanceVisualFormatting(questionText),
      solution: solution,
      explanation: `This question specifically targets students who ${profile.specific_failure}`,
      tokens_used:
        (response.usage?.total_tokens || 0) +
        (solutionResponse.usage?.total_tokens || 0),
    };
  } catch (error) {
    console.error("OpenAI question generation failed:", error);
    throw error; // Let the calling function handle fallback
  }
}

// ===== ENHANCED FALLBACK QUESTION GENERATOR =====

function generateFallbackQuestion(profile) {
  const subject = profile.subject || 'Mathematics';
  const grade = profile.grade || '11';
  const topic = profile.topic_struggles || 'algebra';
  const struggle = profile.specific_failure || 'solving equations';
  
  console.log(`🔄 Generating fallback question for: ${subject} ${topic} - ${struggle}`);
  
  // Subject and topic specific fallback questions
  if (subject === 'Mathematics') {
    if (topic.toLowerCase().includes('algebra')) {
      if (struggle.toLowerCase().includes('solve for x') || struggle.toLowerCase().includes('cannot solve')) {
        return {
          questionText: `**Solve for x:**

2x + 7 = 19

**Show all your working steps.**`,
          solution: `**Step 1:** Subtract 7 from both sides
2x + 7 - 7 = 19 - 7
2x = 12

**Step 2:** Divide both sides by 2
2x ÷ 2 = 12 ÷ 2
x = 6

**Therefore:** x = 6`
        };
      }
      
      if (struggle.toLowerCase().includes('factor')) {
        return {
          questionText: `**Factor completely:**

x² + 5x + 6

**Show all your working steps.**`,
          solution: `**Step 1:** Look for two numbers that multiply to 6 and add to 5
Numbers: 2 and 3 (2 × 3 = 6, 2 + 3 = 5)

**Step 2:** Write as factors
x² + 5x + 6 = (x + 2)(x + 3)

**Therefore:** (x + 2)(x + 3)`
        };
      }
    }
    
    if (topic.toLowerCase().includes('geometry')) {
      return {
        questionText: `**Find the area of a triangle:**

Base = 8 cm
Height = 6 cm

**Show your formula and calculation.**`,
        solution: `**Formula:** Area = ½ × base × height

**Step 1:** Substitute values
Area = ½ × 8 × 6

**Step 2:** Calculate
Area = ½ × 48 = 24

**Therefore:** Area = 24 cm²`
      };
    }
    
    if (topic.toLowerCase().includes('trigonometry')) {
      return {
        questionText: `**Find sin θ:**

In a right triangle:
Opposite side = 3
Hypotenuse = 5

**Show your working.**`,
        solution: `**Formula:** sin θ = opposite/hypotenuse

**Step 1:** Substitute values
sin θ = 3/5

**Step 2:** Convert to decimal
sin θ = 0.6

**Therefore:** sin θ = 3/5 or 0.6`
      };
    }
  }
  
  if (subject === 'Physical Sciences') {
    if (topic.toLowerCase().includes('physics')) {
      return {
        questionText: `**Calculate the force:**

Mass = 10 kg
Acceleration = 5 m/s²

**Use F = ma and show your working.**`,
        solution: `**Formula:** F = ma

**Step 1:** Substitute values
F = 10 × 5

**Step 2:** Calculate
F = 50

**Therefore:** F = 50 N`
      };
    }
    
    if (topic.toLowerCase().includes('chemistry')) {
      return {
        questionText: `**Balance this equation:**

H₂ + O₂ → H₂O

**Show your working steps.**`,
        solution: `**Step 1:** Count atoms on each side
Left: H = 2, O = 2
Right: H = 2, O = 1

**Step 2:** Balance oxygen by adding coefficient
H₂ + O₂ → 2H₂O

**Step 3:** Balance hydrogen
2H₂ + O₂ → 2H₂O

**Therefore:** 2H₂ + O₂ → 2H₂O`
      };
    }
  }
  
  // Generic fallback
  return {
    questionText: `**Grade ${grade} ${subject} Practice Question:**

Topic: ${topic}
Challenge: ${struggle}

**Solve this step by step.**`,
    solution: `**Step 1:** Identify what the question is asking

**Step 2:** Apply the appropriate method for ${topic}

**Step 3:** Show all working clearly

**Step 4:** Check your answer makes sense

**Therefore:** [Complete solution addressing ${struggle}]`
  };
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

// ===== ENHANCED SOLUTION DISPLAY =====

async function showConfirmedTargetedSolution(user) {
  const profile = user.context.painpoint_profile;
  const question = user.context.current_question;
  
  if (!question || !question.solution) {
    const content = `**No solution available.**

Please generate a question first.`;
    const menu = generateEnhancedVisualMenu(AI_INTEL_STATES.AI_QUESTION_GENERATION, user.preferences.device_type);
    return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
  }
  
  const content = `📚 **TARGETED SOLUTION**

**For your challenge:** *${profile.specific_failure}*

${question.solution}

**🎯 Strategy:** This solution specifically addresses your struggle with "${profile.specific_failure}"

**💡 Key Point:** Focus on understanding each step to overcome your specific challenge.`;
  
  const menu = generateEnhancedVisualMenu(AI_INTEL_STATES.AI_QUESTION_GENERATION, user.preferences.device_type);
  return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
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

  user.context.painpoint_confirmed = false;
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
  const {
    grade = 10,
    subject = "Mathematics",
    questionCount = 1,
    topics = "algebra",
    painpoint = "solving equations",
    confidence = "medium",
  } = req.query;

  try {
    // Create a mock profile for API testing
    const mockProfile = {
      grade: grade,
      subject: subject,
      topic_struggles: topics,
      specific_failure: painpoint,
      assessment_type: "test",
    };

    const realQuestion = await generateRealAIQuestion(mockProfile);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      mockExam: [
        {
          questionNumber: 1,
          questionText: realQuestion.questionText,
          solution: realQuestion.solution,
          marksAllocated: 5,
          targeted: true,
          painpoint: painpoint,
        },
      ],
      metadata: {
        real_ai_generation: true,
        tokens_used: realQuestion.tokens_used,
        dynamic_probing_integrated: true,
      },
    });
  } catch (error) {
    // Use fallback if AI fails
    const fallbackQuestion = generateFallbackQuestion({
      grade: grade,
      subject: subject,
      topic_struggles: topics,
      specific_failure: painpoint,
    });

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      mockExam: [
        {
          questionNumber: 1,
          questionText: fallbackQuestion.questionText,
          solution: fallbackQuestion.solution,
          marksAllocated: 5,
          fallback_used: true,
        },
      ],
      metadata: {
        fallback_generation: true,
        ai_error: error.message,
      },
    });
  }
}




async function handleHomeworkOCR(req, res, start) {
  const { problemText } = req.body;

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    homework: {
      originalProblem: problemText || "Sample problem",
      solution: "Step-by-step solution with enhanced formatting",
      processed: "Integrated dynamic probing system active",
    },
    metadata: { dynamic_probing_integrated: true },
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
          saContext:
            "Integrated dynamic probing system with cultural references",
        },
      ],
    },
    metadata: { dynamic_probing_integrated: true },
  });
}

async function handleDatabaseTest(req, res, start) {
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    database: {
      status: "simulated - integrated dynamic probing",
      message: "Database with comprehensive subject coverage",
      dynamic_probing_integrated: true,
    },
  });
}

async function handleOpenAITest(req, res, start) {
  try {
    const testProfile = {
      grade: "11",
      subject: "Mathematics",
      topic_struggles: "algebra",
      specific_failure: "I cannot solve for x",
      assessment_type: "test",
    };

    const realQuestion = await generateRealAIQuestion(testProfile);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      openai: {
        status: "REAL AI QUESTION GENERATION ACTIVE",
        model: "gpt-3.5-turbo",
        test_question: realQuestion.questionText,
        test_solution: realQuestion.solution.substring(0, 100) + "...",
        tokens_used: realQuestion.tokens_used,
        integration: "Dynamic probing + Real AI generation working",
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Real AI question generation test failed",
      message: error.message,
      timestamp: new Date().toISOString(),
      fallback: "Using enhanced fallback question system",
    });
  }
}
