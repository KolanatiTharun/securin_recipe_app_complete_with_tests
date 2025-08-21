import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/recipes_db';
export async function connectDB() { if (mongoose.connection.readyState === 1) return mongoose.connection; await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }); return mongoose.connection; }
