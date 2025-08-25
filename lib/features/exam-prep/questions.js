/**
 * Exam Preparation Question Generation
 * GOAT Bot 2.0
 * Created: 2025-08-23 16:04:32 UTC
 * Developer: DithetoMokgabudi
 */

const OpenAI = require("openai");
let openai;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("🧠 OpenAI initialized for exam question generation");
  } else {
    console.log("⚠️ No OpenAI API key, using fallback question generation");
  }
} catch (error) {
  console.error("❌ OpenAI initialization error:", error);
}

/**
 * Generate a targeted practice question based on student's painpoint
 * @param {Object} profile - Student's painpoint profile
 * @returns {Promise<Object>} - Generated question with solution
 */
async function generateRealAIQuestion(profile) {
  console.log(`🤖 Generating real AI question for:`, profile);

  try {
    if (!openai) {
      throw new Error("OpenAI not initialized");
    }

    // Enhanced prompt with CAPS-specific instructions
    const questionPrompt = `Generate a Grade ${profile.grade} ${profile.subject} practice question following South African CAPS curriculum that specifically targets a student who struggles with: "${profile.specific_failure}"

Topic: ${profile.topic_struggles}
Student's Challenge: ${profile.specific_failure}
Assessment Type: ${profile.assessment_type}
Grade: ${profile.grade}
Subject: ${profile.subject}

Requirements:
1. Create ONE specific practice question that directly addresses their struggle
2. Follow CAPS curriculum standards for Grade ${profile.grade} ${profile.subject}
3. Focus specifically on "${profile.specific_failure}"
4. Include clear instructions
5. Make it appropriate for ${profile.assessment_type} preparation
6. Make sure the question follows standard South African exam/test format for this subject

Return ONLY the question text, no solution. Keep it concise and focused.`;

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

    // Enhanced solution generation prompt with CAPS guidance
    const solutionPrompt = `Provide a step-by-step solution for this ${profile.subject} question, following South African CAPS curriculum standards for Grade ${profile.grade}, specifically helping a student who "${profile.specific_failure}":

Question: ${questionText}

Student's struggle: ${profile.specific_failure}

Provide a clear, educational step-by-step solution that:
1. Addresses their specific challenge
2. Uses bold formatting for steps
3. Follows South African marking guidelines
4. Uses appropriate subject terminology
5. Shows all working clearly as would be required in a South African ${profile.assessment_type}`;

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
      source: "ai",
    };
  } catch (error) {
    console.error("OpenAI question generation failed:", error);

    // Graceful fallback
    return generateFallbackQuestion(profile);
  }
}

/**
 * Generate a fallback question when AI generation fails
 * @param {Object} profile - Student's painpoint profile
 * @returns {Object} - Fallback question with solution
 */
function generateFallbackQuestion(profile) {
  const subject = profile.subject || "Mathematics";
  const grade = profile.grade || "11";
  const topic = profile.topic_struggles || "algebra";
  const struggle = profile.specific_failure || "solving equations";

  console.log(
    `🔄 Generating fallback question for: ${subject} ${topic} - ${struggle}`
  );

  // Enhanced fallback questions by subject
  const fallbacks = {
    Mathematics: getMathFallbackQuestion(topic, struggle),
    "Mathematical Literacy": getMathLitFallbackQuestion(topic, struggle),
    Geography: getGeographyFallbackQuestion(topic, struggle),
    "Physical Sciences": getPhysicalSciencesFallbackQuestion(topic, struggle),
    "Life Sciences": getLifeSciencesFallbackQuestion(topic, struggle),
    History: getHistoryFallbackQuestion(topic, struggle),
    Economics: getEconomicsFallbackQuestion(topic, struggle),
    "Business Studies": getBusinessFallbackQuestion(topic, struggle),
    Accounting: getAccountingFallbackQuestion(topic, struggle),
    English: getEnglishFallbackQuestion(topic, struggle),
  };

  // Get subject-specific fallback or use generic
  return fallbacks[subject] || getGenericFallbackQuestion(profile);
}

