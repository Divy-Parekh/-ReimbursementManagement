const app = require('./app');
const prisma = require('./utils/prisma');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure database connection before starting the server
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Synchronized with PostgreSQL database');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('🛑 PostgreSQL connection closed');
  process.exit(0);
});

startServer();

// Export prisma instance to be used by other parts of the app
module.exports = { prisma };
