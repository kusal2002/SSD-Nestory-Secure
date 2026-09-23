/**
 * Set a user's password by email (local/dev recovery). Uses the same hashing as the app.
 *
 * Usage: npm run reset-password -- <email> <newPassword>
 * Example: npm run reset-password -- parent@gmail.com MyNewPass123
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const [, , emailArg, newPassword] = process.argv;

async function run() {
  if (!emailArg || !newPassword) {
    console.error("Usage: npm run reset-password -- <email> <newPassword>");
    process.exit(1);
  }
  if (newPassword.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI in backend/.env");
    process.exit(1);
  }

  const email = String(emailArg).trim().toLowerCase();

  await mongoose.connect(process.env.MONGO_URI, { dbName: "nestory" });

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.password = newPassword;
  await user.save();

  console.log(`Password updated for ${email} (${user.role}).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