// Subject-specific fallback questions
function getMathFallbackQuestion(topic, struggle) {
  if (topic.toLowerCase().includes("algebra")) {
    if (
      struggle.toLowerCase().includes("solve for x") ||
      struggle.toLowerCase().includes("cannot solve")
    ) {
      return {
        questionText: `**Solve for x:**\n\n2x + 7 = 19\n\n**Show all your working steps.**`,
        solution: `**Step 1:** Subtract 7 from both sides
2x + 7 - 7 = 19 - 7
2x = 12

**Step 2:** Divide both sides by 2
2x ÷ 2 = 12 ÷ 2
x = 6

**Therefore:** x = 6`,
        source: "fallback",
      };
    }
  }

  if (topic.toLowerCase().includes("geometry")) {
    return {
      questionText: `**Find the area of a triangle:**\n\nBase = 8 cm\nHeight = 6 cm\n\n**Show your formula and calculation.**`,
      solution: `**Formula:** Area = ½ × base × height

**Step 1:** Substitute values
Area = ½ × 8 × 6

**Step 2:** Calculate
Area = ½ × 48 = 24

**Therefore:** Area = 24 cm²`,
      source: "fallback",
    };
  }

  if (topic.toLowerCase().includes("trig")) {
    return {
      questionText: `**Find the value of sin θ in this right triangle:**\n\nOpposite = 5 cm\nHypotenuse = 13 cm\n\n**Show your formula and calculation.**`,
      solution: `**Formula:** sin θ = opposite/hypotenuse

**Step 1:** Substitute values
sin θ = 5/13

**Step 2:** Calculate
sin θ = 5/13 ≈ 0.3846

**Therefore:** sin θ = 5/13`,
      source: "fallback",
    };
  }

  // Generic math fallback
  return {
    questionText: `**Solve the following problem:**\n\nIf 3(x + 2) = 21, find the value of x.\n\n**Show all your working.**`,
    solution: `**Step 1:** Expand the bracket
3(x + 2) = 21
3x + 6 = 21

**Step 2:** Subtract 6 from both sides
3x + 6 - 6 = 21 - 6
3x = 15

**Step 3:** Divide both sides by 3
x = 5

**Therefore:** x = 5`,
    source: "fallback",
  };
}

function getMathLitFallbackQuestion(topic, struggle) {
  if (topic.toLowerCase().includes("finance")) {
    return {
      questionText: `**Calculate the simple interest:**\n\nSibongile invests R2500 in a savings account with an interest rate of 8% per annum simple interest. Calculate the total amount in her account after 3 years.\n\n**Show all your working.**`,
      solution: `**Formula:** A = P(1 + rt)

**Step 1:** Identify the values
P (Principal) = R2500
r (Interest rate) = 8% = 0.08
t (Time) = 3 years

**Step 2:** Substitute into the formula
A = 2500(1 + 0.08 × 3)
A = 2500(1 + 0.24)
A = 2500 × 1.24
A = R3100

**Therefore:** The total amount after 3 years is R3100`,
      source: "fallback",
    };
  }

  if (
    topic.toLowerCase().includes("data") ||
    topic.toLowerCase().includes("statistic")
  ) {
    return {
      questionText: `**Analyze the data:**\n\nThe following data shows the number of visitors to a game reserve over 7 days: 45, 62, 58, 71, 45, 83, 52\n\nCalculate the mean, median and mode of these values.\n\n**Show all your working.**`,
      solution: `**Step 1:** Calculate the mean (average)
Mean = (45 + 62 + 58 + 71 + 45 + 83 + 52) ÷ 7
Mean = 416 ÷ 7
Mean = 59.4 visitors

**Step 2:** Find the median (middle value when arranged in order)
Arranging in order: 45, 45, 52, 58, 62, 71, 83
The middle value is the 4th value: 58 visitors

**Step 3:** Find the mode (most common value)
The value 45 appears twice, all other values appear once
Mode = 45 visitors

**Therefore:** Mean = 59.4 visitors, Median = 58 visitors, Mode = 45 visitors`,
      source: "fallback",
    };
  }

  // Generic Math Lit fallback
  return {
    questionText: `**Calculate:**\n\nA rectangular vegetable garden is 5.5 m long and 3.2 m wide.\n\n1. Calculate the perimeter of the garden.\n2. Calculate the area of the garden.\n3. If fencing costs R45 per meter, how much will it cost to fence the garden?\n\n**Show all your working.**`,
    solution: `**Step 1:** Calculate the perimeter
Perimeter = 2 × (length + width)
Perimeter = 2 × (5.5 m + 3.2 m)
Perimeter = 2 × 8.7 m
Perimeter = 17.4 m

**Step 2:** Calculate the area
Area = length × width
Area = 5.5 m × 3.2 m
Area = 17.6 m²

**Step 3:** Calculate the cost of fencing
Cost = Perimeter × Cost per meter
Cost = 17.4 m × R45/m
Cost = R783

**Therefore:** Perimeter = 17.4 m, Area = 17.6 m², Fencing cost = R783`,
    source: "fallback",
  };
}

