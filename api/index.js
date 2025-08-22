/**
 * GOAT Bot 2.0 - INTEGRATED DYNAMIC PROBING SYSTEM
 * User: sophoniagoat
 * Updated: 2025-08-21 15:39:26 UTC
 * INTEGRATION: Dynamic probing system now properly connected to entry point
 */
const homeworkHelp = require("./homework.js");
// Enhanced user state management
const userStates = new Map();

// Command types
const GOAT_COMMANDS = {
  WELCOME: "welcome",
  MENU_CHOICE: "menu_choice",
  EXAM_PREP_CONVERSATION: "exam_prep_conversation",
  HOMEWORK_HELP: "homework_help", // NEW
  HOMEWORK_UPLOAD: "homework_upload", // NEW
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
  GUIDED_DISCOVERY: "guided_discovery", // NEW: For unclear responses
  ALTERNATIVE_PATHS: "alternative_paths", // NEW: When probing fails
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
      diagnostic_question: {
        questionText:
          "Solve for x: 2x + 7 = 19\n\nShow all your working steps.",
        solution:
          "**Step 1:** Subtract 7 from both sides\n2x = 12\n\n**Step 2:** Divide both sides by 2\nx = 6\n\n**Therefore:** x = 6",
        purpose: "Basic equation solving",
      },
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
      diagnostic_question: {
        questionText:
          "Find the area of a rectangle:\n\nLength = 8 cm\nWidth = 5 cm\n\nShow your formula and calculation.",
        solution:
          "**Formula:** Area = length × width\n\n**Step 1:** Substitute values\nArea = 8 × 5\n\n**Step 2:** Calculate\nArea = 40\n\n**Therefore:** Area = 40 cm²",
        purpose: "Basic area calculation",
      },
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
      diagnostic_question: {
        questionText:
          "In a right triangle:\n\nOpposite side = 4\nHypotenuse = 5\n\nFind sin θ and show your working.",
        solution:
          "**Formula:** sin θ = opposite/hypotenuse\n\n**Step 1:** Substitute values\nsin θ = 4/5\n\n**Step 2:** Convert to decimal\nsin θ = 0.8\n\n**Therefore:** sin θ = 4/5 or 0.8",
        purpose: "Basic trigonometric ratio",
      },
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
      diagnostic_question: {
        questionText:
          "Given f(x) = 2x + 3:\n\nFind f(4)\n\nShow your substitution and calculation.",
        solution:
          "**Step 1:** Substitute x = 4 into f(x) = 2x + 3\nf(4) = 2(4) + 3\n\n**Step 2:** Calculate\nf(4) = 8 + 3 = 11\n\n**Therefore:** f(4) = 11",
        purpose: "Basic function evaluation",
      },
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
      diagnostic_question: {
        questionText:
          "Calculate the force:\n\nMass = 10 kg\nAcceleration = 5 m/s²\n\nUse F = ma and show your working.",
        solution:
          "**Formula:** F = ma\n\n**Step 1:** Substitute values\nF = 10 × 5\n\n**Step 2:** Calculate\nF = 50\n\n**Therefore:** F = 50 N",
        purpose: "Basic force calculation",
      },
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
      diagnostic_question: {
        questionText:
          "Balance this equation:\n\nH₂ + O₂ → H₂O\n\nShow your working steps.",
        solution:
          "**Step 1:** Count atoms\nLeft: H=2, O=2\nRight: H=2, O=1\n\n**Step 2:** Balance oxygen\nH₂ + O₂ → 2H₂O\n\n**Step 3:** Balance hydrogen\n2H₂ + O₂ → 2H₂O\n\n**Therefore:** 2H₂ + O₂ → 2H₂O",
        purpose: "Basic equation balancing",
      },
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

  // NEW: Handle homework-specific states
  if (userContext.current_menu === "homework_help") {
    if (imageData) {
      return {
        type: GOAT_COMMANDS.HOMEWORK_UPLOAD,
        imageData: imageData,
        original_text: message,
      };
    } else {
      return {
        type: GOAT_COMMANDS.HOMEWORK_HELP,
        text: message,
      };
    }
  }

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

  // Handle A, B, C options for alternative paths
  if (
    /^[abc]$/i.test(text) &&
    userContext.ai_intel_state === AI_INTEL_STATES.ALTERNATIVE_PATHS
  ) {
    return {
      type: GOAT_COMMANDS.EXAM_PREP_CONVERSATION,
      text: message,
      alternative_choice: text.toUpperCase(),
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
    "🔧 GOAT Bot v2.0 - ENHANCED HEURISTIC FIX: AI Clarity Validation"
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
      webhook: "GOAT Bot - ENHANCED HEURISTIC FIX",
      status: "Active",
      fix: "AI clarity validation prevents vague responses from becoming painpoints",
      progress: "100% complete - bug fixed",
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
    ai_intel_state: user.context.ai_intel_state,
  });

  console.log(`🎯 Command parsed: ${command.type}`, {
    action: command.action,
    choice: command.choice,
    option: command.option,
    command: command.command,
    alternative_choice: command.alternative_choice,
    text: command.text?.substring(0, 30),
  });

  let reply = "";

console.log(
  `🔍 Menu choice: ${command.choice} | Type: ${command.type} | Current menu: ${user.current_menu}`
);

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
        user.current_menu = "homework_active";
        console.log(`🚀 Starting Homework Help for user ${user.id}`);

        try {
          const homeworkHelp = require("./homework.js");
          await homeworkHelp(req, res);
          return; // ❌ JUST RETURN - DON'T RETURN THE RESPONSE OBJECT
        } catch (error) {
          console.error("❌ Homework error:", error);
          reply = "📚 Homework Help failed. Please try again.";
        }
        break;
      
        user.current_menu = "homework_active";
        console.log(`🚀 Starting Homework Help for user ${user.id}`);

        try {
          console.log("🔧 About to require homework.js");
          const homeworkHelp = require("./homework.js");
          console.log("✅ homework.js loaded successfully");

          console.log("🔧 About to call homeworkHelp function");
          const result = await homeworkHelp(req, res);
          console.log("✅ homeworkHelp returned:", result);

          return result;
        } catch (error) {
          console.error("❌ Homework error:", error);
          console.error("❌ Error stack:", error.stack);
          reply = "📚 Homework Help failed. Please try again.";
        }
        break;
      case 3:
        reply = await startMemoryHacks(user);
        break;
      default:
        reply = await showWelcomeMenu(user);
    }
    break;

  case GOAT_COMMANDS.HOMEWORK_HELP:
  case GOAT_COMMANDS.HOMEWORK_UPLOAD:
    reply = await handleIntegratedHomeworkFlow(
      user,
      command.text,
      command.imageData
    );
    break;

  case GOAT_COMMANDS.EXAM_PREP_CONVERSATION:
    reply = await handleFixedAIIntelligenceGathering(
      user,
      command.text,
      command.alternative_choice
    );
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
    heuristic_fix_applied: true,
  });

  if (user.conversation_history.length > 15) {
    user.conversation_history = user.conversation_history.slice(-15);
  }

  user.last_active = new Date().toISOString();
  userStates.set(subscriberId, user);

  console.log(
    `✅ Fixed heuristic reply: ${reply.length} chars | Painpoint confirmed: ${
      user.context.painpoint_confirmed || false
    }`
  );

  return res.status(200).json(
    formatGoatResponse(reply, {
      user_id: user.id,
      command_type: command.type,
      current_menu: user.current_menu,
      ai_intel_state: user.context.ai_intel_state,
      heuristic_fix_applied: true,
      elapsed_ms: Date.now() - start,
    })
  );
}

