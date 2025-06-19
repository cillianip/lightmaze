import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  try {
    const safePath = req.url.split('?')[0].replace(/\.\./g, '');
    let filePath;
    
    if (safePath === '/') {
      filePath = join(__dirname, 'public', 'game.html');
    } else if (safePath === '/editor') {
      filePath = join(__dirname, 'public', 'editor.html');
    } else {
      filePath = join(__dirname, 'public', safePath);
    }
    
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';
    
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Light Maze dev server running at http://localhost:${PORT}`);
});