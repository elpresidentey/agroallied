#!/usr/bin/env node

/**
 * Image Integration System CLI Script
 * Command-line interface for administrative tasks
 * Requirements: 8.3
 */

const { executeAdminCommand } = require('../src/lib/images/utils/admin-cli');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/image-admin.js <command> [args...]');
    console.log('Example: node scripts/image-admin.js health');
    console.log('Example: node scripts/image-admin.js metrics 30');
    console.log('Example: node scripts/image-admin.js help');
    process.exit(1);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  try {
    await executeAdminCommand(command, commandArgs);
  } catch (error) {
    console.error('CLI Error:', error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main();