/**
 * GOAT Bot 2.0 - FINAL FINE TUNING: Enhanced Visuals + Smart Context + Responsive Design
 * User: sophoniagoat
 * Updated: 2025-08-21 14:30:28 UTC
 * PROGRESS: 98% - Final visual and UX optimizations
 */

// Enhanced user state management
const userStates = new Map();

// Command types
const GOAT_COMMANDS = {
  WELCOME: 'welcome',
  MENU_CHOICE: 'menu_choice',
  EXAM_PREP_CONVERSATION: 'exam_prep_conversation',
  HOMEWORK_HELP: 'homework_help',
  MEMORY_HACKS: 'memory_hacks',
  FIXED_MENU_COMMAND: 'fixed_menu_command',
  NUMBERED_MENU_COMMAND: 'numbered_menu_command'
};

// AI-POWERED INTELLIGENCE STATES
const AI_INTEL_STATES = {
  EXAM_OR_TEST: 'ai_exam_or_test',
  SUBJECT_GRADE: 'ai_subject_grade',
  AI_PAINPOINT_EXCAVATION: 'ai_painpoint_excavation',
  AI_MICRO_TARGETING: 'ai_micro_targeting',
  AI_QUESTION_GENERATION: 'ai_question_generation'
};

// ENHANCED MENU COMMANDS
const MENU_COMMANDS = {
  CONTINUE: 'continue',
  QUESTION: 'question',
  SOLUTION: 'solution',
  SWITCH: 'switch',
  MENU: 'menu',
  NEXT: 'next',
  OPTION_1: '1',
  OPTION_2: '2', 
  OPTION_3: '3',
  OPTION_4: '4'
};

// SUBJECT AVAILABILITY STATUS
const SUBJECT_STATUS = {
  MATHEMATICS: { available: true, name: 'Mathematics', alias: ['math', 'maths', 'mathematics'] },
  PHYSICAL_SCIENCES: { available: false, name: 'Physical Sciences', alias: ['physics', 'physical', 'chemistry'], coming_soon: true },
  LIFE_SCIENCES: { available: false, name: 'Life Sciences', alias: ['biology', 'life'], coming_soon: true },
  ENGLISH: { available: false, name: 'English', alias: ['english'], coming_soon: true },
  AFRIKAANS: { available: false, name: 'Afrikaans', alias: ['afrikaans'], coming_soon: true },
  HISTORY: { available: false, name: 'History', alias: ['history'], coming_soon: true },
  GEOGRAPHY: { available: false, name: 'Geography', alias: ['geography'], coming_soon: true }
};

// ENHANCED VISUAL FORMATTING FUNCTIONS
function formatMathematicalExpression(expression) {
  // Enhanced mathematical formatting with Unicode
  return expression
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^4/g, '⁴')
    .replace(/\^5/g, '⁵')
    .replace(/\^(-?\d+)/g, (match, exp) => {
      const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
      const negative = '⁻';
      if (exp.startsWith('-')) {
        return negative + exp.slice(1).split('').map(d => superscripts[d]).join('');
      }
      return exp.split('').map(d => superscripts[d] || d).join('');
    })
    .replace(/sqrt\(([^)]+)\)/g, '√($1)')
    .replace(/\+/-/g, '±')
    .replace(/infinity/g, '∞')
    .replace(/pi/g, 'π')
    .replace(/theta/g, 'θ')
    .replace(/alpha/g, 'α')
    .replace(/beta/g, 'β')
    .replace(/gamma/g, 'γ')
    .replace(/delta/g, 'δ');
}

function formatStepByStep(content) {
  // Enhanced step formatting with consistent styling
  return content
    .replace(/Step (\d+):/g, '**Step $1:**')
    .replace(/Step (\d+)\./g, '**Step $1:**')
    .replace(/(\d+)\.\s/g, '**$1.** ')
    .replace(/Given:/g, '**Given:**')
    .replace(/Solution:/g, '**Solution:**')
    .replace(/Answer:/g, '**Answer:**')
    .replace(/Therefore:/g, '**Therefore:**')
    .replace(/Final Answer:/g, '**Final Answer:**')
    .replace(/Check:/g, '**Check:**')
    .replace(/Verification:/g, '**Verification:**');
}

function enhanceVisualFormatting(content) {
  // Apply comprehensive visual enhancements
  let enhanced = content;
  
  // Format mathematical expressions
  enhanced = formatMathematicalExpression(enhanced);
  
  // Format step-by-step content
  enhanced = formatStepByStep(enhanced);
  
  // Enhance mathematical operators and symbols
  enhanced = enhanced
    .replace(/\*\*/g, '×')  // Multiplication
    .replace(/\s\/\s/g, ' ÷ ')  // Division
    .replace(/==/g, '=')  // Equals
    .replace(/!=/g, '≠')  // Not equals
    .replace(/<=/g, '≤')  // Less than or equal
    .replace(/>=/g, '≥')  // Greater than or equal
    .replace(/\+\-/g, '±')  // Plus minus
    .replace(/\-\+/g, '∓');  // Minus plus
  
  return enhanced;
}

// RESPONSIVE SEPARATOR FUNCTION
function getResponsiveSeparator(deviceWidth = 'mobile') {
  // Device-responsive separator lines
  const separators = {
    mobile: '─'.repeat(31),      // Mobile phones
    tablet: '─'.repeat(45),      // Tablets  
    desktop: '─'.repeat(60),     // Desktop
    wide: '─'.repeat(80)         // Wide screens
  };
  
  return separators[deviceWidth] || separators.mobile;
}

