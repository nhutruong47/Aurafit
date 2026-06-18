const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '127.0.0.1';
const root = path.resolve(__dirname, '..', 'dist');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath);

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (statErr, stat) => {
      if (statErr || !stat.isFile()) {
        filePath = path.join(root, 'index.html');
      }

      fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
          res.writeHead(500);
          res.end('Server error');
          return;
        }

        res.writeHead(200, {
          'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
        });
        res.end(data);
      });
    });
  })
  .listen(port, host, () => {
    console.log(`AuraFit frontend: http://${host}:${port}/`);
  });
