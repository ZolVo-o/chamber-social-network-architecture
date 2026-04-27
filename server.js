import path from 'node:path';
import { existsSync } from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { Server } from 'socket.io';

import { createApp } from './server/app.js';
import { PORT } from './server/config.js';
import { initDatabase } from './server/db/init.js';
import { db } from './server/db/sqlite.js';
import { verifyToken } from './server/utils/jwt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initDatabase();

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

app.locals.io = io;

io.use((socket, next) => {
  const token = typeof socket.handshake.auth?.token === 'string'
    ? socket.handshake.auth.token
    : typeof socket.handshake.query?.token === 'string'
      ? socket.handshake.query.token
      : '';

  if (!token) {
    next(new Error('Требуется авторизация.'));
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(payload.userId);

    if (!user) {
      next(new Error('Пользователь не найден.'));
      return;
    }

    socket.data.userId = user.id;
    next();
  } catch {
    next(new Error('Недействительный токен.'));
  }
});

io.on('connection', (socket) => {
  socket.on('room:join', (roomId) => {
    if (typeof roomId !== 'string' || roomId.trim() === '') {
      return;
    }

    void socket.join(`room:${roomId.trim()}`);
  });

  socket.on('room:leave', (roomId) => {
    if (typeof roomId !== 'string' || roomId.trim() === '') {
      return;
    }

    void socket.leave(`room:${roomId.trim()}`);
  });
});

const distDir = path.join(__dirname, 'dist');
const indexFile = path.join(distDir, 'index.html');

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

if (existsSync(distDir)) {
  app.use(express.static(distDir));

  app.get('/{*path}', (_request, response) => {
    response.sendFile(indexFile);
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Centum server listening on port ${PORT}`);
});