function detectDeviceType(userAgent = '') {
  // Simple device detection for responsive formatting
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else if (ua.includes('desktop') || ua.includes('windows') || ua.includes('mac')) {
    return 'desktop';
  }
  
  return 'mobile'; // Default to mobile for safety
}

// Enhanced command parser
function parseGoatCommand(message, userContext) {
  const text = message.toLowerCase().trim();
  
  // Check for numbered menu commands (1-4)
  if (/^[1234]$/.test(text) && userContext.current_menu === 'exam_prep_conversation') {
    return { 
      type: GOAT_COMMANDS.NUMBERED_MENU_COMMAND, 
      option: parseInt(text),
      original_text: message
    };
  }
  
  // Check for main menu numbers (1-3)
  if (/^[123]$/.test(text) && userContext.current_menu === 'welcome') {
    return { 
      type: GOAT_COMMANDS.MENU_CHOICE, 
      choice: parseInt(text),
      action: text === '1' ? 'exam_prep' : text === '2' ? 'homework' : 'memory_hacks'
    };
  }
  
  // Check for text-based commands
  if (Object.values(MENU_COMMANDS).slice(0, 6).includes(text)) {
    return { 
      type: GOAT_COMMANDS.FIXED_MENU_COMMAND, 
      command: text,
      original_text: message
    };
  }
  
  if (!message || text.includes('start') || text.includes('hi') || text.includes('hello')) {
    return { type: GOAT_COMMANDS.WELCOME };
  }
  
  const currentMenu = userContext.current_menu || 'welcome';
  
  switch (currentMenu) {
    case 'exam_prep_conversation':
      return { type: GOAT_COMMANDS.EXAM_PREP_CONVERSATION, text: message };
    case 'homework_active':
      return { type: GOAT_COMMANDS.HOMEWORK_HELP, text: message };
    case 'memory_hacks_active':
      return { type: GOAT_COMMANDS.MEMORY_HACKS, text: message };
    case 'welcome':
    default:
      if (text === 'thank you' || text === 'thanks' || text === 'ok' || text === 'okay') {
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
    ...metadata
  };
}

module.exports = async (req, res) => {
  const start = Date.now();
  
  console.log('✨ GOAT Bot v2.0 - FINAL FINE TUNING: Enhanced Visuals + Smart Context');
  
  const { query } = req;
  const endpoint = query.endpoint || 'webhook';
  
  try {
    switch (endpoint) {
      case 'webhook':
        return await handleWebhook(req, res, start);
      case 'mock-exam':
        return await handleMockExam(req, res, start);
      case 'homework-ocr':
        return await handleHomeworkOCR(req, res, start);
      case 'memory-hacks':
        return await handleMemoryHacks(req, res, start);
      case 'database-test':
        return await handleDatabaseTest(req, res, start);
      case 'openai-test':
        return await handleOpenAITest(req, res, start);
      default:
        return await handleWebhook(req, res, start);
    }
  } catch (error) {
    console.error('❌ GOAT Bot error:', error);
    return res.status(500).json({
      message: "Sorry, I encountered an error. Please try typing 'menu' to restart! 🔄",
      status: "error",
      echo: "Sorry, I encountered an error. Please try typing 'menu' to restart! 🔄",
      error: error.message,
      elapsed_ms: Date.now() - start,
      user: "sophoniagoat"
    });
  }
};

async function handleWebhook(req, res, start) {
  if (req.method === 'GET') {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      webhook: "GOAT Bot - FINAL FINE TUNING",
      status: "Active",
      progress: "98% complete",
      features: "Enhanced visuals, smart context, responsive design"
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Only POST requests supported',
      echo: 'Only POST requests supported'
    });
  }

  const subscriberId = req.body.psid || req.body.subscriber_id || 'default_user';
  const message = req.body.message || req.body.user_input || '';
  const userAgent = req.headers['user-agent'] || '';

  if (!subscriberId) {
    return res.status(400).json({ 
      error: 'Missing subscriber_id (psid)',
      echo: 'Missing subscriber_id (psid)'
    });
  }

  console.log(`📥 User ${subscriberId}: "${message}" (${message.length} chars)`);

  let user = userStates.get(subscriberId) || {
    id: subscriberId,
    current_menu: 'welcome',
    context: {},
    painpoint_profile: {},
    conversation_history: [],
    preferences: { 
      last_subject: null, 
      last_grade: null,
      device_type: detectDeviceType(userAgent),
      visual_style: 'enhanced'
    },
    last_active: new Date().toISOString()
  };

  // Update device type if changed
  user.preferences.device_type = detectDeviceType(userAgent);

  console.log(`👤 User ${user.id} | Device: ${user.preferences.device_type} | Menu: ${user.current_menu} | AI State: ${user.context.ai_intel_state || 'none'}`);

  const command = parseGoatCommand(message, {
    current_menu: user.current_menu,
    context: user.context,
    conversation_history: user.conversation_history
  });

  console.log(`🎯 Command parsed: ${command.type}`, {
    action: command.action,
    choice: command.choice,
    option: command.option,
    command: command.command,
    text: command.text?.substring(0, 30)
  });

  let reply = '';

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

  // Enhanced conversation tracking
  user.conversation_history.push({
    user_input: message,
    bot_response: reply.substring(0, 100),
    timestamp: new Date().toISOString(),
    command_type: command.type,
    ai_intel_state: user.context.ai_intel_state,
    menu_option_used: command.option || command.command || null,
    device_type: user.preferences.device_type,
    response_enhanced: true
  });

  if (user.conversation_history.length > 15) {
    user.conversation_history = user.conversation_history.slice(-15);
  }

  user.last_active = new Date().toISOString();
  userStates.set(subscriberId, user);

  console.log(`✅ Enhanced reply: ${reply.length} chars | Device: ${user.preferences.device_type} | Visual enhancements applied`);

  return res.status(200).json(formatGoatResponse(reply, {
    user_id: user.id,
    command_type: command.type,
    current_menu: user.current_menu,
    ai_intel_state: user.context.ai_intel_state,
    final_fine_tuning: true,
    device_responsive: true,
    elapsed_ms: Date.now() - start
  }));
}

