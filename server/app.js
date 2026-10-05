import express from 'express';
import cors from 'cors';
import { getCorsOptions } from './config/corsConfig.js';
import roomRoutes from './routes/roomRoutes.js';
import { loggerMiddleware } from './middleware/loggerMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Global Middleware
app.use(cors(getCorsOptions()));
app.use(express.json());
app.use(loggerMiddleware);


// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the YouTube Watch Party API!',
  });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'YouTube Watch Party Backend API is running',
  });
});

// API Routes
app.use('/api/rooms', roomRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
