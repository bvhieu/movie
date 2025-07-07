#!/usr/bin/env node

/**
 * Test Runner Script for Movie API
 * This script provides various options for running the API tests
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n📋 ${description}`, 'cyan');
  log(`🔧 Running: ${command}`, 'blue');
  
  try {
    const output = execSync(command, { 
      cwd: process.cwd(),
      stdio: 'inherit',
      encoding: 'utf8'
    });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

function showHelp() {
  log('\n🎬 Movie API Test Runner', 'magenta');
  log('==============================', 'magenta');
  log('\nAvailable commands:', 'cyan');
  log('  npm run test:help          - Show this help message', 'white');
  log('  npm run test:all            - Run all tests', 'white');
  log('  npm run test:e2e            - Run all E2E tests', 'white');
  log('  npm run test:unit           - Run unit tests', 'white');
  log('  npm run test:auth           - Run authentication tests', 'white');
  log('  npm run test:movies         - Run movie API tests', 'white');
  log('  npm run test:users          - Run user management tests', 'white');
  log('  npm run test:watchlist      - Run watchlist tests', 'white');
  log('  npm run test:ratings        - Run rating system tests', 'white');
  log('  npm run test:coverage       - Run tests with coverage report', 'white');
  log('  npm run test:watch          - Run tests in watch mode', 'white');
  log('  npm run test:debug          - Run tests in debug mode', 'white');
  log('\nEnvironment setup:', 'cyan');
  log('  npm run test:setup          - Set up test environment', 'white');
  log('  npm run test:teardown       - Clean up test environment', 'white');
  log('\nCoverage and reporting:', 'cyan');
  log('  npm run test:coverage:html  - Generate HTML coverage report', 'white');
  log('  npm run test:lint           - Run linting checks', 'white');
  log('\n');
}

function runAllTests() {
  log('\n🚀 Running Complete Test Suite', 'magenta');
  log('===============================', 'magenta');
  
  const tests = [
    { cmd: 'npm run lint', desc: 'Code Linting' },
    { cmd: 'npm run test:unit', desc: 'Unit Tests' },
    { cmd: 'npm run test:e2e', desc: 'E2E Tests' }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    if (!runCommand(test.cmd, test.desc)) {
      allPassed = false;
      break;
    }
  }
  
  if (allPassed) {
    log('\n🎉 All tests passed successfully!', 'green');
  } else {
    log('\n💥 Some tests failed. Please check the output above.', 'red');
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    case 'all':
      runAllTests();
      break;
      
    case 'e2e':
      runCommand('jest --config ./test/jest-e2e.json', 'E2E Tests');
      break;
      
    case 'unit':
      runCommand('jest', 'Unit Tests');
      break;
      
    case 'auth':
      runCommand('jest --config ./test/jest-e2e.json test/auth.e2e-spec.ts', 'Authentication Tests');
      break;
      
    case 'movies':
      runCommand('jest --config ./test/jest-e2e.json test/movies.e2e-spec.ts', 'Movie API Tests');
      break;
      
    case 'users':
      runCommand('jest --config ./test/jest-e2e.json test/users.e2e-spec.ts', 'User Management Tests');
      break;
      
    case 'watchlist':
      runCommand('jest --config ./test/jest-e2e.json test/watchlist.e2e-spec.ts', 'Watchlist Tests');
      break;
      
    case 'ratings':
      runCommand('jest --config ./test/jest-e2e.json test/ratings.e2e-spec.ts', 'Rating System Tests');
      break;
      
    case 'coverage':
      runCommand('jest --coverage', 'Tests with Coverage');
      break;
      
    case 'coverage:html':
      runCommand('jest --coverage --coverageReporters=html', 'HTML Coverage Report');
      log('\n📊 Coverage report generated in ./coverage/lcov-report/index.html', 'cyan');
      break;
      
    case 'watch':
      runCommand('jest --watch', 'Tests in Watch Mode');
      break;
      
    case 'debug':
      runCommand('jest --runInBand --detectOpenHandles', 'Tests in Debug Mode');
      break;
      
    case 'setup':
      log('\n🔧 Setting up test environment...', 'cyan');
      runCommand('npm install', 'Installing Dependencies');
      runCommand('npm run build', 'Building Application');
      log('✅ Test environment setup complete', 'green');
      break;
      
    case 'teardown':
      log('\n🧹 Cleaning up test environment...', 'cyan');
      runCommand('rm -rf coverage', 'Removing Coverage Reports');
      runCommand('rm -rf dist', 'Removing Build Files');
      log('✅ Test environment cleanup complete', 'green');
      break;
      
    case 'lint':
      runCommand('eslint "{src,apps,libs,test}/**/*.ts"', 'ESLint Check');
      break;
      
    default:
      log('❌ Unknown command. Use "npm run test:help" to see available options.', 'red');
      process.exit(1);
  }
}

main();
