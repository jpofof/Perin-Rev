module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  setupFilesAfterSetup: [],
  moduleNameMapper: {},
  transform: {},
  verbose: true,
  collectCoverageFrom: ['<rootDir>/script.js'],
  coverageDirectory: '<rootDir>/coverage',
};