function getGeographyFallbackQuestion(topic, struggle) {
  if (topic.toLowerCase().includes("map")) {
    return {
      questionText: `**Mapwork question:**\n\nOn a 1:50 000 topographic map, the straight-line distance between two points is 8.4 cm.\n\n1. Calculate the actual ground distance in kilometers.\n2. If a person walks at 5 km/h, how long would it take to walk this distance?\n\n**Show all your working.**`,
      solution: `**Step 1:** Calculate the actual ground distance
Map scale = 1:50 000
1 cm on map = 50 000 cm in reality
8.4 cm on map = 8.4 × 50 000 = 420 000 cm in reality
Convert to kilometers: 420 000 cm = 4.2 km

**Step 2:** Calculate the time taken
Time = Distance ÷ Speed
Time = 4.2 km ÷ 5 km/h
Time = 0.84 hours
Convert to minutes: 0.84 h × 60 = 50.4 minutes

**Therefore:** The actual distance is 4.2 km and it would take approximately 50 minutes to walk.`,
      source: "fallback",
    };
  }

  // Generic Geography fallback
  return {
    questionText: `**Geography question:**\n\nStudy the climate graph for Cape Town and answer the following questions:\n\n[Climate graph showing rainfall peaks in winter months (June-August) and temperature peaks in summer months (December-February)]\n\n1. Identify the climate type shown in this graph.\n2. Explain TWO characteristics of this climate that are visible from the graph.\n3. Name ONE crop that would be suitable for this climate type and explain why.\n\n**Write a paragraph answer.**`,
    solution: `**Climate type and characteristics:**

1. The climate type shown is Mediterranean climate.

2. Characteristics visible from the graph:
   - Rainfall occurs mainly in winter months (June-August), showing winter rainfall pattern
   - Temperature peaks in summer months (December-February) when rainfall is lowest
   - Clear seasonal variation in both temperature and rainfall
   - Moderate temperature range throughout the year

3. Suitable crop: Grapes/wine grapes
   Explanation: Grapes thrive in Mediterranean climates because they require hot, dry summers for ripening and mild, wet winters for growth. The dry summer conditions reduce the risk of fungal diseases while providing ample sunshine for sugar development in the grapes. Winter rainfall provides sufficient water for vine growth without the need for excessive irrigation.`,
    source: "fallback",
  };
}

// Additional fallback functions for other subjects - implemented with basic structure
function getPhysicalSciencesFallbackQuestion(topic, struggle) {
  // Generic Physical Sciences fallback
  return {
    questionText: `**Physical Sciences question:**\n\nA 2 kg object is pushed along a horizontal surface with a force of 15 N. If the coefficient of kinetic friction is 0.3, calculate the acceleration of the object.\n\n**Show all your working.**`,
    solution: `**Step 1:** Identify the forces acting on the object
Forward force = 15 N
Weight = mass × gravity = 2 kg × 9.8 m/s² = 19.6 N
Normal force = weight = 19.6 N (as surface is horizontal)
Frictional force = coefficient × normal force = 0.3 × 19.6 N = 5.88 N

**Step 2:** Calculate net force
Net force = forward force - frictional force
Net force = 15 N - 5.88 N = 9.12 N

**Step 3:** Apply Newton's Second Law (F = ma)
9.12 N = 2 kg × a
a = 9.12 N ÷ 2 kg
a = 4.56 m/s²

**Therefore:** The acceleration of the object is 4.56 m/s²`,
    source: "fallback",
  };
}

