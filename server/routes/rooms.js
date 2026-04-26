import { Router } from 'express';

import { db } from '../db/sqlite.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeMessage } from '../utils/serializers.js';

const router = Router();

router.get('/', requireAuth, (_request, response) => {
  const rooms = db.prepare('SELECT id, name, description FROM rooms ORDER BY rowid ASC').all();
  response.json({ rooms });
});

router.get('/:roomId/messages', requireAuth, (request, response) => {
  const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(request.params.roomId);
  if (!room) {
    response.status(404).json({ error: 'Комната не найдена.' });
    return;
  }

  const rows = db.prepare(`
    SELECT
      messages.id,
      messages.room_id,
      messages.content,
      messages.media_url,
      messages.created_at,
      users.id AS user_id,
      users.name,
      users.username,
      users.role,
      users.status,
      users.avatar_url
    FROM messages
    JOIN users ON users.id = messages.user_id
    WHERE messages.room_id = ?
    ORDER BY messages.created_at DESC, messages.id DESC
    LIMIT 100
  `).all(request.params.roomId);

  response.json({ messages: rows.map(serializeMessage) });
});

export default router;
