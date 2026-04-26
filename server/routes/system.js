import { Router } from 'express';

import { db } from '../db/sqlite.js';

const router = Router();

router.get('/status', (_request, response) => {
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const messageCount = db.prepare('SELECT COUNT(*) AS count FROM messages').get().count;
  const roomCount = db.prepare('SELECT COUNT(*) AS count FROM rooms').get().count;

  response.json({
    status: 'ok',
    userCount,
    messageCount,
    roomCount,
  });
});

export default router;