function getLifeSciencesFallbackQuestion(topic, struggle) {
  // Generic Life Sciences fallback
  return {
    questionText: `**Life Sciences question:**\n\nDescribe the structure and function of mitochondria in eukaryotic cells.\n\n**Write a paragraph answer with labeled diagram.**`,
    solution: `**Structure and Function of Mitochondria:**

Mitochondria are double-membrane organelles found in eukaryotic cells. The outer membrane is smooth and covers the organelle. The inner membrane is folded into cristae, which increase the surface area for chemical reactions. The space inside the inner membrane is called the matrix.

Functionally, mitochondria are responsible for cellular respiration, producing most of the cell's ATP (energy) through the process of oxidative phosphorylation. The matrix contains enzymes for the Krebs cycle, while the cristae house the electron transport chain proteins. Mitochondria also have their own DNA (mtDNA) and ribosomes, allowing them to produce some of their own proteins.

Mitochondria are often called the "powerhouse of the cell" because they generate approximately 90% of the cell's energy in the form of ATP through aerobic respiration.

[A labeled diagram would show: outer membrane, inner membrane, cristae, matrix, mtDNA, and ribosomes]`,
    source: "fallback",
  };
}

function getHistoryFallbackQuestion(topic, struggle) {
  // Generic History fallback
  return {
    questionText: `**History source-based question:**\n\nRead the following extract about the Cold War and answer the questions that follow:\n\n"The Iron Curtain has descended across the continent. Behind that line lie all the capitals of the ancient states of Central and Eastern Europe... all these famous cities and the populations around them lie in what I must call the Soviet sphere." - Winston Churchill, 1946\n\n1. Define the concept 'Iron Curtain' in your own words.\n2. What message was Churchill trying to convey in this speech?\n3. Using your contextual knowledge, explain TWO ways in which this speech influenced Cold War relations.\n\n**Write paragraph answers to each question.**`,
    solution: `**1. Definition of 'Iron Curtain':**
The 'Iron Curtain' was a symbolic barrier that divided Europe into two separate areas of political influence after World War II. It represented the ideological and physical boundary between Western democracies (capitalist) and Soviet-controlled Eastern European nations (communist). This term symbolized the separation and limited communication between these two blocs during the Cold War period.

**2. Churchill's message:**
Churchill was warning Western powers about Soviet expansion into Eastern Europe. He was attempting to alert the world to the growing influence and control of the Soviet Union over Eastern European countries. Churchill wanted to convey the urgency of forming a united Western response to contain Soviet influence and prevent further communist expansion. He was essentially declaring the beginning of what would become known as the Cold War.

**3. Influence on Cold War relations:**
- This speech heightened tensions between the Soviet Union and Western powers, particularly the United States, as it publicly framed the Soviets as an aggressive expansionist power that needed to be contained. Stalin interpreted it as a declaration of ideological war, further deepening mistrust between East and West.
- The speech contributed to the development of the Truman Doctrine and Marshall Plan, which were American policies designed to contain Soviet influence through economic and military support to vulnerable nations. These policies formalized the division Churchill described and established the framework for Western strategy throughout the Cold War.`,
    source: "fallback",
  };
}