// NEW: Homework Help functions (add these)
async function startIntegratedHomeworkHelp(user) {
  user.current_menu = "homework_help";
  user.context = {
    hw_intel_state: "hw_awaiting_upload",
    session_start: new Date().toISOString(),
    questions_helped: 0,
  };

  return `📚 **Homework Help Mode** 🫶

I'll help you get UNSTUCK in 30 seconds!

📸 Upload homework image or 📝 type your question

⚡ *Average unstuck time: 30 seconds*`;
}

async function handleIntegratedHomeworkFlow(user, text, imageData) {
  // Route to homework system
  const homeworkReq = {
    method: "POST",
    body: { psid: user.id, message: text, imageData: imageData },
    query: { endpoint: "workflow" },
  };

  const mockRes = { json: (data) => data.message || "Processing..." };

  try {
    await homeworkHelp(homeworkReq, mockRes);
    return mockRes.json({ message: "Homework help response" });
  } catch (error) {
    return "Something went wrong with homework help. Please try again.";
  }
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
    case AI_INTEL_STATES.GUIDED_DISCOVERY:
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

    case AI_INTEL_STATES.ALTERNATIVE_PATHS:
      return `1️⃣${spacing} ➡️ Option A (Guided Discovery)
2️⃣${spacing} 📝 Option B (Different Topic)
3️⃣${spacing} 🔄 Option C (Different Subject)
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
async function handleFixedAIIntelligenceGathering(
  user,
  text,
  alternativeChoice = null
) {
  console.log(
    `🤖 FIXED AI Intelligence: ${user.context.ai_intel_state} | Input: "${text}" | Alt: ${alternativeChoice} | Confirmed: ${user.context.painpoint_confirmed}`
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

    // ===== PAINPOINT EXCAVATION =====
    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
      user.context.painpoint_profile.topic_struggles = text.trim();
      user.context.ai_intel_state = AI_INTEL_STATES.AI_MICRO_TARGETING;
      user.context.probing_attempts = 0;

      console.log(`✅ Topic identified: ${text.trim()}`);

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

    // ===== FIXED MICRO TARGETING (ENHANCED HEURISTIC) =====
    case AI_INTEL_STATES.AI_MICRO_TARGETING:
      return await handleFixedMicroTargeting(user, text);

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
        // USER DID NOT CONFIRM - Go back to probing
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

    // ===== ALTERNATIVE PATHS HANDLING =====
    case AI_INTEL_STATES.ALTERNATIVE_PATHS:
      return await handleAlternativePathChoice(user, text, alternativeChoice);

    // ===== GUIDED DISCOVERY =====
    case AI_INTEL_STATES.GUIDED_DISCOVERY:
      return await handleGuidedDiscoveryInteraction(user, text);

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

async function handleFixedMicroTargeting(user, text) {
  user.context.probing_attempts = (user.context.probing_attempts || 0) + 1;

  const improvedClarity = await analyzeEnhancedPainpointClarity(
    text,
    user.context.painpoint_profile
  );

  console.log(
    `🔍 FIXED Probing attempt ${user.context.probing_attempts} | Clarity: ${improvedClarity.clarity_level} | Response: "${text}"`
  );

  if (improvedClarity.clarity_level === "clear") {
    // CLEAR RESPONSE - Move to confirmation
    user.context.painpoint_profile.specific_failure =
      improvedClarity.specific_struggle;
    user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION;

    return await generateImprovedPainpointConfirmation(user, improvedClarity);
  } else if (user.context.probing_attempts >= 3) {
    // MAX ATTEMPTS REACHED - Enhanced heuristic validation
    console.log(
      `🔧 Max attempts reached, using enhanced heuristic validation for: "${text}"`
    );

    const heuristicValidation = await analyzeResponseWithEnhancedHeuristics(
      text,
      user.context.painpoint_profile
    );

    if (heuristicValidation.is_actionable) {
      // ACTIONABLE RESPONSE - Proceed with interpretation
      user.context.painpoint_profile.specific_failure =
        heuristicValidation.interpretation;
      user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_CONFIRMATION;

      const confirmationData = {
        specific_struggle: heuristicValidation.interpretation,
        clarity_level: "heuristic_interpreted",
      };

      return await generateHeuristicInterpretedConfirmation(
        user,
        confirmationData,
        heuristicValidation
      );
    } else {
      // NOT ACTIONABLE - Offer alternative paths
      user.context.ai_intel_state = AI_INTEL_STATES.ALTERNATIVE_PATHS;
      return await offerAlternativePaths(user, heuristicValidation);
    }
  } else {
    // CONTINUE PROBING - Use dynamic system
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
}

async function analyzeEnhancedPainpointClarity(userResponse, profile) {
  const response = userResponse.toLowerCase().trim();

  console.log(`🔍 FINAL Enhanced analysis for: "${userResponse}"`);

  // ===== SUBJECT-SPECIFIC CLEAR INDICATORS (NEW) =====

  // TRIGONOMETRY SPECIFIC CLEAR INDICATORS
  const trig_clear_indicators = [
    "don't understand ratios",
    "can't understand ratios",
    "ratios confuse me",
    "don't know sin cos tan",
    "can't remember which ratio",
    "ratios are hard",
    "don't get ratios",
    "struggle with ratios",
    "ratios don't make sense",
    "don't understand sin",
    "don't understand cos",
    "don't understand tan",
    "can't do sine",
    "can't do cosine",
    "can't do tangent",
    "unit circle confuses me",
    "don't understand unit circle",
    "trig identities confuse me",
    "don't understand identities",
    "can't solve trig equations",
    "trig graphs confuse me",
  ];

  // ALGEBRA SPECIFIC CLEAR INDICATORS
  const algebra_clear_indicators = [
    "solve for x",
    "cannot solve",
    "can't solve",
    "solving equations",
    "don't know how to solve",
    "can't find x",
    "x confuses me",
    "factoring",
    "can't factor",
    "don't understand factoring",
    "expanding",
    "can't expand",
    "don't know how to expand",
    "simplifying",
    "can't simplify",
    "don't know how to simplify",
    "substitution",
    "can't substitute",
    "don't understand substitution",
    "don't know which formula",
    "which method",
    "what steps",
  ];

  // GEOMETRY SPECIFIC CLEAR INDICATORS
  const geometry_clear_indicators = [
    "can't visualize",
    "don't understand shapes",
    "can't see the triangle",
    "forget which formula",
    "don't know the formula",
    "area formula",
    "perimeter formula",
    "can't calculate area",
    "can't find area",
    "struggle with proofs",
    "don't understand proofs",
    "proofs confuse me",
    "coordinates confuse me",
    "don't understand coordinates",
    "can't plot points",
    "graphs confuse me",
  ];

  // GENERAL MATHEMATICAL CLEAR INDICATORS
  const general_math_clear_indicators = [
    "get confused when",
    "stuck on",
    "problem with",
    "struggle with",
    "don't understand how to",
    "can't figure out",
    "lost when",
    "don't know where to start",
    "can't remember the steps",
    "make calculation mistakes",
    "get the wrong answer",
  ];

  // ===== CHECK FOR SUBJECT-SPECIFIC CLARITY =====

  const topic = profile.topic_struggles?.toLowerCase() || "";

  // Check trigonometry specific indicators
  if (topic.includes("trig")) {
    const hasTrigClarity = trig_clear_indicators.some((indicator) =>
      response.includes(indicator)
    );

    if (hasTrigClarity) {
      console.log(`✅ TRIGONOMETRY CLEAR painpoint detected: ${userResponse}`);
      return {
        clarity_level: "clear",
        specific_struggle: userResponse,
        needs_more_probing: false,
        recognition_reason: "trigonometry_specific_clear_indicator",
      };
    }
  }

  // Check algebra specific indicators
  if (topic.includes("algebra")) {
    const hasAlgebraClarity = algebra_clear_indicators.some((indicator) =>
      response.includes(indicator)
    );

    if (hasAlgebraClarity) {
      console.log(`✅ ALGEBRA CLEAR painpoint detected: ${userResponse}`);
      return {
        clarity_level: "clear",
        specific_struggle: userResponse,
        needs_more_probing: false,
        recognition_reason: "algebra_specific_clear_indicator",
      };
    }
  }

  // Check geometry specific indicators
  if (topic.includes("geometry")) {
    const hasGeometryClarity = geometry_clear_indicators.some((indicator) =>
      response.includes(indicator)
    );

    if (hasGeometryClarity) {
      console.log(`✅ GEOMETRY CLEAR painpoint detected: ${userResponse}`);
      return {
        clarity_level: "clear",
        specific_struggle: userResponse,
        needs_more_probing: false,
        recognition_reason: "geometry_specific_clear_indicator",
      };
    }
  }

  // ===== CHECK GENERAL MATHEMATICAL CLARITY =====

  const hasGeneralMathClarity = general_math_clear_indicators.some(
    (indicator) => response.includes(indicator)
  );

  if (hasGeneralMathClarity) {
    console.log(`✅ GENERAL MATH CLEAR painpoint detected: ${userResponse}`);
    return {
      clarity_level: "clear",
      specific_struggle: userResponse,
      needs_more_probing: false,
      recognition_reason: "general_mathematical_clear_indicator",
    };
  }

  // ===== ENHANCED PHRASE-BASED DETECTION =====

  // Look for clear struggle phrases
  const clear_struggle_phrases = [
    "i don't understand",
    "i can't understand",
    "i don't get",
    "i can't do",
    "i struggle with",
    "i have trouble with",
    "i get confused with",
    "i don't know how to",
    "i can't figure out",
    "i can't remember how to",
  ];

  const hasClearStrugglePhrase = clear_struggle_phrases.some((phrase) =>
    response.includes(phrase)
  );

  if (hasClearStrugglePhrase && response.length > 8) {
    console.log(`✅ CLEAR STRUGGLE PHRASE detected: ${userResponse}`);
    return {
      clarity_level: "clear",
      specific_struggle: userResponse,
      needs_more_probing: false,
      recognition_reason: "clear_struggle_phrase_detected",
    };
  }

  // ===== ORIGINAL VAGUE DETECTION (UNCHANGED) =====

  const definite_vague_indicators = [
    "i don't know",
    "not sure",
    "i'm not sure",
    "no idea",
    "don't understand",
    "confused",
    "help me",
    "everything",
    "all of it",
    "i'm lost",
    "no clue",
    "i'm still not sure",
    "still don't know",
    "still confused",
    "not really sure",
  ];

  // BUT: Only consider it vague if it's ONLY these words with no specific content
  const isDefinitelyVague = definite_vague_indicators.some(
    (indicator) => response === indicator || response === indicator + "."
  );

  if (isDefinitelyVague) {
    console.log(`❌ VAGUE painpoint detected: ${userResponse}`);
    return {
      clarity_level: "vague",
      specific_struggle: response,
      needs_more_probing: true,
      recognition_reason: "vague_response_detected",
    };
  }

  // ===== DEFAULT TO CLEAR FOR REASONABLE LENGTH =====

  if (response.length > 10) {
    console.log(`✅ LENGTH-BASED CLEAR painpoint detected: ${userResponse}`);
    return {
      clarity_level: "clear",
      specific_struggle: response,
      needs_more_probing: false,
      recognition_reason: "sufficient_length_and_content",
    };
  }

  console.log(`❓ UNCLEAR painpoint detected: ${userResponse}`);
  return {
    clarity_level: "unclear",
    specific_struggle: response,
    needs_more_probing: true,
    recognition_reason: "insufficient_detail",
  };
}
async function analyzeResponseWithEnhancedHeuristics(userResponse, profile) {
  const response = userResponse.toLowerCase().trim();

  console.log(`🔧 Enhanced heuristic validation for: "${userResponse}"`);

  // Definitive vague indicators (enhanced list)
  const definitelyVague = [
    "i don't know",
    "not sure",
    "i'm not sure",
    "no idea",
    "don't understand",
    "confused",
    "help me",
    "everything",
    "all of it",
    "i'm lost",
    "no clue",
    "i'm still not sure",
    "still don't know",
    "still confused",
    "not really sure",
    "i really don't know",
    "totally lost",
    "completely confused",
  ];

  const isDefinitelyVague = definitelyVague.some((indicator) =>
    response.includes(indicator)
  );

  if (isDefinitelyVague) {
    return {
      is_actionable: false,
      confidence: "high",
      interpretation:
        "Student needs guided discovery to identify specific challenges",
      suggested_focus: `general ${profile.topic_struggles} practice with guided discovery`,
      reasoning:
        "Response indicates general confusion rather than specific struggle",
    };
  }

  // Check for any mathematical content or specific language
  const mathTerms = [
    "equation",
    "formula",
    "calculate",
    "solve",
    "find",
    "graph",
    "angle",
    "area",
    "volume",
    "derivative",
    "integral",
    "factor",
    "x",
    "y",
    "variable",
    "function",
    "theorem",
    "proof",
    "triangle",
    "square",
    "circle",
    "line",
    "slope",
    "intercept",
    "quadratic",
  ];

  const hasSpecificTerms = mathTerms.some((term) => response.includes(term));

  // Check for emotional indicators of struggle
  const struggleEmotions = [
    "hard",
    "difficult",
    "tricky",
    "challenging",
    "frustrating",
    "stuck",
    "can't",
    "won't",
    "doesn't work",
  ];

  const hasEmotionalContent = struggleEmotions.some((emotion) =>
    response.includes(emotion)
  );

  if (hasSpecificTerms || response.length > 25 || hasEmotionalContent) {
    return {
      is_actionable: true,
      confidence: "medium",
      interpretation: response,
      suggested_focus: `${profile.topic_struggles} with focus on: ${response}`,
      reasoning:
        "Contains specific mathematical language, emotional content, or sufficient detail",
    };
  }

  return {
    is_actionable: false,
    confidence: "medium",
    interpretation: "Insufficient specific information provided",
    suggested_focus: `guided ${profile.topic_struggles} exploration`,
    reasoning:
      "Response lacks specific mathematical challenges or detailed description",
  };
}

async function generateHeuristicInterpretedConfirmation(
  user,
  confirmationData,
  heuristicValidation
) {
  const profile = user.context.painpoint_profile;

  const content = `**Based on our conversation, I think I understand your challenge:**

**Subject:** ${profile.subject} Grade ${profile.grade}
**Topic:** ${profile.topic_struggles}
**My Interpretation:** "${heuristicValidation.interpretation}"

**Focus Area:** ${heuristicValidation.suggested_focus}

**Is this a good direction?** I'll create questions to help you with this challenge.

**Type 'yes' to continue, or tell me what I should focus on instead.**

📍 **Step 5/5:** Assisted Confirmation`;

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

async function offerAlternativePaths(user, heuristicValidation) {
  const profile = user.context.painpoint_profile;

  const content = `**I understand you're not sure about your specific challenges.**

That's totally normal! Let me help you discover them.

**Here are some options:**

**Option A:** I'll give you a simple ${profile.topic_struggles} question and we'll see where you get stuck

**Option B:** Let's try a different topic in ${profile.subject}

**Option C:** Switch to a different subject entirely

**Which sounds better? Type A, B, or C.**

📍 **Alternative Path Selection**`;

  const menu = generateEnhancedVisualMenu(
    AI_INTEL_STATES.ALTERNATIVE_PATHS,
    user.preferences.device_type
  );
  return formatResponseWithEnhancedSeparation(
    content,
    menu,
    user.preferences.device_type
  );
}

async function handleAlternativePathChoice(user, text, alternativeChoice) {
  const choice = alternativeChoice || text.toUpperCase().trim();
  const profile = user.context.painpoint_profile;

  console.log(`🛤️ Alternative path chosen: ${choice}`);

  switch (choice) {
    case "A":
      // Guided Discovery Mode
      return await startGuidedDiscovery(user);

    case "B":
      // Different Topic
      user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION;
      user.context.probing_attempts = 0;

      const content = `🔄 **Let's try a different ${profile.subject} topic!**

**Which topic would you like to explore instead?**

*(Algebra, Geometry, Trigonometry, Functions, Statistics, etc.)*`;

      const menu = generateEnhancedVisualMenu(
        AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION,
        user.preferences.device_type
      );
      return formatResponseWithEnhancedSeparation(
        content,
        menu,
        user.preferences.device_type
      );

    case "C":
      // Different Subject
      user.context.ai_intel_state = AI_INTEL_STATES.SUBJECT_GRADE;
      user.context.probing_attempts = 0;

      const subjectContent = `🔄 **Let's try a different subject!**

**What subject and grade would you like to work on?**

*(Example: "Grade 11 Physics" or "Life Sciences Grade 10")*`;

      const subjectMenu = generateEnhancedVisualMenu(
        AI_INTEL_STATES.SUBJECT_GRADE,
        user.preferences.device_type
      );
      return formatResponseWithEnhancedSeparation(
        subjectContent,
        subjectMenu,
        user.preferences.device_type
      );

    default:
      const defaultContent = `**Please choose A, B, or C:**

**A:** Guided discovery with questions
**B:** Different topic in ${profile.subject}
**C:** Different subject entirely`;

      const defaultMenu = generateEnhancedVisualMenu(
        AI_INTEL_STATES.ALTERNATIVE_PATHS,
        user.preferences.device_type
      );
      return formatResponseWithEnhancedSeparation(
        defaultContent,
        defaultMenu,
        user.preferences.device_type
      );
  }
}

// ===== NEW: GUIDED DISCOVERY MODE =====

async function startGuidedDiscovery(user) {
  const profile = user.context.painpoint_profile;

  console.log(
    `🔍 Starting guided discovery for: ${profile.subject} ${profile.topic_struggles}`
  );

  user.context.ai_intel_state = AI_INTEL_STATES.GUIDED_DISCOVERY;
  user.context.discovery_mode = true;

  const diagnosticQuestion = await getDiagnosticQuestion(profile);

  user.context.current_question = diagnosticQuestion;

  const content = `🔍 **Guided Discovery Mode**

Let's find your challenge together! Try this simple ${profile.topic_struggles} question:

📝 **Diagnostic Question:**
${diagnosticQuestion.questionText}

**Don't worry about getting it right** - just try your best and tell me where you get stuck.

**Type your attempt or where you're struggling.**`;

  const menu = generateEnhancedVisualMenu(
    AI_INTEL_STATES.GUIDED_DISCOVERY,
    user.preferences.device_type
  );
  return formatResponseWithEnhancedSeparation(
    content,
    menu,
    user.preferences.device_type
  );
}

