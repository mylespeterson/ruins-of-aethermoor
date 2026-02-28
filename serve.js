#!/usr/bin/env node
// Zero-dependency local dev server for Ruins of Aethermoor.
// Usage: node serve.js [port]
// Then open http://localhost:8000 (or the port you chose) in your browser.

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2], 10) || 8000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Decode the URL then resolve to an absolute path, and verify it stays
  // inside ROOT to prevent directory traversal (including encoded sequences).
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.resolve(ROOT, '.' + urlPath);
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Default to index.html for directory requests (single stat call)
  let stat;
  try { stat = fs.statSync(filePath); } catch (_) { stat = null; }
  if (stat && stat.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\nRuins of Aethermoor dev server running at:\n`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log('Press Ctrl+C to stop.\n');
});