function getEconomicsFallbackQuestion(topic, struggle) {
  // Generic Economics fallback
  return {
    questionText: `**Economics data response question:**\n\nStudy the graph showing South Africa's inflation rate from 2018-2023 and answer the questions that follow:\n\n[Graph showing fluctuating inflation with recent upward trend]\n\n1. Define the term 'inflation'.\n2. Identify the trend in inflation between 2021 and 2023.\n3. Explain TWO negative effects of rising inflation on households.\n4. Discuss ONE monetary policy measure the South African Reserve Bank could implement to address rising inflation.\n\n**Write paragraph answers to each question.**`,
    solution: `**1. Definition of inflation:**
Inflation refers to the general increase in prices of goods and services in an economy over time, resulting in a decrease in the purchasing power of money. It is typically measured as an annual percentage change using indices like the Consumer Price Index (CPI).

**2. Trend in inflation (2021-2023):**
The trend shows a significant upward movement in inflation from 2021 to 2023. Inflation rates increased steadily during this period, exceeding the South African Reserve Bank's target range of 3-6% by 2022 and continuing to rise into 2023.

**3. Negative effects on households:**
- Reduced purchasing power: Rising inflation erodes the value of money, meaning households can afford fewer goods and services with the same amount of income. This particularly affects low-income households who spend a larger proportion of their income on necessities.
- Increased cost of borrowing: As inflation rises, interest rates typically increase as well, making loans and mortgages more expensive. This increases monthly repayments for households with variable-rate loans and makes new financing more difficult to obtain.

**4. Monetary policy measure:**
The South African Reserve Bank could implement contractionary monetary policy by increasing the repo rate (the rate at which commercial banks borrow from the central bank). This would make borrowing more expensive throughout the economy, reducing consumer spending and business investment. Decreased demand would put downward pressure on prices, helping to control inflation. However, this approach may slow economic growth and potentially increase unemployment in the short term as a side effect.`,
    source: "fallback",
  };
}

function getBusinessFallbackQuestion(topic, struggle) {
  // Generic Business Studies fallback
  return {
    questionText: `**Business Studies essay question:**\n\nDiscuss FOUR ways in which a business can create a positive work environment to increase productivity. Also, evaluate the effectiveness of Total Quality Management (TQM) in improving business operations.\n\n**Write a structured essay with introduction, body, and conclusion.**`,
    solution: `**Introduction:**
Creating a positive work environment and implementing quality management systems are essential strategies for contemporary businesses seeking to enhance productivity and maintain competitiveness. This essay discusses four approaches to fostering a positive workplace and evaluates the effectiveness of Total Quality Management in improving operations.

**Body - Four ways to create a positive work environment:**

**1. Effective communication systems**
- Open-door policies encourage employees to share ideas and concerns
- Regular feedback sessions help address issues promptly
- Clear communication of company goals aligns employee efforts with business objectives
- Impact: Employees feel valued and understand their contribution to the business

**2. Employee wellness programs**
- Physical and mental health support services improve overall wellbeing
- Work-life balance initiatives reduce burnout and absenteeism
- Recreational activities promote teambuilding and reduce stress
- Impact: Reduced sick leave and increased employee retention

**3. Recognition and reward systems**
- Performance bonuses acknowledge outstanding work
- Employee-of-the-month programs celebrate achievements publicly
- Career advancement opportunities provide long-term motivation
- Impact: Increased motivation and job satisfaction

**4. Skills development and training**
- Regular workshops enhance employee capabilities
- Cross-training creates versatile workforce members
- Bursaries for further education demonstrate investment in people
- Impact: Improved skills and loyalty to the organization

**Evaluation of TQM effectiveness:**

**Advantages:**
- Reduces waste and defects through continuous improvement
- Increases customer satisfaction through quality focus
- Improves employee involvement in decision-making processes
- Creates culture of excellence and accountability

**Limitations:**
- Implementation requires significant time and resources
- Results may not be immediately visible, affecting motivation
- Requires complete buy-in from all stakeholders
- May create excessive bureaucracy through documentation requirements

**Conclusion:**
Creating a positive work environment through effective communication, wellness programs, recognition systems, and skills development significantly boosts productivity. While TQM offers substantial benefits for improving operations through quality focus and continuous improvement, businesses must be aware of implementation challenges and resource requirements. When properly executed, both approaches complement each other in fostering a productive, quality-oriented business culture.`,
    source: "fallback",
  };
}

