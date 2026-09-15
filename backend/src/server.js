require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./services/socketService');
const seedData = require('./seeds/seed');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO with server
initSocket(server, process.env.CLIENT_URL || '*');

const startServer = async () => {
  try {
    await connectDB();

    // Run auto-seed if running in non-test mode
    if (process.env.NODE_ENV !== 'test') {
      await seedData();
    }

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` Marketplace Server running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api`);
      console.log(` Socket.IO Server active`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal Server Boot Error:', err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server, startServer };
