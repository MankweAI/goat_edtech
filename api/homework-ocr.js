/**
 * GOAT Bot - Single Webhook Handler (Legacy Pattern Applied)
 * User: sophoniagoat
 * Updated: 2025-08-21 11:16:42 UTC
 * Pattern: Based on legacy index.js architecture
 */

// Simple user state management (replace with database in production)
const userStates = new Map();

// Command types for GOAT Bot
const GOAT_COMMANDS = {
  WELCOME: "welcome",
  EXAM_PREP: "exam_prep",
  HOMEWORK: "homework",
  MEMORY_HACKS: "memory_hacks",
  TEXT_INPUT: "text_input",
  MENU_CHOICE: "menu_choice",
};

// GOAT Bot messages
const GOAT_MESSAGES = {
  WELCOME: {
    MAIN_MENU:
      `Welcome to The GOAT. I'm here help you study with calm and clarity.\n\n` +
      `What do you need right now?\n\n` +
      `1️⃣ 📅 Exam/Test coming 😰\n` +
      `2️⃣ 📚 Homework Help 🫶\n` +
      `3️⃣ 🧮 Tips & Hacks\n\n` +
      `Just pick a number! ✨`,
  },
};

// Parse command based on user input and state (legacy pattern)
function parseGoatCommand(message, userContext) {
  const text = message.toLowerCase().trim();

  // Welcome/Menu commands
  if (
    !message ||
    text.includes("start") ||
    text.includes("menu") ||
    text.includes("hi")
  ) {
    return { type: GOAT_COMMANDS.WELCOME };
  }

  // Menu choices
  if (text === "1") {
    return { type: GOAT_COMMANDS.MENU_CHOICE, choice: 1, action: "exam_prep" };
  }
  if (text === "2") {
    return { type: GOAT_COMMANDS.MENU_CHOICE, choice: 2, action: "homework" };
  }
  if (text === "3") {
    return {
      type: GOAT_COMMANDS.MENU_CHOICE,
      choice: 3,
      action: "memory_hacks",
    };
  }

  // Context-based routing
  if (userContext.current_menu === "exam_prep") {
    return { type: GOAT_COMMANDS.EXAM_PREP, text: message };
  }
  if (userContext.current_menu === "homework") {
    return { type: GOAT_COMMANDS.HOMEWORK, text: message };
  }
  if (userContext.current_menu === "memory_hacks") {
    return { type: GOAT_COMMANDS.MEMORY_HACKS, text: message };
  }

  // Default: treat as homework problem
  return { type: GOAT_COMMANDS.HOMEWORK, text: message };
}

// Format response (legacy pattern)
function formatGoatResponse(message, metadata = {}) {
  return {
    message,
    status: "success",
    echo: message.split("\n")[0], // First line as echo
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    ...metadata,
  };
}

