import pkg from 'pg';
const { Pool } = pkg;
import mongoose from 'mongoose';

// PostgreSQL Connection Pool
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set (PostgreSQL)");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper for PostgreSQL queries
export const pgQuery = (text: string, params?: any[]) => pool.query(text, params);

// MongoDB Connection
if (!process.env.MONGODB_URL) {
  console.warn("MONGODB_URL not set. MongoDB features will be disabled.");
}

export const connectMongoDB = async () => {
  if (!process.env.MONGODB_URL) return;
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};