async function getDiagnosticQuestion(profile) {
  const subject = profile.subject || "Mathematics";
  const topic = profile.topic_struggles?.toLowerCase() || "algebra";

  // Try to get from knowledge base first
  const subjectData = SUBJECT_PROBING_DATABASE[subject];
  if (subjectData) {
    for (const [key, topicData] of Object.entries(subjectData)) {
      if (topic.includes(key) && topicData.diagnostic_question) {
        console.log(`✅ Found diagnostic question for ${key}`);
        return topicData.diagnostic_question;
      }
    }
  }

  // Fallback diagnostic questions
  console.log(`🔄 Using fallback diagnostic for ${topic}`);
  return {
    questionText: `Solve for x: x + 3 = 8\n\nShow your working steps.`,
    solution: `**Step 1:** Subtract 3 from both sides\nx = 8 - 3\n\n**Step 2:** Calculate\nx = 5\n\n**Therefore:** x = 5`,
    purpose: "Basic equation solving",
  };
}

async function handleGuidedDiscoveryInteraction(user, text) {
  const lowerText = text.toLowerCase();

  // Analyze their response to identify specific struggles
  if (
    lowerText.includes("stuck") ||
    lowerText.includes("don't know") ||
    lowerText.includes("confused")
  ) {
    // They identified where they're stuck - this is their painpoint!
    user.context.painpoint_profile.specific_failure = text;
    user.context.painpoint_confirmed = true;
    user.context.ai_intel_state = AI_INTEL_STATES.AI_QUESTION_GENERATION;

    const content = `🎯 **Perfect! I found your challenge!**

**Your specific struggle:** "${text}"

Now I can create targeted questions to help you with exactly this!`;

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

  // They attempted the question - give feedback and continue discovery
  const content = `**Great attempt!** I see you tried: "${text}"

Let me show you the solution and then we'll try another question to pinpoint your challenge.

**Solution:**
${user.context.current_question?.solution || "Step-by-step solution provided"}

**Ready for another diagnostic question?**`;

  const menu = generateEnhancedVisualMenu(
    AI_INTEL_STATES.GUIDED_DISCOVERY,
    user.preferences.device_type
  );
  return formatResponseWithEnhancedSeparation(
    content,
    menu,
    user.preferences.device_type
  );
}

async function generateDynamicTargetedProbe(userResponse, profile, attempt) {
  const subject = profile.subject || "Mathematics";
  const topic = profile.topic_struggles?.toLowerCase() || "general";

  console.log(
    `🔄 Dynamic probing: ${subject} -> ${topic} (attempt ${attempt})`
  );

  const subjectData = SUBJECT_PROBING_DATABASE[subject];
  if (subjectData) {
    const topicData = subjectData[topic];
    if (topicData) {
      console.log(`✅ Found exact topic match: ${topic}`);
      return generateTopicSpecificProbe(topic, topicData, attempt);
    }

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
  }

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
    const realQuestion = await generateRealAIQuestion(profile);

    user.context.current_question = {
      questionText: realQuestion.questionText,
      solution: realQuestion.solution,
      explanation: realQuestion.explanation,
      targeted: true,
      painpoint_confirmed: true,
      dynamic_probing_used: true,
      ai_generated: true,
      heuristic_fix_applied: true,
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

    const fallbackQuestion = generateFallbackQuestion(profile);

    user.context.current_question = {
      questionText: fallbackQuestion.questionText,
      solution: fallbackQuestion.solution,
      targeted: true,
      painpoint_confirmed: true,
      fallback_used: true,
      heuristic_fix_applied: true,
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
    throw error;
  }
}
// ===== ENHANCED FALLBACK QUESTION GENERATOR =====

function generateFallbackQuestion(profile) {
  const subject = profile.subject || "Mathematics";
  const grade = profile.grade || "11";
  const topic = profile.topic_struggles || "algebra";
  const struggle = profile.specific_failure || "solving equations";

  console.log(
    `🔄 Generating fallback question for: ${subject} ${topic} - ${struggle}`
  );

  if (subject === "Mathematics") {
    if (topic.toLowerCase().includes("algebra")) {
      if (
        struggle.toLowerCase().includes("solve for x") ||
        struggle.toLowerCase().includes("cannot solve")
      ) {
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

**Therefore:** x = 6`,
        };
      }
    }

    if (topic.toLowerCase().includes("geometry")) {
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

**Therefore:** Area = 24 cm²`,
      };
    }
  }

  return {
    questionText: `**Grade ${grade} ${subject} Practice Question:**

Topic: ${topic}
Challenge: ${struggle}

**Solve this step by step.**`,
    solution: `**Step 1:** Identify what the question is asking

**Step 2:** Apply the appropriate method for ${topic}

**Step 3:** Show all working clearly

**Step 4:** Check your answer makes sense

**Therefore:** [Complete solution addressing ${struggle}]`,
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

  const content = `📚 **TARGETED SOLUTION**

**For your challenge:** *${profile.specific_failure}*

${question.solution}

**🎯 Strategy:** This solution specifically addresses your struggle with "${profile.specific_failure}"

**💡 Key Point:** Focus on understanding each step to overcome your specific challenge.`;

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
2️⃣ 📚 Homework Help 🫶 ⚡  
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
