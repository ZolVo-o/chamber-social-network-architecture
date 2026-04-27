import express from 'express';

import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import roomRoutes from './routes/rooms.js';
import systemRoutes from './routes/system.js';

export function createApp() {
  const app = express();

  app.locals.realtime = {
    broadcast(roomId, event, payload) {
      const io = app.locals.io;
      if (!io) {
        return;
      }

      io.to(`room:${roomId}`).emit(event, payload);
    },
  };

  app.use(express.json({ limit: '1mb' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/system', systemRoutes);

  app.use('/api/*rest', (_request, response) => {
    response.status(404).json({ error: 'API route not found.' });
  });

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}