// Main webhook handler (legacy pattern applied)
module.exports = async (req, res) => {
  const start = Date.now();

  console.log("🐐 GOAT Bot v2.0 - Single Webhook Handler");

  if (req.method === "GET") {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      webhook: "GOAT Bot - Single Generic Endpoint",
      status: "Active",
      manychatUrl: "https://goat-edtech.vercel.app/api/homework-ocr",
      description: "Single webhook handles all menu routing internally",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST requests supported",
      allowed: ["POST"],
      elapsed_ms: Date.now() - start,
    });
  }

  const subscriberId =
    req.body.psid || req.body.subscriber_id || "default_user";
  const message = req.body.message || req.body.user_input || "";

  if (!subscriberId || !message) {
    return res.status(400).json({
      error: "Missing subscriber_id or message",
      subscriber_id: subscriberId,
      message: message,
      elapsed_ms: Date.now() - start,
    });
  }

  console.log(
    `📥 Message from ${subscriberId}: "${message.substring(0, 100)}"`
  );

  try {
    // Get or create user state (legacy pattern)
    let user = userStates.get(subscriberId) || {
      id: subscriberId,
      current_menu: "welcome",
      context: {},
      last_active: new Date().toISOString(),
    };

    console.log(`👤 User ${user.id} | Menu: ${user.current_menu}`);

    // Parse command (legacy pattern)
    const command = parseGoatCommand(message, {
      current_menu: user.current_menu,
      context: user.context,
    });

    console.log(`🎯 Command parsed: ${command.type}`, {
      action: command.action,
      choice: command.choice,
      text: command.text?.substring(0, 30),
    });

    let reply = "";

    // Route to handlers (legacy pattern)
    switch (command.type) {
      // ===== WELCOME MENU =====
      case GOAT_COMMANDS.WELCOME:
        reply = await showWelcomeMenu(user);
        break;

      // ===== MENU CHOICES =====
      case GOAT_COMMANDS.MENU_CHOICE:
        switch (command.choice) {
          case 1: // Exam/Test Prep
            reply = await startExamPrep(user);
            break;
          case 2: // Homework Help
            reply = await startHomework(user);
            break;
          case 3: // Memory Hacks
            reply = await startMemoryHacks(user);
            break;
          default:
            reply = await showWelcomeMenu(user);
        }
        break;

      // ===== EXAM PREP FLOW =====
      case GOAT_COMMANDS.EXAM_PREP:
        reply = await handleExamPrep(user, command.text);
        break;

      // ===== HOMEWORK FLOW =====
      case GOAT_COMMANDS.HOMEWORK:
        reply = await handleHomework(user, command.text);
        break;

      // ===== MEMORY HACKS FLOW =====
      case GOAT_COMMANDS.MEMORY_HACKS:
        reply = await handleMemoryHacks(user, command.text);
        break;

      default:
        console.warn(`⚠️ Unhandled command type: ${command.type}`);
        reply = await showWelcomeMenu(user);
        break;
    }

    // Update user state
    user.last_active = new Date().toISOString();
    userStates.set(subscriberId, user);

    console.log(`✅ Reply generated (${reply.length} chars)`);

    return res.status(200).json(
      formatGoatResponse(reply, {
        user_id: user.id,
        command_type: command.type,
        elapsed_ms: Date.now() - start,
      })
    );
  } catch (error) {
    console.error("❌ GOAT Bot error:", error);

    const errorReply =
      process.env.NODE_ENV === "development"
        ? `Error: ${error.message}`
        : 'Sorry, I encountered an error. Please try typing "menu" to restart! 🔄';

    return res.status(500).json({
      message: errorReply,
      status: "error",
      error: error.message,
      elapsed_ms: Date.now() - start,
      user: "sophoniagoat",
    });
  }
};

// ===== HANDLER FUNCTIONS (Legacy Pattern) =====

async function showWelcomeMenu(user) {
  console.log(`🏠 Showing welcome menu to user ${user.id}`);

  user.current_menu = "welcome";
  user.context = {};

  return GOAT_MESSAGES.WELCOME.MAIN_MENU;
}

async function startExamPrep(user) {
  user.current_menu = "exam_prep";
  user.context = { step: "initial" };

  return (
    `📅 **Exam/Test Prep Mode Activated!** 😰➡️😎\n\n` +
    `I'll help you prepare step by step:\n\n` +
    `📝 What subject is your exam/test in?\n` +
    `📚 What grade are you? (10, 11, or 12)\n` +
    `📖 Any specific topics you're worried about?\n\n` +
    `Example: "Grade 11 Mathematics - Trigonometry test next week"\n\n` +
    `Or type "menu" to go back! 🔙`
  );
}

async function startHomework(user) {
  user.current_menu = "homework";
  user.context = { step: "initial" };

  return (
    `📚 **Homework Helper Ready!** 🫶\n\n` +
    `I can help you solve any homework problem:\n\n` +
    `✍️ Type your question directly\n` +
    `📸 Upload a photo of your homework (coming soon)\n` +
    `📝 I'll give you step-by-step solutions\n` +
    `🎯 Plus extra practice problems!\n\n` +
    `Go ahead - paste your homework question here! 📝\n\n` +
    `Or type "menu" to go back! 🔙`
  );
}

