const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongodInstance = null;

const connectDB = async () => {
  const envUri = process.env.DATABASE_URL;

  // In test mode, prefer in-memory server to avoid polluting dev database
  if (process.env.NODE_ENV === 'test') {
    mongodInstance = await MongoMemoryServer.create();
    const testUri = mongodInstance.getUri();
    await mongoose.connect(testUri);
    console.log(`[DB] Connected to in-memory test database`);
    return;
  }

  if (envUri) {
    try {
      await mongoose.connect(envUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`[DB] Connected to MongoDB at ${envUri}`);
      return;
    } catch (err) {
      console.warn(`[DB] Could not connect to external MongoDB (${err.message}). Falling back to embedded MongoMemoryServer...`);
    }
  }

  // Fallback for zero-config local run
  mongodInstance = await MongoMemoryServer.create();
  const fallbackUri = mongodInstance.getUri();
  await mongoose.connect(fallbackUri);
  console.log(`[DB] Zero-config in-memory MongoDB initialized successfully at ${fallbackUri}`);
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('[DB] Disconnect error:', err);
  }
};

module.exports = { connectDB, disconnectDB };
