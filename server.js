const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, 'out');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain',
  '.php': 'text/plain', // serve php as plain text (static only)
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // Strip query string and decode URI
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(STATIC_DIR, urlPath);

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      // Serve index.html inside directory
      serveFile(res, path.join(filePath, 'index.html'));
    } else if (!err && stat.isFile()) {
      serveFile(res, filePath);
    } else {
      // Try appending .html (Next.js static export pattern)
      const htmlPath = filePath.endsWith('.html') ? filePath : filePath + '.html';
      fs.stat(htmlPath, (err2, stat2) => {
        if (!err2 && stat2.isFile()) {
          serveFile(res, htmlPath);
        } else {
          // Fallback to 404.html if available
          const notFound = path.join(STATIC_DIR, '404.html');
          fs.readFile(notFound, (err3, data) => {
            if (!err3) {
              res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(data);
            } else {
              res.writeHead(404, { 'Content-Type': 'text/html' });
              res.end('<h1>404 Not Found</h1>');
            }
          });
        }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
});
