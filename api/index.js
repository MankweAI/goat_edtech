/**
 * GOAT Bot 2.0 - ENHANCED NAVIGATION + NUMBERED MENUS
 * User: sophoniagoat
 * Updated: 2025-08-21 13:53:20 UTC
 * IMPROVEMENTS: 4 numbered options, Switch Topics, visual enhancements
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
  AI_QUESTION_GENERATION: "ai_question_generation",
};

// ENHANCED MENU COMMANDS - 4 OPTIONS MAX
const MENU_COMMANDS = {
  // Text commands (backward compatibility)
  CONTINUE: "continue",
  QUESTION: "question",
  SOLUTION: "solution",
  SWITCH: "switch",
  MENU: "menu",
  NEXT: "next",
  // Numbered commands (new format)
  OPTION_1: "1",
  OPTION_2: "2",
  OPTION_3: "3",
  OPTION_4: "4",
};

// Enhanced command parser with numbered menu detection
function parseGoatCommand(message, userContext) {
  const text = message.toLowerCase().trim();

  // Check for numbered menu commands (1-4)
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

  // Check for main menu numbers (1-3)
  if (/^[123]$/.test(text) && userContext.current_menu === "welcome") {
    return {
      type: GOAT_COMMANDS.MENU_CHOICE,
      choice: parseInt(text),
      action:
        text === "1" ? "exam_prep" : text === "2" ? "homework" : "memory_hacks",
    };
  }

  // Check for text-based fixed menu commands (backward compatibility)
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
    case "welcome":
    default:
      if (
        text === "thank you" ||
        text === "thanks" ||
        text === "ok" ||
        text === "okay"
      ) {
        return { type: GOAT_COMMANDS.WELCOME };
      }
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

  console.log("🔥 GOAT Bot v2.0 - ENHANCED NAVIGATION + NUMBERED MENUS");

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
      webhook: "GOAT Bot - ENHANCED NAVIGATION SYSTEM",
      status: "Active",
      features: "4 numbered options, Switch Topics, visual enhancements",
      navigation: "1. Solution 2. Next Question 3. Switch Topics 4. Main Menu",
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
    preferences: { last_subject: null, last_grade: null },
    last_active: new Date().toISOString(),
  };

  console.log(
    `👤 User ${user.id} | Menu: ${user.current_menu} | AI State: ${
      user.context.ai_intel_state || "none"
    }`
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
    // ===== NUMBERED MENU COMMANDS (NEW) =====
    case GOAT_COMMANDS.NUMBERED_MENU_COMMAND:
      reply = await handleNumberedMenuCommand(user, command.option);
      break;

    // ===== FIXED MENU COMMANDS (BACKWARD COMPATIBILITY) =====
    case GOAT_COMMANDS.FIXED_MENU_COMMAND:
      reply = await handleFixedMenuCommand(user, command.command);
      break;

    // ===== STANDARD COMMANDS =====
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
      reply = await handleAIIntelligenceGathering(user, command.text);
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

  // Enhanced conversation tracking with preferences
  user.conversation_history.push({
    user_input: message,
    bot_response: reply.substring(0, 100),
    timestamp: new Date().toISOString(),
    command_type: command.type,
    ai_intel_state: user.context.ai_intel_state,
    menu_option_used: command.option || command.command || null,
  });

  if (user.conversation_history.length > 15) {
    user.conversation_history = user.conversation_history.slice(-15);
  }

  user.last_active = new Date().toISOString();
  userStates.set(subscriberId, user);

  console.log(
    `✅ Reply: ${reply.length} chars | State: ${
      user.context.ai_intel_state
    } | Option: ${command.option || command.command || "none"}`
  );

  return res.status(200).json(
    formatGoatResponse(reply, {
      user_id: user.id,
      command_type: command.type,
      current_menu: user.current_menu,
      ai_intel_state: user.context.ai_intel_state,
      enhanced_navigation: true,
      elapsed_ms: Date.now() - start,
    })
  );
}

// ===== ENHANCED NUMBERED MENU HANDLER =====

async function handleNumberedMenuCommand(user, option) {
  console.log(
    `🔢 Numbered menu option: ${option} | Context: ${user.context.ai_intel_state}`
  );

  const currentState = user.context.ai_intel_state;

  // Context-aware menu options
  switch (currentState) {
    case AI_INTEL_STATES.AI_QUESTION_GENERATION:
      // Menu after practice question delivery
      switch (option) {
        case 1:
          return await handleSolutionCommand(user); // 1. Solution
        case 2:
          return await handleNextCommand(user); // 2. Next Question
        case 3:
          return await handleSwitchTopicsCommand(user); // 3. Switch Topics
        case 4:
          return await showWelcomeMenu(user); // 4. Main Menu
        default:
          return getContextualMenuError(currentState);
      }

    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
    case AI_INTEL_STATES.AI_MICRO_TARGETING:
      // Menu during intelligence gathering
      switch (option) {
        case 1:
          return await handleContinueCommand(user); // 1. Continue
        case 2:
          return await handleQuestionCommand(user); // 2. Skip to Question
        case 3:
          return await handleSwitchTopicsCommand(user); // 3. Switch Topics
        case 4:
          return await showWelcomeMenu(user); // 4. Main Menu
        default:
          return getContextualMenuError(currentState);
      }

    default:
      // Fallback menu
      switch (option) {
        case 1:
          return await handleContinueCommand(user);
        case 2:
          return await handleQuestionCommand(user);
        case 3:
          return await handleSwitchTopicsCommand(user);
        case 4:
          return await showWelcomeMenu(user);
        default:
          return getGenericMenuError();
      }
  }
}

// ===== ENHANCED MENU OPTION HANDLERS =====

async function handleSolutionCommand(user) {
  if (user.context.current_question) {
    return await showAITargetedSolution(user);
  }
  return `No question active. 

${generateContextualMenu(user.context.ai_intel_state, "no_question")}`;
}

async function handleNextCommand(user) {
  const currentState = user.context.ai_intel_state;

  if (currentState === AI_INTEL_STATES.AI_QUESTION_GENERATION) {
    return await generateAITargetedQuestion(user);
  }

  return `Next step coming up!

${generateContextualMenu(currentState, "next_step")}`;
}

async function handleSwitchTopicsCommand(user) {
  // Save current preferences before switching
  if (user.context.painpoint_profile?.subject) {
    user.preferences.last_subject = user.context.painpoint_profile.subject;
  }
  if (user.context.painpoint_profile?.grade) {
    user.preferences.last_grade = user.context.painpoint_profile.grade;
  }

  // Reset to topic selection
  user.context = {};
  user.painpoint_profile = {};
  user.current_menu = "exam_prep_conversation";
  user.context.ai_intel_state = AI_INTEL_STATES.SUBJECT_GRADE;

  const smartDefault = user.preferences.last_subject
    ? `\n\n(Last time: ${user.preferences.last_subject} Grade ${
        user.preferences.last_grade || "10"
      })`
    : "";

  return `🔄 **Switching Topics!**

What subject and grade?${smartDefault}

${generateContextualMenu(AI_INTEL_STATES.SUBJECT_GRADE, "topic_switch")}`;
}

async function handleContinueCommand(user) {
  const currentState = user.context.ai_intel_state;

  if (currentState === AI_INTEL_STATES.AI_QUESTION_GENERATION) {
    return await generateAITargetedQuestion(user);
  }

  return `Let's continue exploring your ${
    user.context.painpoint_profile?.subject || "subject"
  } challenges.

What else is troubling you?`;
}

async function handleQuestionCommand(user) {
  const profile = user.context.painpoint_profile;

  if (!profile?.subject) {
    user.current_menu = "exam_prep_conversation";
    user.context.ai_intel_state = AI_INTEL_STATES.SUBJECT_GRADE;

    return `📝 **Quick Question Mode**

What subject and grade? (e.g., "Grade 11 Maths")

${generateContextualMenu(AI_INTEL_STATES.SUBJECT_GRADE, "quick_question")}`;
  }

  user.context.ai_intel_state = AI_INTEL_STATES.AI_QUESTION_GENERATION;
  return await generateAITargetedQuestion(user);
}

// ===== BACKWARD COMPATIBILITY HANDLER =====

async function handleFixedMenuCommand(user, command) {
  console.log(
    `🔧 Text command: ${command} | Context: ${user.context.ai_intel_state}`
  );

  switch (command) {
    case "solution":
      return await handleSolutionCommand(user);
    case "next":
      return await handleNextCommand(user);
    case "switch":
      return await handleSwitchTopicsCommand(user);
    case "continue":
      return await handleContinueCommand(user);
    case "question":
      return await handleQuestionCommand(user);
    case "menu":
      return await showWelcomeMenu(user);
    default:
      return `Try: 1, 2, 3, or 4`;
  }
}

// ===== CONTEXTUAL MENU GENERATION =====

function generateContextualMenu(aiState, context = "default") {
  switch (aiState) {
    case AI_INTEL_STATES.AI_QUESTION_GENERATION:
      return `📋 **Options:**
1️⃣ 📚 Solution
2️⃣ ➡️ Next Question  
3️⃣ 🔄 Switch Topics
4️⃣ 🏠 Main Menu`;

    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
    case AI_INTEL_STATES.AI_MICRO_TARGETING:
      return `📋 **Options:**
1️⃣ ➡️ Continue
2️⃣ 📝 Skip to Question
3️⃣ 🔄 Switch Topics  
4️⃣ 🏠 Main Menu`;

    case AI_INTEL_STATES.SUBJECT_GRADE:
      return `📋 **Options:**
1️⃣ ➡️ Continue Setup
2️⃣ 📝 Quick Question
3️⃣ 🔄 Different Subject
4️⃣ 🏠 Main Menu`;

    default:
      return `📋 **Options:**
1️⃣ ➡️ Continue
2️⃣ 📝 Practice Question
3️⃣ 🔄 Switch Topics
4️⃣ 🏠 Main Menu`;
  }
}

function getContextualMenuError(aiState) {
  return `Please choose 1, 2, 3, or 4:

${generateContextualMenu(aiState, "error")}`;
}

function getGenericMenuError() {
  return `Please choose an option (1-4):

📋 **Options:**
1️⃣ ➡️ Continue  
2️⃣ 📝 Practice Question
3️⃣ 🔄 Switch Topics
4️⃣ 🏠 Main Menu`;
}

// ===== PROGRESS INDICATORS =====

function getProgressIndicator(aiState) {
  switch (aiState) {
    case AI_INTEL_STATES.EXAM_OR_TEST:
      return "📍 Step 1/4: Assessment Type";
    case AI_INTEL_STATES.SUBJECT_GRADE:
      return "📍 Step 2/4: Subject & Grade";
    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
      return "📍 Step 3/4: Finding Struggles";
    case AI_INTEL_STATES.AI_MICRO_TARGETING:
      return "📍 Step 4/4: Precision Targeting";
    case AI_INTEL_STATES.AI_QUESTION_GENERATION:
      return "🎯 Practice Mode Active";
    default:
      return "";
  }
}

// ===== CORE HANDLER FUNCTIONS =====

async function showWelcomeMenu(user) {
  console.log(`🏠 Enhanced welcome menu for user ${user.id}`);

  user.current_menu = "welcome";
  user.context = {};
  user.painpoint_profile = {};

  const welcomeBack = user.preferences.last_subject
    ? `\n\n👋 Welcome back! Ready to continue with ${user.preferences.last_subject}?`
    : "";

  return `Welcome to The GOAT. I'm here help you study with calm and clarity.${welcomeBack}

What do you need right now?

1️⃣ 📅 Exam/Test coming 😰
2️⃣ 📚 Homework Help 🫶
3️⃣ 🧮 Tips & Hacks

Just pick a number! ✨`;
}

// ===== AI-POWERED INTELLIGENCE FUNCTIONS (ENHANCED) =====

async function startAIIntelligenceGathering(user) {
  console.log(`🤖 Starting enhanced AI intelligence for user ${user.id}`);

  user.current_menu = "exam_prep_conversation";
  user.context = {
    ai_intel_state: AI_INTEL_STATES.EXAM_OR_TEST,
    painpoint_profile: {},
  };

  return `📅 **Exam/Test Prep Mode Activated!** 😰➡️😎

${getProgressIndicator(AI_INTEL_STATES.EXAM_OR_TEST)}

Exam or test stress? I'll generate questions to unstuck you!

First - is this an EXAM or TEST? (Different question styles!)`;
}

async function handleAIIntelligenceGathering(user, text) {
  console.log(
    `🤖 Enhanced AI Intelligence: ${user.context.ai_intel_state} | Input: "${text}"`
  );

  const aiIntelState =
    user.context.ai_intel_state || AI_INTEL_STATES.EXAM_OR_TEST;

  // Initialize painpoint profile if missing
  if (!user.context.painpoint_profile) {
    user.context.painpoint_profile = {};
  }

  switch (aiIntelState) {
    // ===== ENHANCED EXAM OR TEST ANALYSIS =====
    case AI_INTEL_STATES.EXAM_OR_TEST:
      const examAnalysis = await analyzeExamTestResponseFixed(text);
      user.context.painpoint_profile.assessment_type =
        examAnalysis.assessment_type;
      user.context.ai_intel_state = AI_INTEL_STATES.SUBJECT_GRADE;

      console.log(`✅ Exam analysis: ${examAnalysis.assessment_type}`);

      return `Perfect! ${examAnalysis.assessment_type.toUpperCase()}s need focused prep.

${getProgressIndicator(AI_INTEL_STATES.SUBJECT_GRADE)}

What subject and grade?

(Example: "Grade 11 Maths" or "Physical Sciences Grade 10")`;

    // ===== ENHANCED SUBJECT/GRADE ANALYSIS =====
    case AI_INTEL_STATES.SUBJECT_GRADE:
      const subjectAnalysis = await analyzeSubjectGradeResponseFixed(text);
      user.context.painpoint_profile.subject = subjectAnalysis.subject;
      user.context.painpoint_profile.grade = subjectAnalysis.grade;
      user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION;

      // Save preferences
      user.preferences.last_subject = subjectAnalysis.subject;
      user.preferences.last_grade = subjectAnalysis.grade;

      console.log(
        `✅ Subject analysis: ${subjectAnalysis.subject} Grade ${subjectAnalysis.grade}`
      );

      return `Grade ${subjectAnalysis.grade} ${subjectAnalysis.subject} ${
        user.context.painpoint_profile.assessment_type
      }!

${getProgressIndicator(AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION)}

Which topics are nightmares?

(Be specific - Algebra? Geometry? Trigonometry?)

${generateContextualMenu(AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION)}`;

    // ===== ENHANCED PAINPOINT EXCAVATION =====
    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
      const painpointAnalysis = await analyzePainpointResponseFixed(
        text,
        user.context.painpoint_profile
      );
      user.context.painpoint_profile.topic_struggles = painpointAnalysis.topics;
      user.context.ai_intel_state = AI_INTEL_STATES.AI_MICRO_TARGETING;

      console.log(`✅ Painpoint analysis: ${painpointAnalysis.topics}`);

      const microQuestion = await generateMicroTargetingFixed(
        text,
        user.context.painpoint_profile
      );

      return `${microQuestion}

${getProgressIndicator(AI_INTEL_STATES.AI_MICRO_TARGETING)}

${generateContextualMenu(AI_INTEL_STATES.AI_MICRO_TARGETING)}`;

    // ===== ENHANCED MICRO TARGETING =====
    case AI_INTEL_STATES.AI_MICRO_TARGETING:
      const microAnalysis = await analyzeMicroTargetingFixed(
        text,
        user.context.painpoint_profile
      );
      user.context.painpoint_profile.specific_failure =
        microAnalysis.failure_mode;
      user.context.painpoint_profile.confidence_level =
        microAnalysis.confidence;
      user.context.ai_intel_state = AI_INTEL_STATES.AI_QUESTION_GENERATION;

      console.log(`✅ Micro analysis: ${microAnalysis.failure_mode}`);
      console.log(
        `🎯 ENHANCED PAINPOINT PROFILE COMPLETE:`,
        user.context.painpoint_profile
      );

      return await generateAITargetedQuestion(user);

    // ===== ENHANCED QUESTION INTERACTION =====
    case AI_INTEL_STATES.AI_QUESTION_GENERATION:
      return await handleAIQuestionInteractionFixed(user, text);

    default:
      console.warn(`⚠️ Unknown AI state: ${aiIntelState}`);
      return await showWelcomeMenu(user);
  }
}

// ===== KEEP EXISTING AI ANALYSIS FUNCTIONS =====

async function analyzeExamTestResponseFixed(userInput) {
  const text = userInput.toLowerCase();

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `User said: "${userInput}". Is this about an EXAM or TEST? Return just "exam" or "test".`,
        },
      ],
      max_tokens: 10,
      temperature: 0.1,
    });

    const aiResult = response.choices[0].message.content.toLowerCase().trim();
    if (aiResult.includes("exam")) return { assessment_type: "exam" };
    if (aiResult.includes("test")) return { assessment_type: "test" };
  } catch (error) {
    console.warn("AI analysis failed, using fallback:", error.message);
  }

  if (text.includes("exam")) return { assessment_type: "exam" };
  if (text.includes("test")) return { assessment_type: "test" };
  return { assessment_type: "test" };
}

async function analyzeSubjectGradeResponseFixed(userInput) {
  const text = userInput.toLowerCase();

  const gradeMatch = text.match(/grade\s*(\d+)/i) || text.match(/(\d+)/);
  const grade = gradeMatch ? gradeMatch[1] : "10";

  let subject = "Mathematics";
  if (text.includes("math")) subject = "Mathematics";
  if (text.includes("physics") || text.includes("physical"))
    subject = "Physical Sciences";
  if (text.includes("life") || text.includes("biology"))
    subject = "Life Sciences";
  if (text.includes("english")) subject = "English";
  if (text.includes("chemistry")) subject = "Chemistry";
  if (text.includes("history")) subject = "History";
  if (text.includes("geography")) subject = "Geography";

  console.log(`📊 Enhanced Subject/Grade: ${subject} Grade ${grade}`);
  return { subject, grade };
}

async function analyzePainpointResponseFixed(userInput, profile) {
  const topics = userInput.trim();
  console.log(`📊 Enhanced Painpoint: ${topics}`);
  return { topics };
}

async function generateMicroTargetingFixed(topicInput, profile) {
  const topic = topicInput.toLowerCase();

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Student struggles with ${topicInput} in ${profile.subject}. Ask 1 short specific question about where they get stuck. Max 25 words.`,
        },
      ],
      max_tokens: 40,
      temperature: 0.4,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.warn("AI micro-targeting failed, using fallback:", error.message);
  }

  if (profile.subject === "Mathematics") {
    if (topic.includes("factor")) {
      return `Factoring troubles! Where exactly? Recognizing patterns? Trinomials? Difference of squares?`;
    }
    if (topic.includes("algebra")) {
      return `Algebra struggles! What part? Solving equations? Simplifying? Word problems?`;
    }
    if (topic.includes("trig")) {
      return `Trigonometry issues! Which bit? Ratios? Equations? Graphs? Unit circle?`;
    }
  }

  return `${topicInput} troubles! Where exactly do you get stuck?`;
}

async function analyzeMicroTargetingFixed(userInput, profile) {
  const text = userInput.toLowerCase();

  let confidence = "medium";
  if (
    text.includes("no clue") ||
    text.includes("lost") ||
    text.includes("confused")
  ) {
    confidence = "beginner";
  } else if (text.includes("sometimes") || text.includes("almost")) {
    confidence = "advanced";
  }

  let failure_mode = "general_difficulty";
  if (text.includes("formula") || text.includes("method")) {
    failure_mode = "method_selection";
  } else if (text.includes("start") || text.includes("begin")) {
    failure_mode = "getting_started";
  } else if (text.includes("calculation") || text.includes("numbers")) {
    failure_mode = "calculation_errors";
  }

  console.log(`📊 Enhanced Micro: ${failure_mode}, confidence: ${confidence}`);
  return { failure_mode, confidence };
}

async function generateAITargetedQuestion(user) {
  const profile = user.context.painpoint_profile;

  console.log(`🎯 Enhanced question generation:`, profile);

  try {
    const apiUrl = `https://goat-edtech.vercel.app/api/index?endpoint=mock-exam&grade=${
      profile.grade
    }&subject=${encodeURIComponent(
      profile.subject
    )}&questionCount=1&topics=${encodeURIComponent(
      profile.topic_struggles
    )}&painpoint=${encodeURIComponent(
      profile.specific_failure || ""
    )}&confidence=${profile.confidence_level || "medium"}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    user.context.current_question = data.mockExam?.[0];

    return `🎯 **${profile.topic_struggles.toUpperCase()} PRACTICE**

${getProgressIndicator(AI_INTEL_STATES.AI_QUESTION_GENERATION)}

📝 **Question:**
${
  data.mockExam?.[0]?.questionText ||
  `Grade ${profile.grade} ${profile.subject} question on ${profile.topic_struggles}`
}

${generateContextualMenu(AI_INTEL_STATES.AI_QUESTION_GENERATION)}`;
  } catch (error) {
    console.error("Enhanced question generation failed:", error);

    user.context.current_question = {
      questionText: `Grade ${profile.grade} ${profile.subject} practice question on ${profile.topic_struggles}`,
      solution: "Step-by-step solution will be provided",
    };

    return `🎯 **${profile.topic_struggles.toUpperCase()} PRACTICE**

${getProgressIndicator(AI_INTEL_STATES.AI_QUESTION_GENERATION)}

📝 **Question:**
Grade ${profile.grade} ${profile.subject} practice question on ${
      profile.topic_struggles
    }

${generateContextualMenu(AI_INTEL_STATES.AI_QUESTION_GENERATION)}`;
  }
}

async function handleAIQuestionInteractionFixed(user, text) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("solution") || lowerText.includes("answer")) {
    return await showAITargetedSolution(user);
  }
  if (lowerText.includes("next") || lowerText.includes("another")) {
    return await generateAITargetedQuestion(user);
  }
  if (lowerText.includes("menu")) {
    return await showWelcomeMenu(user);
  }

  return `I see: "${text}"

${generateContextualMenu(AI_INTEL_STATES.AI_QUESTION_GENERATION)}`;
}

async function showAITargetedSolution(user) {
  const profile = user.context.painpoint_profile;
  const question = user.context.current_question;

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Solve this ${
            profile.subject
          } problem step-by-step for Grade ${
            profile.grade
          } student struggling with ${profile.topic_struggles}: ${
            question?.questionText || "practice problem"
          }. Keep solution concise but clear.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const solution = response.choices[0].message.content;

    return `📚 **SOLUTION**

${solution}

**🎯 Strategy:** Focus on ${profile.specific_failure || "your weak areas"}

${generateContextualMenu(AI_INTEL_STATES.AI_QUESTION_GENERATION)}`;
  } catch (error) {
    console.error("Enhanced solution generation failed:", error);

    return `📚 **SOLUTION**

Step-by-step solution for your ${profile.topic_struggles} practice question.

**🎯 Strategy:** Target ${profile.specific_failure || "method selection"}

${generateContextualMenu(AI_INTEL_STATES.AI_QUESTION_GENERATION)}`;
  }
}

// ===== HOMEWORK AND MEMORY HACKS (KEEP EXISTING WITH ENHANCEMENTS) =====

async function startHomeworkHelp(user) {
  user.current_menu = "homework_active";
  user.context = { step: "waiting_for_problem" };

  return `📚 **Homework Helper Ready!** 🫶

Type your homework question directly:

✍️ Math problems
📝 Science questions  
🎯 Any subject, any grade

Go ahead! 📝`;
}

async function handleHomeworkHelp(user, text) {
  console.log(`📝 Enhanced Homework: ${text.substring(0, 50)}`);

  try {
    const response = await fetch(
      "https://goat-edtech.vercel.app/api/index?endpoint=homework-ocr",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemText: text,
          grade: user.preferences.last_grade || 10,
          subject: user.preferences.last_subject || "Mathematics",
          similarCount: 1,
        }),
      }
    );

    const data = await response.json();

    return `📚 **Solution**

**Problem:** ${text}

**Answer:** ${data.homework?.solution || "Working on your solution..."}

📋 **Options:**
1️⃣ ➡️ Another Problem
2️⃣ 📝 Practice Questions
3️⃣ 🔄 Different Subject
4️⃣ 🏠 Main Menu`;
  } catch (error) {
    return `📚 Working on: "${text}"

Solution coming up...

📋 **Options:**
1️⃣ ➡️ Try Again
2️⃣ 📝 Different Problem  
3️⃣ 🔄 Switch Subject
4️⃣ 🏠 Main Menu`;
  }
}

async function startMemoryHacks(user) {
  user.current_menu = "memory_hacks_active";
  user.context = { step: "waiting_for_subject" };

  return `🧮 **Tips & Hacks Vault!** ✨

SA-specific memory tricks:

🧠 Local landmarks & culture
🎵 Language-based mnemonics  
📚 Subject shortcuts

What subject? (Math, Science, English, etc.)`;
}

async function handleMemoryHacksFlow(user, text) {
  console.log(`🧠 Enhanced Memory hacks: ${text.substring(0, 50)}`);

  let subject = "Mathematics";
  if (text.toLowerCase().includes("science")) subject = "Physical Sciences";
  if (text.toLowerCase().includes("english")) subject = "English";

  try {
    const response = await fetch(
      "https://goat-edtech.vercel.app/api/index?endpoint=memory-hacks",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject,
          topic: "general",
          grade: user.preferences.last_grade || 10,
          count: 1,
        }),
      }
    );

    const data = await response.json();
    const hack = data.memoryHacks?.hacks?.[0];

    return `🧠 **${subject} Memory Hack** ✨

**${hack?.title || "SA Memory Trick"}**

💡 ${
      hack?.content ||
      "Using local landmarks and culture to remember key concepts"
    }

📋 **Options:**
1️⃣ ➡️ More Hacks
2️⃣ 📝 Practice Questions
3️⃣ 🔄 Different Subject  
4️⃣ 🏠 Main Menu`;
  } catch (error) {
    return `🧠 Creating ${subject} memory hacks...

SA-specific tricks coming up!

📋 **Options:**
1️⃣ ➡️ Continue
2️⃣ 📝 Try Different Topic
3️⃣ 🔄 Switch Subject
4️⃣ 🏠 Main Menu`;
  }
}

// ===== KEEP ALL EXISTING API HANDLERS =====

async function handleMockExam(req, res, start) {
  const {
    grade = 10,
    subject = "Mathematics",
    questionCount = 1,
    topics = "general",
    painpoint = "",
    confidence = "medium",
  } = req.query;

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Generate 1 Grade ${grade} ${subject} practice question on ${topics}. 
${painpoint ? `Target student struggle: ${painpoint}` : ""}
Confidence level: ${confidence}
Make it CAPS-aligned and concise.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      mockExam: [
        {
          questionNumber: 1,
          questionText: content.substring(0, 200),
          solution: "Step-by-step solution provided on request",
          marksAllocated: 5,
        },
      ],
      metadata: {
        enhanced: true,
        navigation: "4 numbered options",
        tokensUsed: response.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Enhanced question generation failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

async function handleHomeworkOCR(req, res, start) {
  const { problemText, grade = 10, subject = "Mathematics" } = req.body;

  if (!problemText) {
    return res.status(400).json({
      error: "Missing homework problem",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Solve concisely: ${problemText}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      homework: {
        originalProblem: problemText,
        solution: response.choices[0].message.content,
        processed: "Enhanced AI solution with navigation",
      },
      metadata: {
        enhanced: true,
        navigation: "4 numbered options",
        tokensUsed: response.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Enhanced homework processing failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

async function handleMemoryHacks(req, res, start) {
  const { subject = "Mathematics", topic = "general", grade = 10 } = req.body;

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Create 1 short SA memory hack for Grade ${grade} ${subject}. Use local culture/landmarks. Max 50 words.`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      memoryHacks: {
        subject,
        grade: parseInt(grade),
        hacks: [
          {
            title: `${subject} Memory Trick`,
            content: response.choices[0].message.content,
            saContext: "South African cultural references",
          },
        ],
      },
      metadata: {
        enhanced: true,
        navigation: "4 numbered options",
        tokensUsed: response.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Enhanced memory hack generation failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

async function handleDatabaseTest(req, res, start) {
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    database: {
      status: "simulated - enhanced system",
      message: "Database with 4-option navigation and user preferences",
    },
  });
}

async function handleOpenAITest(req, res, start) {
  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Test enhanced GOAT navigation system" },
      ],
      max_tokens: 20,
    });

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      openai: {
        status: "ENHANCED NAVIGATION SYSTEM ACTIVE",
        model: "gpt-3.5-turbo",
        features: "4 numbered options, Switch Topics, progress indicators",
        test_response: response.choices[0].message.content,
        tokensUsed: response.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Enhanced OpenAI test failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
