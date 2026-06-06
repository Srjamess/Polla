const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = process.env.PREVIEW_PORT || 5173;
const root = path.join(__dirname, '..', 'client');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8'
};

http
  .createServer((req, res) => {
    let pathname = decodeURIComponent(req.url.split('?')[0]);

    if (pathname === '/') {
      pathname = '/index.html';
    }

    const filePath = path.normalize(path.join(root, pathname));

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream'
      });
      res.end(data);
    });
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`Static preview running on http://127.0.0.1:${PORT}`);
  });
