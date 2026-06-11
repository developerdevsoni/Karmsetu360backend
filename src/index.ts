import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { logger } from './config/logger';
import { setupSwagger } from './config/swagger';
import { clientRouter, adminRouter } from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/logging.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Request Logging Middleware
app.use(requestLogger);

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
app.use('/api/v1/client', clientRouter);
app.use('/api/v1/admin', adminRouter);

// Backwards compatibility for legacy root prefixes mapping to client routes
app.use('/api', clientRouter);
app.use('/api/v1', clientRouter);

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
