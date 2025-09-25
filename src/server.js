const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { createServer } = require('http');
const { Server } = require('socket.io');
const chokidar = require('chokidar');
const ignore = require('ignore');
const mimeTypes = require('mime-types');
const { marked } = require('marked');

class SpecViewer {
  constructor(options) {
    this.directory = options.directory;
    this.port = options.port || 3000;
    this.host = options.host || 'localhost';
    this.ignoreFile = options.ignoreFile || '.specinclude';

    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server);

    this.ignoreInstance = ignore();
    this.includePatterns = [];
    this.useWhitelist = false;
    this.watcher = null;

    this.setupRoutes();
    this.setupSocketIO();
  }

  async loadIncludeFile() {
    try {
      const includePath = path.join(this.directory, this.ignoreFile);
      const includeContent = await fs.readFile(includePath, 'utf8');

      const lines = includeContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));

      if (lines.length > 0) {
        this.includePatterns = lines;
        this.useWhitelist = true;
        console.log(`Loaded include patterns from ${this.ignoreFile}:`, lines);
      } else {
        console.log(`Empty include file ${this.ignoreFile}, serving all files`);
        this.useWhitelist = false;
      }
    } catch (error) {
      console.log(`No include file found at ${this.ignoreFile}, serving all files`);
      this.useWhitelist = false;
      this.includePatterns = [];
    }
  }

  isFileIncluded(filePath) {
    if (!this.useWhitelist) {
      return true;
    }

    for (const pattern of this.includePatterns) {
      if (this.matchPattern(filePath, pattern)) {
        return true;
      }
    }
    return false;
  }

  matchPattern(filePath, pattern) {
    if (pattern.endsWith('/')) {
      return filePath.startsWith(pattern) || filePath.startsWith(pattern.slice(0, -1));
    } else if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
      return regex.test(filePath);
    } else {
      return filePath === pattern || filePath.startsWith(pattern + '/') || filePath.startsWith(pattern + '\\');
    }
  }

  setupRoutes() {
    this.app.use('/assets', express.static(path.join(__dirname, 'public')));

    this.app.get('/api/tree', async (req, res) => {
      try {
        const tree = await this.getDirectoryTree(this.directory);
        res.json(tree);
      } catch (error) {
        console.error('Error getting directory tree:', error);
        res.status(500).json({ error: 'Failed to get directory tree' });
      }
    });

    this.app.get('/api/file/*', async (req, res) => {
      try {
        const filePath = req.params[0];
        const fullPath = path.join(this.directory, filePath);

        if (!this.isFileIncluded(filePath)) {
          return res.status(403).json({ error: 'File is not included in served files' });
        }

        const content = await fs.readFile(fullPath, 'utf8');
        const mimeType = mimeTypes.lookup(fullPath);

        if (mimeType === 'text/markdown' || fullPath.endsWith('.md')) {
          const html = marked(content);
          res.json({
            type: 'markdown',
            content: content,
            html: html,
            path: filePath
          });
        } else {
          res.json({
            type: 'text',
            content: content,
            path: filePath
          });
        }
      } catch (error) {
        console.error('Error reading file:', error);
        res.status(404).json({ error: 'File not found' });
      }
    });

    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log('Client connected');

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  async getDirectoryTree(dirPath, relativePath = '') {
    const items = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(relativePath, entry.name);

        if (!this.isFileIncluded(entryPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          const children = await this.getDirectoryTree(
            path.join(dirPath, entry.name),
            entryPath
          );
          items.push({
            name: entry.name,
            path: entryPath,
            type: 'directory',
            children: children
          });
        } else {
          items.push({
            name: entry.name,
            path: entryPath,
            type: 'file'
          });
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }

    return items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  setupFileWatcher() {
    this.watcher = chokidar.watch(this.directory, {
      ignored: (filePath) => {
        const relativePath = path.relative(this.directory, filePath);
        if (!relativePath || relativePath === '.') return false;
        return !this.isFileIncluded(relativePath);
      },
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', (filePath) => {
      const relativePath = path.relative(this.directory, filePath);
      console.log(`File changed: ${relativePath}`);
      this.io.emit('file-changed', { path: relativePath });
    });

    this.watcher.on('add', () => {
      this.io.emit('tree-changed');
    });

    this.watcher.on('unlink', () => {
      this.io.emit('tree-changed');
    });

    this.watcher.on('addDir', () => {
      this.io.emit('tree-changed');
    });

    this.watcher.on('unlinkDir', () => {
      this.io.emit('tree-changed');
    });
  }

  async start() {
    try {
      await this.loadIncludeFile();

      this.setupFileWatcher();

      this.server.listen(this.port, this.host, () => {
        console.log(`Spec viewer running at http://${this.host}:${this.port}`);
        console.log(`Serving directory: ${this.directory}`);
        console.log('Press Ctrl+C to stop the server');
      });

      const shutdown = () => {
        console.log('\nShutting down server...');

        if (this.watcher) {
          try {
            this.watcher.close();
            console.log('File watcher closed');
          } catch (error) {
            console.log('Error closing file watcher:', error.message);
          }
        }

        if (this.io) {
          this.io.close();
          console.log('Socket.io closed');
        }

        this.server.close(() => {
          console.log('HTTP server closed');
          process.exit(0);
        });

        setTimeout(() => {
          console.log('Force closing server...');
          process.exit(1);
        }, 3000);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      if (process.platform === 'win32') {
        process.on('SIGBREAK', shutdown);
      }

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

module.exports = { SpecViewer };