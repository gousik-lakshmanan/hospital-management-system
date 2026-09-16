import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

// 1. Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// 2. Connect to MongoDB Atlas first, then start listening
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`MediSync AI Backend Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n[ERROR] Port ${PORT} is already in use by another process.`);
        console.error(`To free port ${PORT} on Windows PowerShell, run:`);
        console.error(`  Get-NetTCPConnection -LocalPort ${PORT} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n`);
      } else {
        console.error(`Server error: ${error.message}`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
