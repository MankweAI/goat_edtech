/**
 * Homework Answering Engine (Conversational)
 * GOAT Bot 2.0
 * Updated: 2025-08-24 12:45:00 UTC
 * Developer: DithetoMokgabudi
 */

const OpenAI = require("openai");
const { questionDetector } = require("../../utils/question-detector");

// Initialize OpenAI (optional)
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("🧠 OpenAI initialized for homework answering");
  } else {
    console.log("⚠️ No OpenAI key; using fallback answering");
  }
} catch (e) {
  console.error("❌ OpenAI init failed for answering:", e);
  openai = null;
}

// Basic solver: ax + b = c
function trySolveLinearEquation(text) {
  // Normalize: remove spaces around operators for easier parsing
  const t = text.replace(/\s+/g, "");
  // Match patterns like 2x-3=7 or -x+5=2 etc.
  const m = t.match(/^([+\-]?\d*)x([+\-]\d+)?=([+\-]?\d+)$/i);
  if (!m) return null;

  // a: coefficient of x
  let aStr = m[1];
  if (aStr === "" || aStr === "+") aStr = "1";
  if (aStr === "-") aStr = "-1";
  const a = parseFloat(aStr);

  // b: constant on left
  const b = m[2] ? parseFloat(m[2]) : 0;

  // c: right-hand side
  const c = parseFloat(m[3]);

  if (!isFinite(a) || !isFinite(b) || !isFinite(c) || a === 0) return null;

  const x = (c - b) / a;
  return {
    a,
    b,
    c,
    x,
    steps: [
      `Move constants: ${a}x ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`} = ${c}`,
      `${a}x = ${c} ${b >= 0 ? `- ${b}` : `+ ${Math.abs(b)}`} = ${c - b}`,
      `x = (${c - b}) ÷ ${a} = ${x}`,
    ],
  };
}

// Fallback content generators for common classes
function fallbackAnswerForClassification(classification, text) {
  const lower = text.toLowerCase();

  if (
    classification === "calculus_derivative" ||
    lower.includes("derivative")
  ) {
    return `📘 Derivatives (d/dx) measure how fast a function changes.

• Definition: The derivative of f(x) at x is the instantaneous rate of change (slope of the tangent).
• Notation: f'(x) = d/dx [f(x)]
• Rules:
  - d/dx [c] = 0
  - d/dx [x^n] = n·x^(n−1)
  - d/dx [a·f(x)] = a·f'(x)
  - d/dx [f+g] = f' + g'
• Example: d/dx [x^3] = 3x^2

Would you like a practice problem or another example?`;
  }

  if (classification === "biology_concept") {
    return `📘 Explanation:
I'll break it down simply and give you one example.

• Concept: ${text}
• In simple terms: This is a key idea in Life Sciences that explains how living systems work.
• Example: [Use your textbook's closest example and match the definition]
• Why it matters: It links to processes like energy flow, growth, or adaptation.

Want a more precise definition from your topic or a diagram-based explanation?`;
  }

  if (classification === "definition" || lower.startsWith("what is")) {
    return `📘 Quick definition:
${text}
• Meaning: A clear, concise definition of this concept depends on your subject/topic.
• Tip: Identify where it’s used (formula, diagram, real-life example).
• Example: If you share the textbook line or context, I can tailor this precisely.

Want me to define it specifically for Math, Science, or another subject?`;
  }

  // Math linear equation handling
  if (classification === "linear_equation") {
    const solved = trySolveLinearEquation(lower);
    if (solved) {
      return `🧮 Solve for x: ${text}

**Step 1:** Move constants to the other side
${solved.steps[0]}

**Step 2:** Simplify to isolate ax
${solved.steps[1]}

**Step 3:** Divide by coefficient a
${solved.steps[2]}

✅ Therefore: x = ${solved.x}

Want a similar practice question or an explanation of each step?`;
    }

    return `🧮 Linear equations strategy:
• Move numbers to the right, variables (x) to the left
• Do the same operation to both sides
• Isolate x step by step

Example:
2x − 3 = 7 → 2x = 10 → x = 5

Share your exact equation if you'd like me to solve it step-by-step.`;
  }

  return `Here’s a helpful explanation:
${text}

• Identify what’s being asked
• Recall the rule or formula involved
• Apply it step by step
• Check the result makes sense

Ask for a worked example or a quick practice problem.`;
}

function systemPrompt() {
  return `You are The GOAT: a calm, concise WhatsApp tutor for South African students (Grades 8–12).
Rules:
- Answer directly and simply.
- If it's a problem (e.g., equation), show short step-by-step.
- Keep under ~120 words.
- Offer one follow-up option (e.g., "Want a practice problem or another example?").
- Avoid long lectures.`;
}

async function generateAIAnswer(question, conversation = []) {
  if (!openai) return null;

  const messages = [
    { role: "system", content: systemPrompt() },
    ...conversation.slice(-6), // recent context
    { role: "user", content: question },
  ];

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 350,
      temperature: 0.3,
    });

    return (resp.choices?.[0]?.message?.content || "").trim();
  } catch (e) {
    console.error("AI answering failed:", e.message);
    return null;
  }
}

/**
 * Generate a conversational answer to a homework question or follow-up.
 * Falls back to curated responses when AI is unavailable.
 */
async function generateHomeworkAnswer(text, userContext = {}) {
  const classification = questionDetector.classifyQuestion(text);
  const conversation = userContext?.conversation || [];

  // 1) Try AI
  const ai = await generateAIAnswer(text, conversation);
  if (ai) {
    return { answer: ai, classification, source: "ai" };
  }

  // 2) Fallback handcrafted
  const fb = fallbackAnswerForClassification(classification, text);
  return { answer: fb, classification, source: "fallback" };
}

module.exports = {
  generateHomeworkAnswer,
  trySolveLinearEquation,
};
