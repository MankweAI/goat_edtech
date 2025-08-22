/**
 * Homework Help Unit Tests
 * Test individual components in isolation
 * User: sophoniagoat
 * Created: 2025-08-22 10:22:11 UTC
 */

// Test 1: OCR Processing
async function testOCRProcessing() {
  console.log("🧪 Testing OCR Processing...");

  // Test with mock image data
  const mockImageBuffer = Buffer.from("test-homework-image");
  const result = await homeworkOCR.processHomeworkImage(
    mockImageBuffer,
    "test-user",
    1
  );

  console.log("OCR Result:", {
    success: result.success,
    confidence: result.confidence,
    textLength: result.text?.length || 0,
  });

  return result.success;
}

// Test 2: Question Detection
async function testQuestionDetection() {
  console.log("🧪 Testing Question Detection...");

  const sampleHomework = `1. Solve for x: 2x + 3 = 11
2. Find the area of a triangle with base = 8cm and height = 6cm
3. Factor: x² + 5x + 6`;

  const questions = questionDetector.detectQuestions(sampleHomework, 0.9);

  console.log("Questions detected:", {
    count: questions.length,
    types: questions.map((q) => q.type),
    numbers: questions.map((q) => Object.keys(q.numbers)),
  });

  return questions.length === 3;
}

// Test 3: Hint Generation Speed
async function testHintGenerationSpeed() {
  console.log("🧪 Testing Hint Generation Speed...");

  const startTime = Date.now();

  const mockUser = {
    context: {
      selected_question: {
        type: "linear_equation",
        text: "Solve 2x + 3 = 11",
        numbers: {},
      },
      painpoint_analysis: { specific_struggle: "don't know how to isolate x" },
    },
  };

  const hint = await quickHintGenerator.generateQuickHint(mockUser);
  const duration = Date.now() - startTime;

  console.log("Hint generation:", {
    duration: duration + "ms",
    success: !!hint,
    source: hint?.source || "unknown",
  });

  return duration < 2000; // Should be under 2 seconds
}

// Test 4: Academic Integrity
async function testAcademicIntegrity() {
  console.log("🧪 Testing Academic Integrity...");

  const violatingHint = {
    hint: "The answer is x = 4",
    example: "2x + 3 = 11, so x = 4",
  };

  const validation = integrityValidator.validateHintIntegrity(violatingHint, {
    type: "linear_equation",
    text: "2x + 3 = 11",
  });

  console.log("Integrity validation:", {
    isValid: validation.isValid,
    violations: validation.violations?.length || 0,
    safeguardsApplied: validation.safeguardsApplied?.length || 0,
  });

  return !validation.isValid && validation.safeguardsApplied?.length > 0;
}

module.exports = {
  testOCRProcessing,
  testQuestionDetection,
  testHintGenerationSpeed,
  testAcademicIntegrity,
};

