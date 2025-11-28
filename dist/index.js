// Temporary workaround file - Render is trying to run 'node dist/index.js'
// This file redirects to run TypeScript using tsx
// TODO: Update Render dashboard Start Command to 'npm start'

const { execSync } = require('child_process');
const path = require('path');

try {
  // Run tsx to execute the TypeScript file directly
  process.chdir(path.join(__dirname, '..'));
  execSync('npx tsx index.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting application:', error.message);
  process.exit(1);
}
