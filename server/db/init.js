import bcrypt from 'bcryptjs';

import { DEFAULT_ROOMS, DEVELOPER_ACCOUNT } from '../config.js';
import { db } from './sqlite.js';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'resident',
      status TEXT NOT NULL DEFAULT 'В сети',
      avatar_url TEXT NOT NULL,
      invite_code_used TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      media_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, name, description)
    VALUES (@id, @name, @description)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description
  `);

  for (const room of DEFAULT_ROOMS) {
    insertRoom.run(room);
  }

  const existingDeveloper = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(DEVELOPER_ACCOUNT.username);

  if (!existingDeveloper) {
    db.prepare(`
      INSERT INTO users (name, username, password_hash, role, status, avatar_url, invite_code_used)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      DEVELOPER_ACCOUNT.name,
      DEVELOPER_ACCOUNT.username,
      bcrypt.hashSync(DEVELOPER_ACCOUNT.password, 10),
      DEVELOPER_ACCOUNT.role,
      'Разработчик в сети',
      createAvatarUrl(DEVELOPER_ACCOUNT.username),
      'CHAMBER',
    );
  }
}

function createAvatarUrl(seed) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}