// ===== ENHANCED VISUAL SEPARATION FUNCTIONS =====

function formatResponseWithEnhancedSeparation(content, menuOptions, deviceType = 'mobile') {
  const separator = getResponsiveSeparator(deviceType);
  
  // Apply visual enhancements to content
  const enhancedContent = enhanceVisualFormatting(content);
  
  return `${enhancedContent}

${separator}

${menuOptions}`;
}

function generateEnhancedVisualMenu(aiState, deviceType = 'mobile') {
  const isMobile = deviceType === 'mobile';
  const spacing = isMobile ? '' : '  '; // Extra spacing for larger screens
  
  switch (aiState) {
    
    case AI_INTEL_STATES.AI_QUESTION_GENERATION:
      return `1️⃣${spacing} 📚 Solution
2️⃣${spacing} ➡️ Next Question  
3️⃣${spacing} 🔄 Switch Topics
4️⃣${spacing} 🏠 Main Menu`;

    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
    case AI_INTEL_STATES.AI_MICRO_TARGETING:
      return `1️⃣${spacing} ➡️ Continue
2️⃣${spacing} 📝 Skip to Question
3️⃣${spacing} 🔄 Switch Topics  
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

// ===== SUBJECT AVAILABILITY FUNCTIONS (ENHANCED) =====

function checkSubjectAvailability(subjectInput) {
  const input = subjectInput.toLowerCase();
  
  for (const [key, subject] of Object.entries(SUBJECT_STATUS)) {
    for (const alias of subject.alias) {
      if (input.includes(alias)) {
        return {
          detected: subject.name,
          available: subject.available,
          coming_soon: subject.coming_soon || false,
          key: key
        };
      }
    }
  }
  
  return {
    detected: 'Mathematics',
    available: true,
    coming_soon: false,
    key: 'MATHEMATICS'
  };
}

function generateSubjectAvailabilityMessage(subjectCheck, grade) {
  if (subjectCheck.available) {
    return `**Grade ${grade} ${subjectCheck.detected} exam!**`;
  } else if (subjectCheck.coming_soon) {
    return `**Grade ${grade} ${subjectCheck.detected}!**

⚠️ **${subjectCheck.detected} GOAT is coming soon!**
Right now, only **Math GOAT** is fully online.

🔄 **Switch to Mathematics?** Or continue anyway for limited support.`;
  } else {
    return `**Grade ${grade} ${subjectCheck.detected}!**

⚠️ **Subject not yet supported**
Currently available: **Mathematics only**

🔄 **Switch to Mathematics?** Or continue for basic help.`;
  }
}

// ===== ENHANCED NUMBERED MENU HANDLER =====

async function handleNumberedMenuCommand(user, option) {
  console.log(`🔢 Enhanced menu option: ${option} | Context: ${user.context.ai_intel_state}`);
  
  const currentState = user.context.ai_intel_state;
  
  switch (currentState) {
    
    case AI_INTEL_STATES.AI_QUESTION_GENERATION:
      switch (option) {
        case 1: return await handleSolutionCommand(user);
        case 2: return await handleNextCommand(user);
        case 3: return await handleSmartSwitchTopicsCommand(user);
        case 4: return await showWelcomeMenu(user);
        default: return getContextualMenuError(currentState, user.preferences.device_type);
      }
      
    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
    case AI_INTEL_STATES.AI_MICRO_TARGETING:
      switch (option) {
        case 1: return await handleContinueCommand(user);
        case 2: return await handleQuestionCommand(user);
        case 3: return await handleSmartSwitchTopicsCommand(user);
        case 4: return await showWelcomeMenu(user);
        default: return getContextualMenuError(currentState, user.preferences.device_type);
      }
      
    default:
      switch (option) {
        case 1: return await handleContinueCommand(user);
        case 2: return await handleQuestionCommand(user);
        case 3: return await handleSmartSwitchTopicsCommand(user);
        case 4: return await showWelcomeMenu(user);
        default: return getGenericMenuError(user.preferences.device_type);
      }
  }
}

// ===== ENHANCED MENU OPTION HANDLERS =====

async function handleSolutionCommand(user) {
  if (user.context.current_question) {
    return await showEnhancedAITargetedSolution(user);
  }
  
  const content = `**No question active yet.**

Ready to get a practice question?`;
  const menu = generateEnhancedVisualMenu(user.context.ai_intel_state, user.preferences.device_type);
  return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
}

async function handleNextCommand(user) {
  const currentState = user.context.ai_intel_state;
  
  if (currentState === AI_INTEL_STATES.AI_QUESTION_GENERATION) {
    return await generateEnhancedAITargetedQuestion(user);
  }
  
  const content = `**Next step coming up!**

Let's continue your learning journey.`;
  const menu = generateEnhancedVisualMenu(currentState, user.preferences.device_type);
  return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
}

async function handleSmartSwitchTopicsCommand(user) {
  // ENHANCED: Smart topic switching - remember grade and subject, ask only for topic
  
  // Save current preferences
  if (user.context.painpoint_profile?.subject) {
    user.preferences.last_subject = user.context.painpoint_profile.subject;
  }
  if (user.context.painpoint_profile?.grade) {
    user.preferences.last_grade = user.context.painpoint_profile.grade;
  }
  
  // Keep the current subject and grade, just reset the topic
  const currentSubject = user.preferences.last_subject || 'Mathematics';
  const currentGrade = user.preferences.last_grade || '11';
  
  // Reset only topic-related context
  user.context.painpoint_profile = {
    subject: currentSubject,
    grade: currentGrade,
    assessment_type: user.context.painpoint_profile?.assessment_type || 'test'
  };
  
  user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION;
  
  const content = `🔄 **Switching Topics!**

**Keeping:** ${currentSubject} Grade ${currentGrade}

**Which new topic** would you like to practice?

*(Algebra, Geometry, Trigonometry, Functions, etc.)*`;
  
  const menu = generateEnhancedVisualMenu(AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION, user.preferences.device_type);
  return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
}

async function handleContinueCommand(user) {
  const currentState = user.context.ai_intel_state;
  
  if (currentState === AI_INTEL_STATES.AI_QUESTION_GENERATION) {
    return await generateEnhancedAITargetedQuestion(user);
  }
  
  const subject = user.context.painpoint_profile?.subject || 'your subject';
  return `**Let's continue exploring your ${subject} challenges.**

What else is troubling you? Be specific about the topic area.`;
}

async function handleQuestionCommand(user) {
  const profile = user.context.painpoint_profile;
  
  if (!profile?.subject) {
    user.current_menu = 'exam_prep_conversation';
    user.context.ai_intel_state = AI_INTEL_STATES.SUBJECT_GRADE;
    
    const content = `📝 **Quick Question Mode**

What subject and grade? *(e.g., "Grade 11 Maths")*`;
    
    const menu = generateEnhancedVisualMenu(AI_INTEL_STATES.SUBJECT_GRADE, user.preferences.device_type);
    return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
  }
  
  user.context.ai_intel_state = AI_INTEL_STATES.AI_QUESTION_GENERATION;
  return await generateEnhancedAITargetedQuestion(user);
}

// ===== BACKWARD COMPATIBILITY HANDLER =====

async function handleFixedMenuCommand(user, command) {
  console.log(`🔧 Enhanced text command: ${command} | Context: ${user.context.ai_intel_state}`);
  
  switch (command) {
    case 'solution': return await handleSolutionCommand(user);
    case 'next': return await handleNextCommand(user);
    case 'switch': return await handleSmartSwitchTopicsCommand(user);
    case 'continue': return await handleContinueCommand(user);
    case 'question': return await handleQuestionCommand(user);
    case 'menu': return await showWelcomeMenu(user);
    default: 
      const content = `**Try:** 1, 2, 3, or 4`;
      const menu = generateEnhancedVisualMenu(user.context.ai_intel_state, user.preferences.device_type);
      return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
  }
}

// ===== ERROR HANDLING WITH ENHANCED VISUALS =====

function getContextualMenuError(aiState, deviceType = 'mobile') {
  const content = `**Please choose 1, 2, 3, or 4:**`;
  const menu = generateEnhancedVisualMenu(aiState, deviceType);
  return formatResponseWithEnhancedSeparation(content, menu, deviceType);
}

function getGenericMenuError(deviceType = 'mobile') {
  const content = `**Please choose an option (1-4):**`;
  const menu = generateEnhancedVisualMenu('default', deviceType);
  return formatResponseWithEnhancedSeparation(content, menu, deviceType);
}

// ===== PROGRESS INDICATORS (ENHANCED) =====

function getEnhancedProgressIndicator(aiState) {
  switch (aiState) {
    case AI_INTEL_STATES.EXAM_OR_TEST: return "📍 **Step 1/4:** Assessment Type";
    case AI_INTEL_STATES.SUBJECT_GRADE: return "📍 **Step 2/4:** Subject & Grade";
    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION: return "📍 **Step 3/4:** Finding Struggles";
    case AI_INTEL_STATES.AI_MICRO_TARGETING: return "📍 **Step 4/4:** Precision Targeting";
    case AI_INTEL_STATES.AI_QUESTION_GENERATION: return "🎯 **Practice Mode Active**";
    default: return "";
  }
}

// ===== CORE HANDLER FUNCTIONS (ENHANCED) =====

async function showWelcomeMenu(user) {
  console.log(`🏠 Enhanced welcome menu for user ${user.id}`);
  
  user.current_menu = 'welcome';
  user.context = {};
  user.painpoint_profile = {};
  
  const welcomeBack = user.preferences.last_subject ? 
    `\n\n👋 **Welcome back!** Ready to continue with *${user.preferences.last_subject}*?` : '';
  
  return `**Welcome to The GOAT.** I'm here help you study with calm and clarity.${welcomeBack}

**What do you need right now?**

1️⃣ 📅 Exam/Test coming 😰
2️⃣ 📚 Homework Help 🫶
3️⃣ 🧮 Tips & Hacks

Just pick a number! ✨`;
}

// ===== ENHANCED AI-POWERED INTELLIGENCE FUNCTIONS =====

async function startAIIntelligenceGathering(user) {
  console.log(`🤖 Starting enhanced AI intelligence for user ${user.id}`);
  
  user.current_menu = 'exam_prep_conversation';
  user.context = {
    ai_intel_state: AI_INTEL_STATES.EXAM_OR_TEST,
    painpoint_profile: {}
  };
  
  return `📅 **Exam/Test Prep Mode Activated!** 😰➡️😎

${getEnhancedProgressIndicator(AI_INTEL_STATES.EXAM_OR_TEST)}

Exam or test stress? I'll generate questions to unstuck you!

**First** - is this an **EXAM** or **TEST**? *(Different question styles!)*`;
}

async function handleAIIntelligenceGathering(user, text) {
  console.log(`🤖 Enhanced AI Intelligence: ${user.context.ai_intel_state} | Input: "${text}"`);
  
  const aiIntelState = user.context.ai_intel_state || AI_INTEL_STATES.EXAM_OR_TEST;
  
  if (!user.context.painpoint_profile) {
    user.context.painpoint_profile = {};
  }
  
  switch (aiIntelState) {
    
    case AI_INTEL_STATES.EXAM_OR_TEST:
      const examAnalysis = await analyzeExamTestResponseFixed(text);
      user.context.painpoint_profile.assessment_type = examAnalysis.assessment_type;
      user.context.ai_intel_state = AI_INTEL_STATES.SUBJECT_GRADE;
      
      console.log(`✅ Enhanced exam analysis: ${examAnalysis.assessment_type}`);
      
      return `**Perfect!** ${examAnalysis.assessment_type.toUpperCase()}s need focused prep.

${getEnhancedProgressIndicator(AI_INTEL_STATES.SUBJECT_GRADE)}

**What subject and grade?**

*(Example: "Grade 11 Maths" or "Physical Sciences Grade 10")*`;

    case AI_INTEL_STATES.SUBJECT_GRADE:
      const subjectAnalysis = await analyzeSubjectGradeResponseFixed(text);
      const subjectCheck = checkSubjectAvailability(text);
      
      user.context.painpoint_profile.subject = subjectAnalysis.subject;
      user.context.painpoint_profile.grade = subjectAnalysis.grade;
      user.context.painpoint_profile.subject_available = subjectCheck.available;
      user.context.ai_intel_state = AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION;
      
      user.preferences.last_subject = subjectAnalysis.subject;
      user.preferences.last_grade = subjectAnalysis.grade;
      
      console.log(`✅ Enhanced subject analysis: ${subjectAnalysis.subject} Grade ${subjectAnalysis.grade} | Available: ${subjectCheck.available}`);
      
      const availabilityMessage = generateSubjectAvailabilityMessage(subjectCheck, subjectAnalysis.grade);
      
      if (!subjectCheck.available) {
        const content = availabilityMessage;
        const menu = generateEnhancedVisualMenu(AI_INTEL_STATES.SUBJECT_GRADE, user.preferences.device_type);
        return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
      }
      
      const content = `${availabilityMessage}

${getEnhancedProgressIndicator(AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION)}

**Which topics are nightmares?**

*(Be specific - Algebra? Geometry? Trigonometry?)*`;
      
      const menu = generateEnhancedVisualMenu(AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION, user.preferences.device_type);
      return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);

    case AI_INTEL_STATES.AI_PAINPOINT_EXCAVATION:
      const painpointAnalysis = await analyzePainpointResponseFixed(text, user.context.painpoint_profile);
      user.context.painpoint_profile.topic_struggles = painpointAnalysis.topics;
      user.context.ai_intel_state = AI_INTEL_STATES.AI_MICRO_TARGETING;
      
      console.log(`✅ Enhanced painpoint analysis: ${painpointAnalysis.topics}`);
      
      const microQuestion = await generateMicroTargetingFixed(text, user.context.painpoint_profile);
      
      const painpointContent = `${microQuestion}

${getEnhancedProgressIndicator(AI_INTEL_STATES.AI_MICRO_TARGETING)}`;
      
      const painpointMenu = generateEnhancedVisualMenu(AI_INTEL_STATES.AI_MICRO_TARGETING, user.preferences.device_type);
      return formatResponseWithEnhancedSeparation(painpointContent, painpointMenu, user.preferences.device_type);

    case AI_INTEL_STATES.AI_MICRO_TARGETING:
      const microAnalysis = await analyzeMicroTargetingFixed(text, user.context.painpoint_profile);
      user.context.painpoint_profile.specific_failure = microAnalysis.failure_mode;
      user.context.painpoint_profile.confidence_level = microAnalysis.confidence;
      user.context.ai_intel_state = AI_INTEL_STATES.AI_QUESTION_GENERATION;
      
      console.log(`✅ Enhanced micro analysis: ${microAnalysis.failure_mode}`);
      console.log(`🎯 FINAL ENHANCED PAINPOINT PROFILE:`, user.context.painpoint_profile);
      
      return await generateEnhancedAITargetedQuestion(user);

    case AI_INTEL_STATES.AI_QUESTION_GENERATION:
      return await handleAIQuestionInteractionFixed(user, text);

    default:
      console.warn(`⚠️ Unknown AI state: ${aiIntelState}`);
      return await showWelcomeMenu(user);
  }
}

