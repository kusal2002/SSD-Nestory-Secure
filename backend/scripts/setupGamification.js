const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { initializeGamificationSystem } = require('../utils/initGamification');

// Load environment variables
dotenv.config();

// Connect to Database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Main function to setup gamification
const setupGamification = async () => {
  try {
    console.log('🚀 Starting Gamification System Setup...\n');
    
    // Connect to database
    await connectDB();
    
    // Initialize gamification system
    await initializeGamificationSystem();
    
    console.log('\n✨ Gamification System Setup Complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start your server: npm start');
    console.log('   2. Test endpoints using Postman (see GAMIFICATION_POSTMAN_GUIDE.md)');
    console.log('   3. Integrate gamification into your story and assignment flows\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
};

// Run setup
setupGamification();
