import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT || process.env.SERVER_PORT || 3000);
const distDir = path.join(__dirname, 'dist');
const indexFile = path.join(distDir, 'index.html');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
};

const sendFile = async (filePath, response) => {
  const extension = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[extension] || 'application/octet-stream';
  const fileStat = await stat(filePath);

  response.writeHead(200, {
    'Content-Length': fileStat.size,
    'Content-Type': type,
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=86400',
  });

  createReadStream(filePath).pipe(response);
};

const server = http.createServer(async (request, response) => {
  if (!existsSync(indexFile)) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Build not found. Run npm run build before npm start.');
    return;
  }

  try {
    const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

    if (requestUrl.pathname === '/health') {
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    const safePath = path.normalize(decodeURIComponent(requestUrl.pathname)).replace(/^(\.\.[/\\])+/, '');
    const requestedFile = path.join(distDir, safePath === '/' ? 'index.html' : safePath);

    if (existsSync(requestedFile)) {
      const fileInfo = await stat(requestedFile);
      if (fileInfo.isFile()) {
        await sendFile(requestedFile, response);
        return;
      }
    }

    await sendFile(indexFile, response);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal server error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Centum server listening on port ${port}`);
});
