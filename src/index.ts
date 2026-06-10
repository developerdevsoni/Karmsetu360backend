import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { logger } from './config/logger';
import { setupSwagger } from './config/swagger';
import router from './routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api/', limiter);

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Swagger API Documentation Setup
setupSwagger(app);

// Mount main routes
app.use('/api', router);
app.use('/api/v1', router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'Healthy',
    uptime: `${process.uptime().toFixed(2)}s`,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

const startServer = async () => {
  try {


    app.listen(PORT, () => {
      logger.info(`Server booted in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`Interactive API document portal: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Startup sequence failed: ' + error);
    process.exit(1);
  }
};

startServer();