function getAccountingFallbackQuestion(topic, struggle) {
  // Generic Accounting fallback
  return {
    questionText: `**Accounting question:**\n\nPrepare the following accounts from the adjusted trial balance of Sipho Traders for the year ending 28 February 2023:\n\n1. Trading Account\n2. Profit and Loss Account\n\nInformation from the adjusted trial balance:\n- Opening stock: R45,000\n- Purchases: R325,000\n- Sales: R540,000\n- Closing stock: R38,000\n- Wages and salaries: R85,000\n- Rent expense: R24,000\n- Insurance: R12,000\n- Interest paid: R8,000\n- Depreciation: R15,000\n\n**Show all workings clearly.**`,
    solution: `**TRADING ACCOUNT FOR THE YEAR ENDING 28 FEBRUARY 2023**

**DEBIT SIDE**                | **R**    | **CREDIT SIDE**          | **R**
-----------------------------|---------|--------------------------|----------
Opening stock                 | 45,000  | Sales                     | 540,000
Purchases                     | 325,000 |                          |
                             |         |                          |
Gross profit c/d             | 208,000 | Closing stock             | 38,000
-----------------------------|---------|--------------------------|----------
**TOTAL**                     | **578,000** | **TOTAL**               | **578,000**

**PROFIT AND LOSS ACCOUNT FOR THE YEAR ENDING 28 FEBRUARY 2023**

**DEBIT SIDE**                | **R**    | **CREDIT SIDE**          | **R**
-----------------------------|---------|--------------------------|----------
Wages and salaries            | 85,000  | Gross profit b/d         | 208,000
Rent expense                  | 24,000  |                          |
Insurance                     | 12,000  |                          |
Interest paid                 | 8,000   |                          |
Depreciation                  | 15,000  |                          |
                             |         |                          |
Net profit                    | 64,000  |                          |
-----------------------------|---------|--------------------------|----------
**TOTAL**                     | **208,000** | **TOTAL**               | **208,000**

**Workings:**
1. Calculation of gross profit:
   Sales - (Opening stock + Purchases - Closing stock)
   = 540,000 - (45,000 + 325,000 - 38,000)
   = 540,000 - 332,000
   = R208,000

2. Calculation of net profit:
   Gross profit - Total expenses
   = 208,000 - (85,000 + 24,000 + 12,000 + 8,000 + 15,000)
   = 208,000 - 144,000
   = R64,000`,
    source: "fallback",
  };
}

function getEnglishFallbackQuestion(topic, struggle) {
  // Generic English fallback
  return {
    questionText: `**English comprehension and language question:**\n\nRead the extract below and answer the questions that follow:\n\n"The old man had fallen asleep beneath the sprawling jacaranda tree. Its purple blossoms carpeted the ground around him, creating a royal backdrop for his weathered face. He had seen much in his eighty years; the country had transformed from colonial rule to independence, and he had witnessed both the hope and heartache of a nation finding its voice."\n\n1. Identify the figure of speech in "purple blossoms carpeted the ground" and explain its effectiveness.\n\n2. What does the extract suggest about the setting of this story? Quote to support your answer.\n\n3. Discuss the writer's attitude toward the old man. Support your answer with TWO examples from the text.\n\n4. Rewrite the following sentence in reported speech: "I have lived through many changes," said the old man.`,
    solution: `**1. Figure of speech:**
The figure of speech in "purple blossoms carpeted the ground" is personification or metaphor. The blossoms are given the ability to "carpet" the ground, comparing them to a man-made floor covering.

Effectiveness: This figure of speech creates a vivid visual image of the ground completely covered in purple flowers, emphasizing their abundance and beauty. It also suggests the natural world creating comfort for the man, as a carpet provides comfort in a home. The word "carpeted" effectively conveys both the visual density and the softness of the fallen flowers.

**2. Setting of the story:**
The extract suggests the setting is in Africa or another formerly colonized country with a warm climate where jacaranda trees grow. The reference to "colonial rule to independence" indicates a post-colonial setting.

Supporting quote: "the country had transformed from colonial rule to independence, and he had witnessed both the hope and heartache of a nation finding its voice."

**3. Writer's attitude toward the old man:**
The writer demonstrates respect and reverence for the old man, portraying him as a dignified witness to history.

Examples from the text:
- The description of the blossoms creating "a royal backdrop for his weathered face" suggests the writer sees nobility and dignity in the man despite his age.
- The statement that "he had seen much in his eighty years" and had "witnessed both the hope and heartache of a nation" portrays him as a valuable repository of historical knowledge and experience.

**4. Reported speech:**
The old man said that he had lived through many changes.`,
    source: "fallback",
  };
}

