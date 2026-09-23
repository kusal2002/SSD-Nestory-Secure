const GamificationService = require('../services/gamification/gamificationService');

/**
 * Initialize gamification system with default data
 * Run this once to setup default badges and achievements
 */
async function initializeGamificationSystem() {
  try {
    console.log('🎮 Initializing Gamification System...');
    
    // Initialize default badges
    await GamificationService.initializeDefaultBadges();
    
    // Initialize default achievements
    await GamificationService.initializeDefaultAchievements();
    
    console.log('✅ Gamification System initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing gamification system:', error);
  }
}

module.exports = { initializeGamificationSystem };
