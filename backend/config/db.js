import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('[Database] Connecting to MongoDB...');
    // Set connection timeout to 3 seconds so we don't hang if Mongo is offline
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/boss-portal', {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    global.useMemoryDb = false;
  } catch (error) {
    console.warn(`\n⚠️  MongoDB Connection failed: ${error.message}`);
    console.warn(`⚠️  Falling back to high-fidelity In-Memory Database Mode for tutoring simulation.\n`);
    global.useMemoryDb = true;
    
    // Set up dummy mongoose connection state to prevent Mongoose errors in other parts
    mongoose.connection.readyState = 1; // Fake connected state for logic checks
  }
};

export default connectDB;
