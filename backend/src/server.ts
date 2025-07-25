import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth';
import budgetRoutes from './routes/budget';
import bankRoutes from './routes/bank';
import transactionRoutes from './routes/transactions';
import scenarioRoutes from './routes/scenarios';
import categoryRoutes from './routes/categories';
import timelineRoutes from './routes/timeline';
import assetsRouter from './routes/assets';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/assets', assetsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-planner';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = (server: any) => {
  console.log('Received shutdown signal. Starting graceful shutdown...');
  
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Start server with retry logic
const startServer = async (retries = 3) => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown(server));
    process.on('SIGINT', () => gracefulShutdown(server));

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, retrying...`);
        server.close();
        
        if (retries > 0) {
          setTimeout(() => {
            startServer(retries - 1);
          }, 1000);
        } else {
          console.error(`Could not start server after ${3 - retries} retries`);
          process.exit(1);
        }
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    if (retries > 0) {
      console.log(`Retrying in 1 second... (${retries} attempts remaining)`);
      setTimeout(() => {
        startServer(retries - 1);
      }, 1000);
    } else {
      process.exit(1);
    }
  }
};

startServer();