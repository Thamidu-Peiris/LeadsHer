/**
 * Jest globalSetup — runs ONCE before all test suites.
 * Pre-warms the mongodb-memory-server binary so individual test-suite
 * beforeAll hooks don't timeout waiting for the binary download.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  // Starting and immediately stopping a server forces the binary download
  // to complete before any test suite begins.
  const mongod = await MongoMemoryServer.create();
  await mongod.stop({ doCleanup: true });
};
