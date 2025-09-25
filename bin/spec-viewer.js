#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const { SpecViewer } = require('../src/server');

program
  .name('spec-viewer')
  .description('A CLI tool for viewing spec-kit generated documentation')
  .version('1.0.0')
  .argument('<directory>', 'Project directory to serve')
  .option('-p, --port <number>', 'Port number for the web server', '3000')
  .option('-i, --include <file>', 'Include file name - whitelist of files/directories to serve (relative to project root)', '.specinclude')
  .option('--host <host>', 'Host to bind the server to', 'localhost')
  .action((directory, options) => {
    const targetDir = path.resolve(directory);
    const viewer = new SpecViewer({
      directory: targetDir,
      port: parseInt(options.port),
      host: options.host,
      ignoreFile: options.include
    });

    const handleExit = () => {
      console.log('\nReceived exit signal, shutting down...');
      process.exit(0);
    };

    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);

    if (process.platform === 'win32') {
      process.on('SIGBREAK', handleExit);
    }

    viewer.start().catch((error) => {
      console.error('Failed to start spec-viewer:', error);
      process.exit(1);
    });
  });

program.parse();