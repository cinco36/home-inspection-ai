#!/usr/bin/env ts-node

import './workers/fileProcessor';

console.log('🚀 File processing worker started');
console.log('📋 Waiting for file processing jobs...');

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Worker shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Worker shutting down...');
  process.exit(0);
}); 