import fs from 'node:fs';

import Database from 'better-sqlite3';

import { DATA_DIR, DB_PATH } from '../config.js';

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
