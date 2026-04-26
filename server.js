import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import express from 'express';

import { createApp } from './server/app.js';
import { PORT } from './server/config.js';
import { initDatabase } from './server/db/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initDatabase();

const app = createApp();
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Centum server listening on port ${PORT}`);
});
