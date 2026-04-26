import { db } from '../db/sqlite.js';
import { verifyToken } from '../utils/jwt.js';
import { serializeUser } from '../utils/serializers.js';

export function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    response.status(401).json({ error: 'Требуется авторизация.' });
    return;
  }

  try {
    const token = authHeader.slice('Bearer '.length);
    const payload = verifyToken(token);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);

    if (!user) {
      response.status(401).json({ error: 'Пользователь не найден.' });
      return;
    }

    request.user = serializeUser(user);
    next();
  } catch {
    response.status(401).json({ error: 'Недействительный токен.' });
  }
}
