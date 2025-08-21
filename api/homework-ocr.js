/**
 * GOAT Bot - Single Webhook with Internal Menu Routing
 * User: sophoniagoat
 * Updated: 2025-08-21 11:06:12 UTC
 */

// Simple in-memory user state storage (for demo - use database in production)
const userStates = new Map();

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const { method } = req;

    if (method === "GET") {
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        user: "sophoniagoat",
        webhook: "GOAT Bot - Single Generic Endpoint",
        status: "Active",
        manychatUrl: "https://goat-edtech.vercel.app/api/homework-ocr",
        description: "Single webhook handles all menu routing internally",
      });
    }

    if (method === "POST") {
      const { psid, message, user_input } = req.body;
      const userId = psid || "default_user";
      const userMessage = message || user_input || "";
      const messageText = userMessage.toLowerCase().trim();

      // Get or initialize user state
      let userState = userStates.get(userId) || { mode: "menu", context: {} };

      console.log(
        `GOAT Bot - User: ${userId}, Message: "${userMessage}", State: ${userState.mode}`
      );

      // === MAIN MENU STATE ===
      if (
        userState.mode === "menu" ||
        messageText.includes("menu") ||
        messageText.includes("start") ||
        messageText.includes("hi") ||
        messageText.includes("hello") ||
        !userMessage
      ) {
        userStates.set(userId, { mode: "menu", context: {} });

        return res.json({
          message:
            `Welcome to The GOAT. I'm here help you study with calm and clarity.\n\n` +
            `What do you need right now?\n\n` +
            `1️⃣ 📅 Exam/Test coming 😰\n` +
            `2️⃣ 📚 Homework Help 🫶\n` +
            `3️⃣ 🧮 Tips & Hacks\n\n` +
            `Just pick a number! ✨`,
          status: "success",
          echo: "Main menu displayed",
          timestamp: new Date().toISOString(),
          user: "sophoniagoat",
        });
      }

      // === OPTION 1: EXAM/TEST ROUTING ===
      else if (
        messageText === "1" ||
        (userState.mode === "exam" && !messageText.includes("menu"))
      ) {
        if (messageText === "1") {
          // First time selecting option 1
          userStates.set(userId, {
            mode: "exam",
            context: { step: "initial" },
          });

          return res.json({
            message:
              `📅 **Exam/Test Prep Mode Activated!** 😰➡️😎\n\n` +
              `I'll help you prepare step by step:\n\n` +
              `📝 What subject is your exam/test in?\n` +
              `📚 What grade are you? (10, 11, or 12)\n` +
              `📖 Any specific topics you're worried about?\n\n` +
              `Example: "Grade 11 Mathematics - Trigonometry test next week"\n\n` +
              `Or type "menu" to go back! 🔙`,
            status: "success",
            echo: "Exam prep mode activated",
            timestamp: new Date().toISOString(),
            user: "sophoniagoat",
          });
        } else {
          // User is providing exam details
          const gradeMatch = userMessage.match(/grade\s*(\d+)/i);
          const grade = gradeMatch ? parseInt(gradeMatch[1]) : 10;

          let subject = "Mathematics";
          if (
            messageText.includes("physics") ||
            messageText.includes("physical")
          )
            subject = "Physical Sciences";
          if (messageText.includes("life") || messageText.includes("biology"))
            subject = "Life Sciences";

          try {
            // Generate mock exam using existing API
            const examUrl = `https://goat-edtech.vercel.app/api/mock-exam?grade=${grade}&subject=${encodeURIComponent(
              subject
            )}&questionCount=1`;
            const examResponse = await fetch(examUrl);
            const examData = await examResponse.json();

            if (examData.mockExam && examData.mockExam.length > 0) {
              const question = examData.mockExam[0];

              userStates.set(userId, {
                mode: "exam",
                context: { question: question, examData: examData },
              });

              return res.json({
                message:
                  `📝 **Mock ${examData.examType} - Grade ${grade} ${subject}**\n\n` +
                  `**Question ${question.questionNumber}:** ${question.questionText}\n\n` +
                  `Take your time to solve this! When ready:\n` +
                  `• Type "solution" to see the answer\n` +
                  `• Type "another" for a new question\n` +
                  `• Type "menu" to return to main menu\n\n` +
                  `Good luck! 💪`,
                status: "success",
                echo: "Mock exam question generated",
                timestamp: new Date().toISOString(),
                user: "sophoniagoat",
              });
            }
          } catch (error) {
            console.error("Mock exam generation failed:", error);
          }

          return res.json({
            message:
              `📅 I understand you need help with: "${userMessage}"\n\n` +
              `Let me generate a practice question for you...\n\n` +
              `Please specify your grade (10, 11, or 12) and subject more clearly.\n` +
              `Example: "Grade 10 Mathematics algebra"\n\n` +
              `Or type "menu" to go back! 🔙`,
            status: "success",
            echo: "Exam prep clarification",
            timestamp: new Date().toISOString(),
            user: "sophoniagoat",
          });
        }
      }

      // === OPTION 3: TIPS & HACKS ROUTING ===
      else if (
        messageText === "3" ||
        (userState.mode === "hacks" && !messageText.includes("menu"))
      ) {
        if (messageText === "3") {
          // First time selecting option 3
          userStates.set(userId, {
            mode: "hacks",
            context: { step: "initial" },
          });

          return res.json({
            message:
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
              `Or type "menu" to go back! 🔙`,
            status: "success",
            echo: "Memory hacks mode activated",
            timestamp: new Date().toISOString(),
            user: "sophoniagoat",
          });
        } else {
          // User is requesting specific memory hacks
          let subject = "Mathematics";
          let topic = "general";

          if (
            messageText.includes("physics") ||
            messageText.includes("physical")
          )
            subject = "Physical Sciences";
          if (messageText.includes("life") || messageText.includes("biology"))
            subject = "Life Sciences";
          if (messageText.includes("algebra")) topic = "algebra";
          if (messageText.includes("chemistry")) topic = "chemistry";
          if (messageText.includes("cells")) topic = "cells";

          try {
            // Generate memory hacks using existing API
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

            if (
              hacksData.memoryHacks &&
              hacksData.memoryHacks.hacks.length > 0
            ) {
              const hack = hacksData.memoryHacks.hacks[0];

              return res.json({
                message:
                  `🧠 **${subject} Memory Hack** ✨\n\n` +
                  `**${hack.title}**\n\n` +
                  `💡 **Technique:** ${hack.content}\n\n` +
                  `📖 **How to use:** ${hack.explanation}\n\n` +
                  `🇿🇦 **SA Context:** ${hack.saContext}\n\n` +
                  `Want more? Type another subject or "menu" to go back! 🔙`,
                status: "success",
                echo: "Memory hack provided",
                timestamp: new Date().toISOString(),
                user: "sophoniagoat",
              });
            }
          } catch (error) {
            console.error("Memory hack generation failed:", error);
          }

          return res.json({
            message:
              `🧮 I'll help you with memory hacks for: "${userMessage}"\n\n` +
              `Please be more specific about the subject and topic.\n` +
              `Examples:\n` +
              `• "Mathematics quadratic equations"\n` +
              `• "Physical Sciences periodic table"\n` +
              `• "Life Sciences photosynthesis"\n\n` +
              `Or type "menu" to go back! 🔙`,
            status: "success",
            echo: "Memory hacks clarification",
            timestamp: new Date().toISOString(),
            user: "sophoniagoat",
          });
        }
      }

      // === OPTION 2: HOMEWORK HELP (DEFAULT) ===
      else {
        // Either user typed "2" or sent a homework problem directly
        if (messageText === "2") {
          userStates.set(userId, {
            mode: "homework",
            context: { step: "initial" },
          });

          return res.json({
            message:
              `📚 **Homework Helper Ready!** 🫶\n\n` +
              `I can help you solve any homework problem:\n\n` +
              `✍️ Type your question directly\n` +
              `📸 Upload a photo of your homework (coming soon)\n` +
              `📝 I'll give you step-by-step solutions\n` +
              `🎯 Plus extra practice problems!\n\n` +
              `Go ahead - paste your homework question here! 📝\n\n` +
              `Or type "menu" to go back! 🔙`,
            status: "success",
            echo: "Homework helper ready",
            timestamp: new Date().toISOString(),
            user: "sophoniagoat",
          });
        } else {
          // Process as homework problem
          userStates.set(userId, {
            mode: "homework",
            context: { processing: true },
          });

          try {
            // Generate solution using OpenAI
            const OpenAI = require("openai");
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const solutionPrompt = `Solve this homework problem for a South African Grade 10-12 student following CAPS curriculum:

Problem: "${userMessage}"

Provide:
1. Complete step-by-step solution using CAPS methodology
2. Final answer clearly stated
3. Brief explanation suitable for SA curriculum

Keep response concise but complete.`;

            const response = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: solutionPrompt }],
              max_tokens: 600,
              temperature: 0.3,
            });

            const solution = response.choices[0].message.content;

            // Store in database
            try {
              const { createClient } = require("@supabase/supabase-js");
              const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY
              );

              await supabase.from("content_storage").insert({
                type: "HOMEWORK",
                grade: 10,
                subject: "Mathematics",
                topic: "General",
                question_text: userMessage,
                solution_text: solution,
                metadata: {
                  tokensUsed: response.usage?.total_tokens || 0,
                  timestamp: new Date().toISOString(),
                },
              });
            } catch (dbError) {
              console.log(
                "Database storage failed (non-critical):",
                dbError.message
              );
            }

            return res.json({
              message:
                `📚 **Homework Solution** 🫶\n\n` +
                `**Problem:** ${userMessage}\n\n` +
                `**Solution:**\n${solution}\n\n` +
                `Need help with another problem? Just type it!\n` +
                `Or type "menu" to return to main menu! 🔙`,
              status: "success",
              echo: "Homework solution provided",
              timestamp: new Date().toISOString(),
              user: "sophoniagoat",
            });
          } catch (error) {
            console.error("Homework solution failed:", error);

            return res.json({
              message:
                `📚 I see you need help with: "${userMessage}"\n\n` +
                `I'm having trouble processing this right now. Please try:\n` +
                `• Rephrasing your question more clearly\n` +
                `• Breaking complex problems into smaller parts\n` +
                `• Typing "menu" to try other options\n\n` +
                `I'm here to help! 💪`,
              status: "success",
              echo: "Homework help attempted",
              timestamp: new Date().toISOString(),
              user: "sophoniagoat",
            });
          }
        }
      }
    } else {
      res.status(405).json({
        error: "Method not allowed",
        allowed: ["GET", "POST"],
      });
    }
  } catch (error) {
    console.error("GOAT Bot webhook error:", error);
    res.status(500).json({
      message:
        "Sorry, I encountered an error. Please try typing 'menu' to restart! 🔄",
      status: "error",
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
    });
  }
};
