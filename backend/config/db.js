const mongoose = require("mongoose");

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);

    if (error.message.includes("querySrv") || error.message.includes("ECONNREFUSED")) {
      console.error("💡 Tip: Check your MongoDB Atlas dashboard — the cluster may be paused or your IP may not be whitelisted.");
    }

    if (attempt < MAX_RETRIES) {
      console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => connectDB(attempt + 1), RETRY_DELAY_MS);
    } else {
      console.error("❌ All connection attempts failed. Exiting.");
      process.exit(1);
    }
  }
};

module.exports = connectDB;
