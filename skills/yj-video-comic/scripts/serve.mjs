import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, normalize, resolve } from 'node:path';

const get = (key, fallback) => { const i = process.argv.indexOf(key); return i >= 0 ? process.argv[i + 1] : fallback; };
const root = resolve(get('--root', '.'));
const port = Number(get('--port', '4173'));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.png': 'image/png' };

createServer((req, res) => {
  let rel = decodeURIComponent((req.url || '/').split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const path = resolve(root, '.' + normalize(rel));
  if (!(path === root || path.startsWith(root + '\\') || path.startsWith(root + '/')) || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': mime[extname(path).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
  createReadStream(path).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`预览：http://127.0.0.1:${port}`));
