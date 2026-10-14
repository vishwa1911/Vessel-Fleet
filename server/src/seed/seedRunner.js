require('dotenv').config();
const mongoose = require('mongoose');
const { seedDatabase } = require('./seedData');
const connectDB = require('../config/db');

async function run() {
  try {
    await connectDB();
    await seedDatabase();
    console.log('[SeedRunner] Seeding completed. Exiting.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[SeedRunner Error]:', error);
    process.exit(1);
  }
}

run();