// ===== ENHANCED AI ANALYSIS FUNCTIONS =====

async function analyzeExamTestResponseFixed(userInput) {
  const text = userInput.toLowerCase();
  
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ 
        role: "user", 
        content: `User said: "${userInput}". Is this about an EXAM or TEST? Return just "exam" or "test".` 
      }],
      max_tokens: 10,
      temperature: 0.1,
    });

    const aiResult = response.choices[0].message.content.toLowerCase().trim();
    if (aiResult.includes('exam')) return { assessment_type: 'exam' };
    if (aiResult.includes('test')) return { assessment_type: 'test' };
  } catch (error) {
    console.warn('AI analysis failed, using fallback:', error.message);
  }

  if (text.includes('exam')) return { assessment_type: 'exam' };
  if (text.includes('test')) return { assessment_type: 'test' };
  return { assessment_type: 'test' };
}

async function analyzeSubjectGradeResponseFixed(userInput) {
  const text = userInput.toLowerCase();
  
  const gradeMatch = text.match(/grade\s*(\d+)/i) || text.match(/(\d+)/);
  const grade = gradeMatch ? gradeMatch[1] : '10';
  
  let subject = 'Mathematics';
  if (text.includes('math')) subject = 'Mathematics';
  if (text.includes('physics') || text.includes('physical')) subject = 'Physical Sciences';
  if (text.includes('chemistry')) subject = 'Chemistry';
  if (text.includes('life') || text.includes('biology')) subject = 'Life Sciences';
  if (text.includes('english')) subject = 'English';
  if (text.includes('history')) subject = 'History';
  if (text.includes('geography')) subject = 'Geography';
  
  console.log(`📊 Final enhanced Subject/Grade: ${subject} Grade ${grade}`);
  return { subject, grade };
}

