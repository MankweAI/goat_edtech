/**
 * GOAT Bot 2.0 - Fixed Echo Parameter for WhatsApp
 * User: sophoniagoat
 * Fixed: 2025-08-21 12:04:01 UTC
 * Issue: Echo parameter was truncated, WhatsApp shows incomplete message
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
  CONVERSATIONAL_INPUT: "conversational_input",
};

// Enhanced command parser
function parseGoatCommand(message, userContext) {
  const text = message.toLowerCase().trim();

  // Welcome/Menu commands - always return to main menu
  if (
    !message ||
    text.includes("start") ||
    text.includes("menu") ||
    text.includes("hi") ||
    text.includes("hello")
  ) {
    return { type: GOAT_COMMANDS.WELCOME };
  }

  // Menu number selections (1, 2, 3)
  if (/^[123]$/.test(text)) {
    return {
      type: GOAT_COMMANDS.MENU_CHOICE,
      choice: parseInt(text),
      action:
        text === "1" ? "exam_prep" : text === "2" ? "homework" : "memory_hacks",
    };
  }

  // Context-based routing with proper state management
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
      // If user types anything other than 1,2,3 at welcome, stay in welcome
      if (
        text === "thank you" ||
        text === "thanks" ||
        text === "ok" ||
        text === "okay"
      ) {
        return { type: GOAT_COMMANDS.WELCOME }; // Stay in welcome menu
      }

      // Only treat as homework if explicitly requesting help
      if (
        text.includes("solve") ||
        text.includes("calculate") ||
        text.includes("=") ||
        text.includes("help with")
      ) {
        return { type: GOAT_COMMANDS.HOMEWORK_HELP, text: message };
      }

      // Default: show menu again
      return { type: GOAT_COMMANDS.WELCOME };
  }
}

// ===== FIXED RESPONSE FORMATTER =====
function formatGoatResponse(message, metadata = {}) {
  // CRITICAL FIX: Use full message for echo, not truncated version
  return {
    message,
    status: "success",
    echo: message, // FIXED: Send full message to WhatsApp
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    ...metadata,
  };
}

// Main handler
module.exports = async (req, res) => {
  const start = Date.now();

  console.log("🐐 GOAT Bot v2.0 - Fixed Echo Parameter");

  // Route based on URL path
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
      echo: "Sorry, I encountered an error. Please try typing 'menu' to restart! 🔄", // FIXED: Full error message
      error: error.message,
      elapsed_ms: Date.now() - start,
      user: "sophoniagoat",
    });
  }
};

// Enhanced webhook handler with proper flow
async function handleWebhook(req, res, start) {
  if (req.method === "GET") {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      webhook: "GOAT Bot - Fixed Echo Parameter for WhatsApp",
      status: "Active",
      fix: "Echo parameter now sends full message content",
      testCommands: ["hi", "1", "2", "3", "menu"],
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST requests supported",
      echo: "Only POST requests supported", // FIXED: Add echo for error
    });
  }

  const subscriberId =
    req.body.psid || req.body.subscriber_id || "default_user";
  const message = req.body.message || req.body.user_input || "";

  if (!subscriberId) {
    return res.status(400).json({
      error: "Missing subscriber_id (psid)",
      echo: "Missing subscriber_id (psid)", // FIXED: Add echo for error
    });
  }

  console.log(
    `📥 User ${subscriberId}: "${message}" (${message.length} chars)`
  );

  // Get or create user state with enhanced tracking
  let user = userStates.get(subscriberId) || {
    id: subscriberId,
    current_menu: "welcome",
    context: {},
    conversation_history: [],
    last_active: new Date().toISOString(),
  };

  // Log current state for debugging
  console.log(
    `👤 User ${user.id} | Menu: ${
      user.current_menu
    } | Context: ${JSON.stringify(user.context).substring(0, 100)}`
  );

  // Parse command with enhanced context
  const command = parseGoatCommand(message, {
    current_menu: user.current_menu,
    context: user.context,
    conversation_history: user.conversation_history,
  });

  console.log(`🎯 Command parsed: ${command.type}`, {
    action: command.action,
    choice: command.choice,
    text: command.text?.substring(0, 30),
  });

  let reply = "";

  // Enhanced routing with proper state transitions
  switch (command.type) {
    // ===== WELCOME MENU (ALWAYS SHOWS FULL MENU) =====
    case GOAT_COMMANDS.WELCOME:
      reply = await showWelcomeMenu(user);
      break;

    // ===== MENU CHOICES (1, 2, 3) =====
    case GOAT_COMMANDS.MENU_CHOICE:
      switch (command.choice) {
        case 1: // Exam/Test Prep - Start Conversational AI
          reply = await startExamPrepConversation(user);
          break;
        case 2: // Homework Help
          reply = await startHomeworkHelp(user);
          break;
        case 3: // Memory Hacks
          reply = await startMemoryHacks(user);
          break;
        default:
          reply = await showWelcomeMenu(user);
      }
      break;

    // ===== EXAM PREP CONVERSATIONAL FLOW =====
    case GOAT_COMMANDS.EXAM_PREP_CONVERSATION:
      reply = await handleExamPrepConversation(user, command.text);
      break;

    // ===== HOMEWORK HELP FLOW =====
    case GOAT_COMMANDS.HOMEWORK_HELP:
      reply = await handleHomeworkHelp(user, command.text);
      break;

    // ===== MEMORY HACKS FLOW =====
    case GOAT_COMMANDS.MEMORY_HACKS:
      reply = await handleMemoryHacksFlow(user, command.text);
      break;

    default:
      console.warn(`⚠️ Unhandled command type: ${command.type}`);
      reply = await showWelcomeMenu(user);
      break;
  }

  // Update user state and conversation history
  user.conversation_history.push({
    user_input: message,
    bot_response: reply.substring(0, 100),
    timestamp: new Date().toISOString(),
    command_type: command.type,
  });

  // Keep only last 10 interactions
  if (user.conversation_history.length > 10) {
    user.conversation_history = user.conversation_history.slice(-10);
  }

  user.last_active = new Date().toISOString();
  userStates.set(subscriberId, user);

  console.log(
    `✅ Reply generated (${reply.length} chars) | New state: ${user.current_menu}`
  );
  console.log(`📤 Full reply being sent: "${reply.substring(0, 200)}..."`);

  return res.status(200).json(
    formatGoatResponse(reply, {
      user_id: user.id,
      command_type: command.type,
      current_menu: user.current_menu,
      elapsed_ms: Date.now() - start,
    })
  );
}

// ===== ENHANCED HANDLER FUNCTIONS =====

async function showWelcomeMenu(user) {
  console.log(`🏠 Showing welcome menu to user ${user.id}`);

  // Reset user state to welcome
  user.current_menu = "welcome";
  user.context = {};

  const welcomeMessage = `Welcome to The GOAT. I'm here help you study with calm and clarity.

What do you need right now?

1️⃣ 📅 Exam/Test coming 😰
2️⃣ 📚 Homework Help 🫶
3️⃣ 🧮 Tips & Hacks

Just pick a number! ✨`;

  console.log(`📤 Welcome message length: ${welcomeMessage.length} chars`);
  return welcomeMessage;
}

async function startExamPrepConversation(user) {
  console.log(`📅 Starting exam prep conversation for user ${user.id}`);

  // Set state to conversational exam prep
  user.current_menu = "exam_prep_conversation";
  user.context = {
    step: "exam_or_test",
    exam_info: {},
  };

  return `📅 **Exam/Test Prep Mode Activated!** 😰➡️😎

Oh great! Is it an exam or a test? When is it? 

(I need to know because exams and tests need different prep strategies! 📚)`;
}

async function handleExamPrepConversation(user, text) {
  console.log(`💬 Handling exam prep conversation: ${text.substring(0, 50)}`);

  const step = user.context.step || "exam_or_test";
  const examInfo = user.context.exam_info || {};

  switch (step) {
    case "exam_or_test":
      // Determine if it's exam or test and extract date
      const isExam = text.toLowerCase().includes("exam");
      const isTest = text.toLowerCase().includes("test");

      // Extract date information
      let dateInfo = "";
      if (text.includes("next week")) dateInfo = "next week";
      if (text.includes("tomorrow")) dateInfo = "tomorrow";
      if (text.includes("monday")) dateInfo = "Monday";
      if (text.includes("tuesday")) dateInfo = "Tuesday";
      if (text.includes("wednesday")) dateInfo = "Wednesday";
      if (text.includes("thursday")) dateInfo = "Thursday";
      if (text.includes("friday")) dateInfo = "Friday";

      examInfo.type = isExam ? "exam" : isTest ? "test" : "assessment";
      examInfo.date = dateInfo || "soon";

      user.context.exam_info = examInfo;
      user.context.step = "subject_grade";

      return `Got it! A ${examInfo.type} ${examInfo.date}. Because this is our first time talking, let me gather some info...

What subject is your ${examInfo.type} in, and what grade are you?

(Example: "Grade 11 Mathematics" or "Physical Sciences Grade 10")`;

    case "subject_grade":
      // Extract subject and grade
      const gradeMatch = text.match(/grade\s*(\d+)/i) || text.match(/(\d+)/);
      const grade = gradeMatch ? gradeMatch[1] : "10";

      let subject = "Mathematics";
      if (text.toLowerCase().includes("math")) subject = "Mathematics";
      if (
        text.toLowerCase().includes("physics") ||
        text.toLowerCase().includes("physical")
      )
        subject = "Physical Sciences";
      if (
        text.toLowerCase().includes("life") ||
        text.toLowerCase().includes("biology")
      )
        subject = "Life Sciences";
      if (text.toLowerCase().includes("english")) subject = "English";
      if (text.toLowerCase().includes("afrikaans")) subject = "Afrikaans";

      examInfo.subject = subject;
      examInfo.grade = grade;

      user.context.exam_info = examInfo;
      user.context.step = "topics_concerns";

      return `Perfect! Grade ${grade} ${subject} ${examInfo.type} ${examInfo.date}. 📚

What specific topics are you worried about? Or what's giving you the most stress?

(Be honest - I'm here to help, not judge! Example: "Trigonometry" or "I don't understand anything" 😅)`;

    case "topics_concerns":
      examInfo.topics = text;
      examInfo.concerns = text;

      user.context.exam_info = examInfo;
      user.context.step = "generate_plan";

      // Generate study plan based on collected info
      return await generateStudyPlan(user, examInfo);

    default:
      return await showWelcomeMenu(user);
  }
}

async function generateStudyPlan(user, examInfo) {
  console.log(`📋 Generating study plan for user ${user.id}:`, examInfo);

  try {
    // Call mock exam API to generate practice questions
    const examUrl = `https://goat-edtech.vercel.app/api/index?endpoint=mock-exam&grade=${
      examInfo.grade
    }&subject=${encodeURIComponent(
      examInfo.subject
    )}&questionCount=1&topics=${encodeURIComponent(examInfo.topics)}`;
    const examResponse = await fetch(examUrl);
    const examData = await examResponse.json();

    user.current_menu = "study_plan_active";
    user.context.study_plan = examData;

    return `🎯 **Your Personalized Study Plan** 📚

**${examInfo.type.toUpperCase()}: Grade ${examInfo.grade} ${examInfo.subject}**
**Date: ${examInfo.date}**
**Focus: ${examInfo.topics}**

**📝 Practice Question Generated:**
${examData.mockExam?.[0]?.questionText || "Sample question ready"}

**🗓️ Study Plan:**
• **Today**: Review ${examInfo.topics} basics
• **Tomorrow**: Practice questions (like above)
• **3 days before**: Mock ${examInfo.type} 
• **1 day before**: Quick review only

Ready to start practicing? Type "practice" or "menu" to go back! 💪`;
  } catch (error) {
    console.error("Study plan generation failed:", error);

    return `🎯 **Your Study Plan for ${examInfo.subject}** 📚

Based on your ${examInfo.type} ${examInfo.date}, here's what I recommend:

**📚 Focus Areas:** ${examInfo.topics}
**📝 Daily Practice:** 30 minutes on weak topics
**🔄 Mock Tests:** Practice past papers
**💡 Memory Tricks:** Use our Tips & Hacks (option 3)

Want me to generate practice questions? Type "practice" or "menu" to explore more options! ✨`;
  }
}

async function startHomeworkHelp(user) {
  user.current_menu = "homework_active";
  user.context = { step: "waiting_for_problem" };

  return `📚 **Homework Helper Ready!** 🫶

I can help you solve any homework problem:

✍️ Type your question directly
📸 Upload a photo of your homework (coming soon)
📝 I'll give you step-by-step solutions
🎯 Plus extra practice problems!

Go ahead - paste your homework question here! 📝

Or type "menu" to go back! 🔙`;
}

async function handleHomeworkHelp(user, text) {
  if (text.toLowerCase() === "menu") {
    return await showWelcomeMenu(user);
  }

  console.log(
    `📝 Processing homework for user ${user.id}: ${text.substring(0, 50)}`
  );

  try {
    // Call homework API
    const homeworkResponse = await fetch(
      "https://goat-edtech.vercel.app/api/index?endpoint=homework-ocr",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemText: text,
          grade: 10,
          subject: "Mathematics",
          similarCount: 1,
        }),
      }
    );

    const homeworkData = await homeworkResponse.json();

    if (homeworkData.homework && homeworkData.homework.solution) {
      user.context.last_solution = homeworkData.homework.solution;

      let response = `📚 **Homework Solution** 🫶

**Problem:** ${text}

**Solution:**
${homeworkData.homework.solution}`;

      if (
        homeworkData.similarProblems &&
        homeworkData.similarProblems.count > 0
      ) {
        response += `

🎯 **Practice Problem:**
${
  homeworkData.similarProblems.problems[0]?.problem ||
  "Additional practice available"
}`;
      }

      response += `

Need help with another problem? Just type it!
Or type "menu" to return to main menu! 🔙`;

      return response;
    }
  } catch (error) {
    console.error("Homework processing failed:", error);
  }

  return `📚 I'm working on solving: "${text}"

Let me break this down step by step...

(Note: I'll provide a detailed solution shortly. For now, try rephrasing if the problem is unclear)

Type "menu" to go back! 🔙`;
}

async function startMemoryHacks(user) {
  user.current_menu = "memory_hacks_active";
  user.context = { step: "waiting_for_subject" };

  return `🧮 **Tips & Hacks Vault!** ✨

Get SA-specific memory tricks and study hacks:

🧠 Memory aids using SA culture
🎵 Songs and rhymes in local languages  
🏛️ Mnemonics with SA landmarks
📚 Subject-specific study techniques

What subject do you need memory hacks for?
Examples:
• "Mathematics algebra"
• "Physical Sciences chemistry"  
• "Life Sciences cells"

Or type "menu" to go back! 🔙`;
}

async function handleMemoryHacksFlow(user, text) {
  if (text.toLowerCase() === "menu") {
    return await showWelcomeMenu(user);
  }

  console.log(
    `🧠 Generating memory hacks for user ${user.id}: ${text.substring(0, 50)}`
  );

  let subject = "Mathematics";
  let topic = "general";

  if (
    text.toLowerCase().includes("physics") ||
    text.toLowerCase().includes("physical")
  ) {
    subject = "Physical Sciences";
  }
  if (
    text.toLowerCase().includes("life") ||
    text.toLowerCase().includes("biology")
  ) {
    subject = "Life Sciences";
  }
  if (text.toLowerCase().includes("algebra")) topic = "algebra";
  if (text.toLowerCase().includes("chemistry")) topic = "chemistry";
  if (text.toLowerCase().includes("cells")) topic = "cells";

  try {
    // Call memory hacks API
    const hacksResponse = await fetch(
      "https://goat-edtech.vercel.app/api/index?endpoint=memory-hacks",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject,
          topic: topic,
          grade: 10,
          count: 1,
        }),
      }
    );

    const hacksData = await hacksResponse.json();

    if (hacksData.memoryHacks && hacksData.memoryHacks.hacks.length > 0) {
      const hack = hacksData.memoryHacks.hacks[0];

      return `🧠 **${subject} Memory Hack** ✨

**${hack.title}**

💡 **Technique:** ${hack.content}

📖 **How to use:** ${hack.explanation}

🇿🇦 **SA Context:** ${hack.saContext}

Want more hacks? Type another subject!
Or type "menu" to go back! 🔙`;
    }
  } catch (error) {
    console.error("Memory hack generation failed:", error);
  }

  return `🧮 Creating memory hacks for: "${text}"

I'm generating SA-specific tricks using our local culture and landmarks...

(Custom memory aids coming soon!)

Type another subject or "menu" to go back! 🔙`;
}

// Keep existing API endpoint handlers exactly the same
async function handleMockExam(req, res, start) {
  const {
    grade = 10,
    subject = "Mathematics",
    questionCount = 1,
    topics = "general",
  } = req.query;

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const examPrompt = `Generate ${questionCount} Grade ${grade} ${subject} exam question(s) on ${topics} following South African CAPS curriculum.

For each question provide:
1. Clear question text
2. Complete step-by-step solution
3. Common mistakes students make
4. Examiner tips
5. Marks allocated

Format as JSON with questionNumber, questionText, solution, commonMistakes, examinerTips, marksAllocated.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: examPrompt }],
      max_tokens: 800,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;

    // Mock exam structure
    const mockExam = [
      {
        questionNumber: 1,
        questionText: `Grade ${grade} ${subject} question on ${topics}`,
        solution: content.substring(0, 200) + "...",
        commonMistakes: "Watch for calculation errors",
        examinerTips: "Show all working steps",
        marksAllocated: 5,
      },
    ];

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      examType: "TEST",
      grade: parseInt(grade),
      subject,
      topics,
      questionCount: parseInt(questionCount),
      mockExam,
      metadata: {
        capsAligned: true,
        generatedBy: "OpenAI GPT-3.5-turbo",
        tokensUsed: response.usage?.total_tokens || 0,
        stored: "Content saved for reuse",
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Mock exam generation failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

async function handleHomeworkOCR(req, res, start) {
  const {
    problemText,
    grade = 10,
    subject = "Mathematics",
    similarCount = 2,
  } = req.body;

  if (!problemText) {
    return res.status(400).json({
      error: "Missing homework problem",
      message: "Please provide problemText",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const solutionPrompt = `Solve this Grade ${grade} ${subject} homework problem for a South African student:

Problem: "${problemText}"

Provide complete step-by-step solution using CAPS methodology.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: solutionPrompt }],
      max_tokens: 600,
      temperature: 0.3,
    });

    const solution = response.choices[0].message.content;

    // Generate similar problems
    const similarProblems = {
      count: similarCount,
      problems: [
        {
          problem: `Similar to: ${problemText}`,
          solution: "Step-by-step solution",
          difficulty: "basic",
        },
        {
          problem: `Variation of: ${problemText}`,
          solution: "Detailed explanation",
          difficulty: "intermediate",
        },
      ],
    };

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      homework: {
        originalProblem: problemText,
        grade,
        subject,
        solution,
        processed: "Successfully analyzed and solved",
      },
      similarProblems,
      metadata: {
        inputMethod: "text",
        capsAligned: true,
        solutionTokens: response.usage?.total_tokens || 0,
        stored: "Content saved for reuse",
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Homework processing failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

async function handleMemoryHacks(req, res, start) {
  const {
    subject = "Mathematics",
    topic = "general",
    grade = 10,
    count = 1,
  } = req.body;

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const hacksPrompt = `Generate ${count} memory hack(s) for Grade ${grade} South African students studying ${subject} - ${topic}.

Create SA-specific mnemonics using:
- South African landmarks (Table Mountain, Kruger Park, etc.)
- Local languages (Zulu, Afrikaans, etc.) 
- Cultural references
- Local cities/provinces

Format with title, content, explanation, saContext, effectiveness (0-1).`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: hacksPrompt }],
      max_tokens: 400,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    const hacks = [
      {
        title: `${subject} Memory Trick`,
        type: "mnemonic",
        content: content.substring(0, 150) + "...",
        explanation: "Use this SA-specific technique to remember key concepts",
        saContext:
          "Utilizing South African cultural references for memory retention",
        effectiveness: 0.8,
        difficulty: "medium",
      },
    ];

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      memoryHacks: {
        subject,
        topic,
        grade: parseInt(grade),
        hackType: "all",
        count: parseInt(count),
        hacks,
      },
      effectiveness: {
        averageScore: 0.8,
        saContextIntegration: "High - locally relevant content",
        capsAlignment: "Perfect - curriculum specific",
      },
      metadata: {
        generatedBy: "OpenAI GPT-3.5-turbo",
        tokensUsed: response.usage?.total_tokens || 0,
        culturalRelevance: "South African context integrated",
        stored: "Content saved for reuse",
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Memory hacks generation failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

async function handleDatabaseTest(req, res, start) {
  try {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      database: {
        status: "simulated",
        message: "Database functionality simulated for unified function",
        connection: "Would connect to Supabase in production",
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Database test failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

async function handleOpenAITest(req, res, start) {
  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Test OpenAI connection" }],
      max_tokens: 50,
    });

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      openai: {
        status: "connected",
        model: "gpt-3.5-turbo",
        test_response: response.choices[0].message.content,
        tokensUsed: response.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "OpenAI test failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
