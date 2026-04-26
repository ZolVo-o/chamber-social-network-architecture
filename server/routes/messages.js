import { Router } from 'express';

import { db } from '../db/sqlite.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeMessage } from '../utils/serializers.js';

const router = Router();

router.post('/', requireAuth, (request, response) => {
  const roomId = String(request.body?.roomId || '').trim();
  const content = String(request.body?.content || '').trim();
  const mediaUrl = String(request.body?.mediaUrl || '').trim();

  if (!roomId) {
    response.status(400).json({ error: 'Не указана комната.' });
    return;
  }

  if (!content && !mediaUrl) {
    response.status(400).json({ error: 'Сообщение не может быть пустым.' });
    return;
  }

  const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(roomId);
  if (!room) {
    response.status(404).json({ error: 'Комната не найдена.' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO messages (room_id, user_id, content, media_url)
    VALUES (?, ?, ?, ?)
  `).run(roomId, request.user.id, content, mediaUrl || null);

  const row = db.prepare(`
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
    WHERE messages.id = ?
  `).get(result.lastInsertRowid);

  response.status(201).json({ message: serializeMessage(row) });
});

router.delete('/:id', requireAuth, (request, response) => {
  const message = db.prepare('SELECT id, user_id FROM messages WHERE id = ?').get(request.params.id);

  if (!message) {
    response.status(404).json({ error: 'Сообщение не найдено.' });
    return;
  }

  if (message.user_id !== request.user.id) {
    response.status(403).json({ error: 'Можно удалять только свои сообщения.' });
    return;
  }

  db.prepare('DELETE FROM messages WHERE id = ?').run(request.params.id);
  response.status(204).end();
});

export default router;
