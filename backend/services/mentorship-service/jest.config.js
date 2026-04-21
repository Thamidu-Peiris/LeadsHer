/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 120000,
  globalSetup: './tests/globalSetup.js',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/server.js',
    '!src/config/db.js',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  verbose: true,
};
