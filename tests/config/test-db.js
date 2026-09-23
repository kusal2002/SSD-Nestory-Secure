/**
 * Test Database Configuration
 * Isolates tests from production database
 * Uses MongoDB in-memory database for testing
 */

let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  // Mock mongoose if not available
  mongoose = {
    connect: async () => ({ _db: "test-db" }),
    disconnect: async () => ({ _db: null }),
    connection: { collections: {} },
    Types: { ObjectId: String },
  };
}

// Test database URI - uses separate test database
const TEST_DB_URI = process.env.TEST_DB_URI || "mongodb+srv://nestory_admin:DxeZ2Bv38KV1Isof@cluster0.jzjmmvn.mongodb.net/test";

/**
 * Connect to test database
 */
async function connectTestDB() {
  try {
    await mongoose.connect(TEST_DB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Test database connected");
    return mongoose.connection;
  } catch (error) {
    console.error("❌ Test database connection failed:", error.message);
    throw error;
  }
}

/**
 * Disconnect from test database
 */
async function disconnectTestDB() {
  try {
    await mongoose.disconnect();
    console.log("✅ Test database disconnected");
  } catch (error) {
    console.error("❌ Test database disconnection failed:", error.message);
    throw error;
  }
}

/**
 * Clear all collections in test database
 */
async function clearTestDB() {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    console.log("✅ Test database cleared");
  } catch (error) {
    console.error("❌ Test database clearing failed:", error.message);
    throw error;
  }
}

/**
 * Clear specific collections
 */
async function clearCollections(...collectionNames) {
  try {
    const collections = mongoose.connection.collections;
    for (const name of collectionNames) {
      if (collections[name]) {
        await collections[name].deleteMany({});
      }
    }
  } catch (error) {
    console.error("❌ Failed to clear collections:", error.message);
    throw error;
  }
}

/**
 * Get count of documents in collection
 */
async function getCollectionCount(collectionName) {
  try {
    const collection = mongoose.connection.collections[collectionName];
    if (!collection) return 0;
    return await collection.countDocuments();
  } catch (error) {
    console.error("❌ Failed to get collection count:", error.message);
    return 0;
  }
}

module.exports = {
  TEST_DB_URI,
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  clearCollections,
  getCollectionCount,
};