async function startMemoryHacks(user) {
  user.current_menu = "memory_hacks";
  user.context = { step: "initial" };

  return (
    `🧮 **Tips & Hacks Vault!** ✨\n\n` +
    `Get SA-specific memory tricks and study hacks:\n\n` +
    `🧠 Memory aids using SA culture\n` +
    `🎵 Songs and rhymes in local languages\n` +
    `🏛️ Mnemonics with SA landmarks\n` +
    `📚 Subject-specific study techniques\n\n` +
    `What subject do you need memory hacks for?\n` +
    `Examples:\n` +
    `• "Mathematics algebra"\n` +
    `• "Physical Sciences chemistry"\n` +
    `• "Life Sciences cells"\n\n` +
    `Or type "menu" to go back! 🔙`
  );
}

async function handleExamPrep(user, text) {
  const gradeMatch = text.match(/grade\s*(\d+)/i);
  const grade = gradeMatch ? parseInt(gradeMatch[1]) : 10;

  let subject = "Mathematics";
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

  try {
    // Call existing mock exam API
    const examUrl = `https://goat-edtech.vercel.app/api/mock-exam?grade=${grade}&subject=${encodeURIComponent(
      subject
    )}&questionCount=1`;
    const examResponse = await fetch(examUrl);
    const examData = await examResponse.json();

    if (examData.mockExam && examData.mockExam.length > 0) {
      const question = examData.mockExam[0];

      user.context.question = question;

      return (
        `📝 **Mock ${examData.examType} - Grade ${grade} ${subject}**\n\n` +
        `**Question ${question.questionNumber}:** ${question.questionText}\n\n` +
        `Take your time to solve this! When ready:\n` +
        `• Type "solution" to see the answer\n` +
        `• Type "another" for a new question\n` +
        `• Type "menu" to return to main menu\n\n` +
        `Good luck! 💪`
      );
    }
  } catch (error) {
    console.error("Mock exam generation failed:", error);
  }

  return (
    `📅 I understand you need help with: "${text}"\n\n` +
    `Let me generate a practice question for you...\n\n` +
    `Please specify your grade (10, 11, or 12) and subject more clearly.\n` +
    `Example: "Grade 10 Mathematics algebra"\n\n` +
    `Or type "menu" to go back! 🔙`
  );
}

async function handleHomework(user, text) {
  if (text === "solution" && user.context.solution) {
    return user.context.solution;
  }

  try {
    // Call existing homework API
    const homeworkResponse = await fetch(
      "https://goat-edtech.vercel.app/api/homework-ocr",
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
      user.context.solution = homeworkData.homework.solution;

      let response = `📚 **Homework Solution** 🫶\n\n${homeworkData.homework.solution}`;

      if (
        homeworkData.similarProblems &&
        homeworkData.similarProblems.count > 0
      ) {
        response += `\n\n🎯 **Practice Problems:**\n`;
        homeworkData.similarProblems.problems.forEach((prob, index) => {
          response += `\n${index + 1}. ${prob.problem}`;
        });
        response += `\n\nType "solutions" to see practice problem answers! 📝`;
      }

      response += `\n\nNeed more help? Just send another homework question! 💪`;
      return response;
    }
  } catch (error) {
    console.error("Homework processing failed:", error);
  }

  return (
    `📚 I'm working on solving: "${text}"\n\n` +
    `Please make sure your question is clear and includes all necessary information.\n\n` +
    `Or type "menu" to go back! 🔙`
  );
}

async function handleMemoryHacks(user, text) {
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
    // Call existing memory hacks API
    const hacksResponse = await fetch(
      "https://goat-edtech.vercel.app/api/memory-hacks",
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

      return (
        `🧠 **${subject} Memory Hack** ✨\n\n` +
        `**${hack.title}**\n\n` +
        `💡 **Technique:** ${hack.content}\n\n` +
        `📖 **How to use:** ${hack.explanation}\n\n` +
        `🇿🇦 **SA Context:** ${hack.saContext}\n\n` +
        `Want more? Type another subject or "menu" to go back! 🔙`
      );
    }
  } catch (error) {
    console.error("Memory hack generation failed:", error);
  }

  return (
    `🧮 I'll help you with memory hacks for: "${text}"\n\n` +
    `Please be more specific about the subject and topic.\n` +
    `Examples:\n` +
    `• "Mathematics quadratic equations"\n` +
    `• "Physical Sciences periodic table"\n` +
    `• "Life Sciences photosynthesis"\n\n` +
    `Or type "menu" to go back! 🔙`
  );
}
