import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import taskRoutes from './routes/taskRoutes.js';
import authRoutes from './routes/authRoutes.js';

// Ensure dotenv loads first before process.env is accessed
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas (tanvi_projects database)
connectDB();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Mount Authentication routes (available at /auth/... and aliases /register, /login, /me)
app.use('/auth', authRoutes);
app.use('/', authRoutes);

// Mount Task REST API routes (protected with JWT auth middleware)
app.use('/tasks', taskRoutes);

// Health check / API status route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Task Manager API with JWT Auth is running',
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('[API Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;