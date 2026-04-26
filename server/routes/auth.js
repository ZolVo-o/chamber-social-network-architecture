import bcrypt from 'bcryptjs';
import { Router } from 'express';

import { INVITE_CODES, SPECIAL_ACCESS_CODE } from '../config.js';
import { db } from '../db/sqlite.js';
import { requireAuth } from '../middleware/auth.js';
import { signToken } from '../utils/jwt.js';
import { serializeUser } from '../utils/serializers.js';

const router = Router();

router.post('/register', (request, response) => {
  const { name, username, password, inviteCode, specialCode } = request.body ?? {};

  const normalizedName = String(name || '').trim();
  const normalizedUsername = String(username || '').trim().replace(/^@+/, '');
  const normalizedInviteCode = String(inviteCode || '').trim().toUpperCase();
  const normalizedSpecialCode = String(specialCode || '').trim().toUpperCase();
  const normalizedPassword = String(password || '');

  if (normalizedName.length < 2) {
    response.status(400).json({ error: 'Укажи имя минимум из 2 символов.' });
    return;
  }

  if (normalizedUsername.length < 3) {
    response.status(400).json({ error: 'Юзернейм должен содержать минимум 3 символа.' });
    return;
  }

  if (normalizedPassword.length < 6) {
    response.status(400).json({ error: 'Пароль должен содержать минимум 6 символов.' });
    return;
  }

  if (!INVITE_CODES.includes(normalizedInviteCode)) {
    response.status(400).json({ error: 'Неверный код приглашения.' });
    return;
  }

  if (normalizedSpecialCode !== SPECIAL_ACCESS_CODE) {
    response.status(400).json({ error: 'Неверный специальный код доступа.' });
    return;
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(normalizedUsername);
  if (existingUser) {
    response.status(409).json({ error: 'Такой юзернейм уже занят.' });
    return;
  }

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedUsername)}`;
  const passwordHash = bcrypt.hashSync(normalizedPassword, 10);

  const insert = db.prepare(`
    INSERT INTO users (name, username, password_hash, role, status, avatar_url, invite_code_used)
    VALUES (?, ?, ?, 'resident', 'В сети', ?, ?)
  `);

  const result = insert.run(normalizedName, normalizedUsername, passwordHash, avatarUrl, normalizedInviteCode);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

  response.status(201).json({
    token: signToken({ userId: user.id }),
    user: serializeUser(user),
  });
});

router.post('/login', (request, response) => {
  const normalizedUsername = String(request.body?.username || '').trim().replace(/^@+/, '');
  const password = String(request.body?.password || '');

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(normalizedUsername);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    response.status(401).json({ error: 'Неверный логин или пароль.' });
    return;
  }

  response.json({
    token: signToken({ userId: user.id }),
    user: serializeUser(user),
  });
});

router.get('/me', requireAuth, (request, response) => {
  response.json({ user: request.user });
});

export default router;