function getGenericFallbackQuestion(profile) {
  return {
    questionText: `**${profile.subject} Grade ${profile.grade} Practice Question:**

Topic: ${profile.topic_struggles}
Challenge: ${profile.specific_failure}

**Solve this step by step.**`,
    solution: `**Step 1:** Identify what the question is asking

**Step 2:** Apply the appropriate method for ${profile.topic_struggles}

**Step 3:** Show all working clearly

**Step 4:** Check your answer makes sense

**Therefore:** [Complete solution addressing ${profile.specific_failure}]`,
    source: "generic_fallback",
  };
}

// Helper function to enhance visual formatting of math content
function enhanceVisualFormatting(content) {
  let enhanced = content;

  // Format mathematical expressions
  enhanced = enhanced
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/sqrt\(([^)]+)\)/g, "√($1)")
    .replace(/\+\-/g, "±")
    .replace(/infinity/g, "∞")
    .replace(/pi/g, "π")
    .replace(/theta/g, "θ");

  // Format step-by-step solutions
  enhanced = enhanced
    .replace(/Step (\d+):/g, "**Step $1:**")
    .replace(/Step (\d+)\./g, "**Step $1:**")
    .replace(/(\d+)\.\s/g, "**$1.** ")
    .replace(/Given:/g, "**Given:**")
    .replace(/Solution:/g, "**Solution:**")
    .replace(/Answer:/g, "**Answer:**")
    .replace(/Therefore:/g, "**Therefore:**");

  return enhanced;
}

// Generate a set of questions for an exam
async function generateExamQuestions(profile, count = 3) {
  console.log(`📝 Generating ${count} exam questions for:`, profile);

  const questions = [];

  // Try to generate questions with AI first
  try {
    // Generate main question with AI
    const mainQuestion = await generateRealAIQuestion(profile);
    questions.push(mainQuestion);

    // Generate remaining questions with fallback if needed
    for (let i = questions.length; i < count; i++) {
      try {
        // Add slight variations to prevent repetitive questions
        const variedProfile = {
          ...profile,
          specific_failure: `${profile.specific_failure} (variation ${i})`,
        };

        const question = await generateRealAIQuestion(variedProfile);
        questions.push(question);
      } catch (error) {
        console.error(`Error generating question ${i + 1}:`, error);
        questions.push(generateFallbackQuestion(profile));
      }
    }
  } catch (error) {
    console.error("Failed to generate any AI questions:", error);

    // Fall back to completely manual questions
    for (let i = 0; i < count; i++) {
      questions.push(generateFallbackQuestion(profile));
    }
  }

  return {
    questions,
    metadata: {
      count: questions.length,
      ai_generated: questions.filter((q) => q.source === "ai").length,
      fallback: questions.filter((q) => q.source !== "ai").length,
      generated_at: new Date().toISOString(),
      profile: {
        subject: profile.subject,
        grade: profile.grade,
        topic: profile.topic_struggles,
        specific_challenge: profile.specific_failure,
      },
    },
  };
}

module.exports = {
  generateRealAIQuestion,
  generateFallbackQuestion,
  generateExamQuestions,
  // Export new functions
  getMathFallbackQuestion,
  getMathLitFallbackQuestion,
  getGeographyFallbackQuestion,
  getGenericFallbackQuestion,
};
