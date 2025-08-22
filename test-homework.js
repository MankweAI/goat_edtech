/**
 * Local Test Script for Homework Help (Option 2)
 * User: sophoniagoat
 * Created: 2025-08-22 14:48:29 UTC
 */

const express = require("express");
const app = express();
app.use(express.json());

// Mock response object for testing
class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.response = null;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(data) {
    this.response = data;
    console.log("\n🎯 RESPONSE:", JSON.stringify(data, null, 2));
    return this;
  }
}

// Import your API functions
const mainHandler = require("./api/index.js");

async function testHomeworkFlow() {
  console.log("🧪 TESTING HOMEWORK HELP FLOW (Option 2)");
  console.log("=".repeat(50));

  // Test 1: Welcome Menu
  console.log("\n📋 TEST 1: Initial Welcome");
  const welcomeReq = {
    method: "POST",
    body: {
      psid: "test-user-123",
      message: "hi",
    },
    headers: { "user-agent": "test-browser" },
  };

  const welcomeRes = new MockResponse();
  await mainHandler(welcomeReq, welcomeRes);

  // Test 2: Select Option 2 (Homework Help)
  console.log("\n📋 TEST 2: Select Option 2 (Homework Help)");
  const homeworkReq = {
    method: "POST",
    body: {
      psid: "test-user-123",
      message: "2",
    },
    headers: { "user-agent": "test-browser" },
  };

  const homeworkRes = new MockResponse();
  await mainHandler(homeworkReq, homeworkRes);

  // Test 3: Send homework question
  console.log("\n📋 TEST 3: Send homework question");
  const questionReq = {
    method: "POST",
    body: {
      psid: "test-user-123",
      message: "solve for x: 2x + 5 = 15",
    },
    headers: { "user-agent": "test-browser" },
  };

  const questionRes = new MockResponse();
  await mainHandler(questionReq, questionRes);

  // Test 4: Direct homework API test
  console.log("\n📋 TEST 4: Direct homework API test");
  try {
    const homeworkAPI = require("./api/homework.js");
    const directReq = {
      method: "POST",
      body: {
        psid: "test-user-direct",
        message: "I need help with algebra",
      },
    };

    const directRes = new MockResponse();
    await homeworkAPI(directReq, directRes);
  } catch (error) {
    console.log("❌ Direct homework API error:", error.message);
  }

  console.log("\n✅ LOCAL TESTING COMPLETE");
}

// Run the test
if (require.main === module) {
  testHomeworkFlow().catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
}

module.exports = { testHomeworkFlow };
