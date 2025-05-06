const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');

try {
  // Remove existing dist directory if it exists
  if (fs.existsSync(distDir)) {
    console.log('Removing existing dist directory...');
    execSync('rimraf dist');
  }
  
  // Create dist directory
  console.log('Creating dist directory...');
  fs.mkdirSync(distDir, { recursive: true });
  
  // Run TypeScript compiler
  console.log('Compiling TypeScript...');
  execSync('tsc', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}