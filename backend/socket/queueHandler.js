import { Queue, QueueToken } from '../models/index.js';

export const setupQueueHandlers = (io, socket) => {
  socket.on('joinQueue', async (queueId) => {
    try {
      socket.join(`queue_${queueId}`);
      console.log(`Socket ${socket.id} joined queue ${queueId}`);
      
      const queue = await Queue.findById(queueId);
      if (queue) {
        socket.emit('queueState', {
          queueId: queue._id,
          currentToken: queue.currentToken,
          status: queue.status
        });
      }
    } catch (error) {
      console.error('Error joining queue:', error);
    }
  });

  socket.on('leaveQueue', (queueId) => {
    socket.leave(`queue_${queueId}`);
    console.log(`Socket ${socket.id} left queue ${queueId}`);
  });

  socket.on('subscribeToToken', async (tokenId) => {
    try {
      const token = await QueueToken.findById(tokenId);
      if (token) {
        socket.join(`token_${tokenId}`);
        console.log(`Socket ${socket.id} subscribed to token ${tokenId}`);
      }
    } catch (error) {
      console.error('Error subscribing to token:', error);
    }
  });

  socket.on('unsubscribeFromToken', (tokenId) => {
    socket.leave(`token_${tokenId}`);
    console.log(`Socket ${socket.id} unsubscribed from token ${tokenId}`);
  });
};