async function analyzePainpointResponseFixed(userInput, profile) {
  const topics = userInput.trim();
  console.log(`📊 Final enhanced Painpoint: ${topics}`);
  return { topics };
}

async function generateMicroTargetingFixed(topicInput, profile) {
  const topic = topicInput.toLowerCase();
  
  if (!profile.subject_available) {
    return `**${topicInput} challenges noted!** 

⚠️ *Limited support available for ${profile.subject}.*
**Math GOAT** can provide basic help.

**Where exactly do you struggle?**`;
  }
  
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ 
        role: "user", 
        content: `Student struggles with ${topicInput} in ${profile.subject}. Ask 1 short specific question about where they get stuck. Max 25 words. Format with bold emphasis.` 
      }],
      max_tokens: 50,
      temperature: 0.4,
    });

    let aiResponse = response.choices[0].message.content.trim();
    
    // Enhance the AI response with formatting
    aiResponse = enhanceVisualFormatting(aiResponse);
    
    return aiResponse;

  } catch (error) {
    console.warn('AI micro-targeting failed, using fallback:', error.message);
  }

  if (profile.subject === 'Mathematics') {
    if (topic.includes('factor')) {
      return `**Factoring troubles!** Where exactly? Recognizing patterns? Trinomials? Difference of squares?`;
    }
    if (topic.includes('algebra')) {
      return `**Algebra struggles!** What part? Solving equations? Simplifying? Word problems?`;
    }
    if (topic.includes('trig')) {
      return `**Trigonometry issues!** Which bit? Ratios? Equations? Graphs? Unit circle?`;
    }
  }
  
  return `**${topicInput} troubles!** Where exactly do you get stuck?`;
}

