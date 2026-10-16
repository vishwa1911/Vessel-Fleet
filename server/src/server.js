require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User');
const { seedDatabase } = require('./seed/seedData');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is empty (e.g. fresh MongoDB Atlas on Render)
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[AutoSeed] Empty database detected. Seeding initial maritime demo data...');
        await seedDatabase();
        console.log('[AutoSeed] Database initialized successfully.');
      }
    } catch (seedErr) {
      console.warn(`[AutoSeed Warning]: ${seedErr.message}`);
    }

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` ⚓ VESSELFLEET MARITIME COMMAND BACKEND ONLINE`);
      console.log(` 🌐 Server running on http://localhost:${PORT}`);
      console.log(` 📄 API Docs available at http://localhost:${PORT}/api/docs`);
      console.log(` 🚢 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });

    process.on('unhandledRejection', (err) => {
      console.error(`[UnhandledRejection Error]: ${err.message}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
