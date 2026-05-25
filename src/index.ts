import express, { type Express, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '@/config/db';
import logger from '@/utils/logger';
import { setupSwagger } from '@/utils/swagger.js';
import { 
  securityHeadersMiddleware, 
  globalRateLimit, 
  authRateLimit, 
  apiRateLimit
} from '@/utils/security.js';

// API Routes
import authRoutes from '@/routes/auth.routes.js';
import protectedRoutes from '@/routes/protected.routes.js';
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Enhanced Security Headers (skipped for /docs)
app.use(securityHeadersMiddleware);
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Global Rate Limiting
app.use(globalRateLimit);

// JSON parsing with error handling
app.use((req, res, next) => {
  express.json({
    limit: '10mb'
  })(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid JSON format',
        error: 'Malformed JSON in request body'
      });
    }
    next();
  });
});
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (_: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'API is healthy' });
});

// Apply specific rate limiting to different route groups
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/protected', apiRateLimit, protectedRoutes);

// Swagger Documentation (before error handlers)
setupSwagger(app);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start Server
app.listen(port, async () => {
  // Connect to the database
  await connectDB();

  logger.info(`Server is running at http://localhost:${port}`);
});