async function analyzeMicroTargetingFixed(userInput, profile) {
  const text = userInput.toLowerCase();
  
  let confidence = 'medium';
  if (text.includes('no clue') || text.includes('lost') || text.includes('confused')) {
    confidence = 'beginner';
  } else if (text.includes('sometimes') || text.includes('almost')) {
    confidence = 'advanced';
  }
  
  let failure_mode = 'general_difficulty';
  if (text.includes('formula') || text.includes('method')) {
    failure_mode = 'method_selection';
  } else if (text.includes('start') || text.includes('begin')) {
    failure_mode = 'getting_started';
  } else if (text.includes('calculation') || text.includes('numbers')) {
    failure_mode = 'calculation_errors';
  }
  
  console.log(`📊 Final enhanced Micro: ${failure_mode}, confidence: ${confidence}`);
  return { failure_mode, confidence };
}

async function generateEnhancedAITargetedQuestion(user) {
  const profile = user.context.painpoint_profile;
  
  console.log(`🎯 Final enhanced question generation:`, profile);
  
  try {
    const apiUrl = `https://goat-edtech.vercel.app/api/index?endpoint=mock-exam&grade=${profile.grade}&subject=${encodeURIComponent(profile.subject)}&questionCount=1&topics=${encodeURIComponent(profile.topic_struggles)}&painpoint=${encodeURIComponent(profile.specific_failure || '')}&confidence=${profile.confidence_level || 'medium'}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    user.context.current_question = data.mockExam?.[0];
    
    const questionText = data.mockExam?.[0]?.questionText || `Grade ${profile.grade} ${profile.subject} question on ${profile.topic_struggles}`;
    const enhancedQuestion = enhanceVisualFormatting(questionText);
    
    const content = `🎯 **${profile.topic_struggles.toUpperCase()} PRACTICE**

${getEnhancedProgressIndicator(AI_INTEL_STATES.AI_QUESTION_GENERATION)}

📝 **Question:**
${enhancedQuestion}`;
    
    const menu = generateEnhancedVisualMenu(AI_INTEL_STATES.AI_QUESTION_GENERATION, user.preferences.device_type);
    return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);

  } catch (error) {
    console.error('Enhanced question generation failed:', error);
    
    user.context.current_question = {
      questionText: `Grade ${profile.grade} ${profile.subject} practice question on ${profile.topic_struggles}`,
      solution: "Step-by-step solution will be provided"
    };
    
    const content = `🎯 **${profile.topic_struggles.toUpperCase()} PRACTICE**

${getEnhancedProgressIndicator(AI_INTEL_STATES.AI_QUESTION_GENERATION)}

📝 **Question:**
Grade ${profile.grade} ${profile.subject} practice question on ${profile.topic_struggles}`;
    
    const menu = generateEnhancedVisualMenu(AI_INTEL_STATES.AI_QUESTION_GENERATION, user.preferences.device_type);
    return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
  }
}

async function handleAIQuestionInteractionFixed(user, text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('solution') || lowerText.includes('answer')) {
    return await showEnhancedAITargetedSolution(user);
  }
  if (lowerText.includes('next') || lowerText.includes('another')) {
    return await generateEnhancedAITargetedQuestion(user);
  }
  if (lowerText.includes('menu')) {
    return await showWelcomeMenu(user);
  }
  
  const content = `I see: *"${text}"*`;
  const menu = generateEnhancedVisualMenu(AI_INTEL_STATES.AI_QUESTION_GENERATION, user.preferences.device_type);
  return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
}

async function showEnhancedAITargetedSolution(user) {
  const profile = user.context.painpoint_profile;
  const question = user.context.current_question;
  
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ 
        role: "user", 
        content: `Solve this ${profile.subject} problem step-by-step for Grade ${profile.grade} student struggling with ${profile.topic_struggles}: ${question?.questionText || 'practice problem'}. 

Format with bold steps (Step 1:, Step 2:, etc.) and clear mathematical notation. Keep solution concise but educational. Include "Therefore:" for final answer.` 
      }],
      max_tokens: 400,
      temperature: 0.3,
    });

    let solution = response.choices[0].message.content;
    
    // Apply enhanced formatting to the solution
    solution = enhanceVisualFormatting(solution);
    
    const content = `📚 **SOLUTION**

${solution}

**🎯 Strategy:** Focus on *${profile.specific_failure || 'your weak areas'}*`;
    
    const menu = generateEnhancedVisualMenu(AI_INTEL_STATES.AI_QUESTION_GENERATION, user.preferences.device_type);
    return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);

  } catch (error) {
    console.error('Enhanced solution generation failed:', error);
    
    // Fallback solution with manual formatting
    const fallbackSolution = `**Step 1:** Identify the problem type and required approach

**Step 2:** Apply the appropriate method for ${profile.topic_struggles}

**Step 3:** Show all working steps clearly

**Step 4:** Verify the answer makes sense

**Therefore:** Complete solution addressing your specific struggle with *${profile.specific_failure || 'method selection'}*`;
    
    const content = `📚 **SOLUTION**

${fallbackSolution}

**🎯 Strategy:** Target *${profile.specific_failure || 'method selection'}*`;
    
    const menu = generateEnhancedVisualMenu(AI_INTEL_STATES.AI_QUESTION_GENERATION, user.preferences.device_type);
    return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
  }
}

// ===== HOMEWORK AND MEMORY HACKS (ENHANCED WITH VISUAL FORMATTING) =====

async function startHomeworkHelp(user) {
  user.current_menu = 'homework_active';
  user.context = { step: 'waiting_for_problem' };
  
  return `📚 **Homework Helper Ready!** 🫶

⚠️ **Math GOAT is fully online**
*Other subjects have limited support.*

**Type your homework question directly:**

✍️ *Math problems*
📝 *Science questions*  
🎯 *Any subject, any grade*

**Go ahead!** 📝`;
}

async function handleHomeworkHelp(user, text) {
  console.log(`📝 Final enhanced Homework: ${text.substring(0, 50)}`);
  
  try {
    const response = await fetch('https://goat-edtech.vercel.app/api/index?endpoint=homework-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemText: text,
        grade: user.preferences.last_grade || 10,
        subject: user.preferences.last_subject || 'Mathematics',
        similarCount: 1
      })
    });
    
    const data = await response.json();
    
    let solution = data.homework?.solution || 'Working on your solution...';
    solution = enhanceVisualFormatting(solution);
    
    const content = `📚 **SOLUTION**

**Problem:** *${text}*

**Answer:**
${solution}`;
    
    const menu = `1️⃣ ➡️ Another Problem
2️⃣ 📝 Practice Questions
3️⃣ 🔄 Different Subject
4️⃣ 🏠 Main Menu`;
    
    return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);

  } catch (error) {
    const content = `📚 **Working on:** *"${text}"*

Solution coming up...`;
    
    const menu = `1️⃣ ➡️ Try Again
2️⃣ 📝 Different Problem  
3️⃣ 🔄 Switch Subject
4️⃣ 🏠 Main Menu`;
    
    return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
  }
}

async function startMemoryHacks(user) {
  user.current_menu = 'memory_hacks_active';
  user.context = { step: 'waiting_for_subject' };
  
  return `🧮 **Tips & Hacks Vault!** ✨

⚠️ **Math GOAT memory hacks are best**
*Other subjects have basic hacks.*

**SA-specific memory tricks:**

🧠 *Local landmarks & culture*
🎵 *Language-based mnemonics*  
📚 *Subject shortcuts*

**What subject?** *(Math, Science, English, etc.)*`;
}

async function handleMemoryHacksFlow(user, text) {
  console.log(`🧠 Final enhanced Memory hacks: ${text.substring(0, 50)}`);
  
  let subject = 'Mathematics';
  if (text.toLowerCase().includes('science')) subject = 'Physical Sciences';
  if (text.toLowerCase().includes('english')) subject = 'English';
  
  const subjectCheck = checkSubjectAvailability(text);
  
  try {
    const response = await fetch('https://goat-edtech.vercel.app/api/index?endpoint=memory-hacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: subject,
        topic: 'general',
        grade: user.preferences.last_grade || 10,
        count: 1
      })
    });
    
    const data = await response.json();
    const hack = data.memoryHacks?.hacks?.[0];
    
    const availabilityNote = !subjectCheck.available ? 
      `\n⚠️ **Limited ${subject} hacks available**` : '';
    
    let hackContent = hack?.content || 'Using local landmarks and culture to remember key concepts';
    hackContent = enhanceVisualFormatting(hackContent);
    
    const content = `🧠 **${subject} Memory Hack** ✨${availabilityNote}

**${hack?.title || 'SA Memory Trick'}**

💡 ${hackContent}`;
    
    const menu = `1️⃣ ➡️ More Hacks
2️⃣ 📝 Practice Questions
3️⃣ 🔄 Different Subject  
4️⃣ 🏠 Main Menu`;
    
    return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);

  } catch (error) {
    const content = `🧠 **Creating ${subject} memory hacks...**

*SA-specific tricks coming up!*`;
    
    const menu = `1️⃣ ➡️ Continue
2️⃣ 📝 Try Different Topic
3️⃣ 🔄 Switch Subject
4️⃣ 🏠 Main Menu`;
    
    return formatResponseWithEnhancedSeparation(content, menu, user.preferences.device_type);
  }
}

// ===== KEEP ALL EXISTING API HANDLERS (FINAL ENHANCED VERSIONS) =====

async function handleMockExam(req, res, start) {
  const { grade = 10, subject = 'Mathematics', questionCount = 1, topics = 'general', painpoint = '', confidence = 'medium' } = req.query;
  
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Generate 1 Grade ${grade} ${subject} practice question on ${topics}. 
${painpoint ? `Target student struggle: ${painpoint}` : ''}
Confidence level: ${confidence}
Make it CAPS-aligned, concise, and well-formatted with bold emphasis where appropriate.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.3,
    });

    let content = response.choices[0].message.content;
    content = enhanceVisualFormatting(content);
    
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      mockExam: [{
        questionNumber: 1,
        questionText: content.substring(0, 300),
        solution: "Enhanced step-by-step solution provided on request",
        marksAllocated: 5
      }],
      metadata: {
        final_fine_tuning: true,
        enhanced_visuals: true,
        device_responsive: true,
        progress: "98%",
        tokensUsed: response.usage?.total_tokens || 0
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: "Final enhanced question generation failed",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleHomeworkOCR(req, res, start) {
  const { problemText, grade = 10, subject = 'Mathematics' } = req.body;

  if (!problemText) {
    return res.status(400).json({
      error: "Missing homework problem",
      timestamp: new Date().toISOString()
    });
  }

  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ 
        role: "user", 
        content: `Solve this problem step-by-step with bold formatting for steps: ${problemText}` 
      }],
      max_tokens: 400,
      temperature: 0.3,
    });

    let solution = response.choices[0].message.content;
    solution = enhanceVisualFormatting(solution);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      homework: {
        originalProblem: problemText,
        solution: solution,
        processed: "Final enhanced AI solution with visual formatting"
      },
      metadata: {
        final_fine_tuning: true,
        enhanced_visuals: true,
        progress: "98%",
        tokensUsed: response.usage?.total_tokens || 0
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: "Final enhanced homework processing failed",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleMemoryHacks(req, res, start) {
  const { subject = 'Mathematics', topic = 'general', grade = 10 } = req.body;

  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ 
        role: "user", 
        content: `Create 1 enhanced SA memory hack for Grade ${grade} ${subject}. Use local culture/landmarks. Format with bold emphasis. Max 60 words.` 
      }],
      max_tokens: 120,
      temperature: 0.7,
    });

    let content = response.choices[0].message.content;
    content = enhanceVisualFormatting(content);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      memoryHacks: {
        subject,
        grade: parseInt(grade),
        hacks: [{
          title: `Enhanced ${subject} Memory Trick`,
          content: content,
          saContext: "Enhanced South African cultural references with visual formatting"
        }]
      },
      metadata: {
        final_fine_tuning: true,
        enhanced_visuals: true,
        device_responsive: true,
        progress: "98%",
        tokensUsed: response.usage?.total_tokens || 0
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: "Final enhanced memory hack generation failed",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleDatabaseTest(req, res, start) {
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    database: {
      status: "simulated - final enhanced system",
      message: "Database with enhanced visuals, smart context, and responsive design",
      progress: "98% complete - final fine tuning applied"
    }
  });
}

async function handleOpenAITest(req, res, start) {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Test final enhanced GOAT system with visual formatting" }],
      max_tokens: 30,
    });

    let testResponse = response.choices[0].message.content;
    testResponse = enhanceVisualFormatting(testResponse);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      user: "sophoniagoat",
      openai: {
        status: "FINAL ENHANCED SYSTEM ACTIVE",
        model: "gpt-3.5-turbo",
        features: "Enhanced visuals, smart context, device responsive, 98% progress",
        test_response: testResponse,
        tokensUsed: response.usage?.total_tokens || 0
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: "Final enhanced OpenAI test failed",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}