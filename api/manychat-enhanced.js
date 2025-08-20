/**
 * Enhanced ManyChat Integration
 * GOAT Bot 2.0 - SA Student Companion
 * User: sophoniagoat
 * Created: 2025-08-20 19:35:21 UTC
 */

module.exports = async (req, res) => {
  try {
    const { psid, message, custom_fields } = req.body;

    // Route to appropriate feature based on user selection
    const userChoice = message?.toLowerCase() || "";

    if (
      userChoice.includes("1") ||
      userChoice.includes("mock") ||
      userChoice.includes("exam")
    ) {
      // Route to Mock Exams
      return handleMockExamFlow(psid, message, res);
    } else if (userChoice.includes("2") || userChoice.includes("homework")) {
      // Route to Homework OCR
      return handleHomeworkFlow(psid, message, res);
    } else if (
      userChoice.includes("3") ||
      userChoice.includes("memory") ||
      userChoice.includes("hack")
    ) {
      // Route to Memory Hacks
      return handleMemoryHackFlow(psid, message, res);
    } else {
      // Main menu
      return showMainMenu(res);
    }
  } catch (error) {
    res.status(500).json({
      message: "Sorry, I encountered an error. Please try again.",
      status: "error",
    });
  }
};

function showMainMenu(res) {
  res.json({
    message:
      "🇿🇦 Welcome to GOAT Bot - Your SA Student Companion! 📚\n\nChoose what you need help with:\n\n1️⃣ Mock Exams - Practice tests for your upcoming exams\n2️⃣ Homework Help - Upload or type your homework questions\n3️⃣ Memory Hacks - Learn with SA-specific mnemonics\n\nJust type 1, 2, or 3 to get started!",
    status: "success",
  });
}

async function handleMockExamFlow(psid, message, res) {
  // Integration with existing mock-exam endpoint
  // Parse user requirements and generate appropriate exam
}

async function handleHomeworkFlow(psid, message, res) {
  // Integration with existing homework-ocr endpoint
  // Handle both text and image inputs
}

async function handleMemoryHackFlow(psid, message, res) {
  // Integration with existing memory-hacks endpoint
  // Interactive subject/topic selection
}

