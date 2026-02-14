import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { authRoutes, businessRoutes, queueRoutes, tokenRoutes, paymentRoutes } from './routes/index.js';
import { setupQueueHandlers } from './socket/queueHandler.js';

dotenv.config();

connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'QueueLess API is running' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  setupQueueHandlers(io, socket);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only start server if not running on Vercel (Vercel uses serverless)
if (process.env.VERCEL !== '1') {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { io };
export default app;
