// lib/features/exam-prep/intelligence.js (STUB for backward compatibility)
/**
 * Legacy Intelligence System Stub
 * GOAT Bot 2.0
 * Created: 2025-08-27 09:59:00 UTC
 * Developer: DithetoMokgabudi
 * Note: This is a compatibility stub. Real logic is in image-intelligence.js
 */

async function startAIIntelligenceGathering(user) {
  // Redirect to image-first prompt
  return `📸 **Exam/Test Help is now image-only!**

Upload a clear photo of the problem you're struggling with, and I'll:
✅ Instantly understand your specific challenge  
✅ Detect any foundation gaps
✅ Create targeted practice questions
✅ Guide you through solution steps

Just upload your image to get started! 📱`;
}

async function processUserResponse(user, message) {
  // Redirect to image-first prompt
  return `📸 **Exam/Test Help is image-only now!**

Please upload a photo of your homework or test question, and I'll provide instant intelligent help.`;
}

module.exports = {
  startAIIntelligenceGathering,
  processUserResponse,
};

