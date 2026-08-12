const baseConfig = require('./jest.config.cjs');

module.exports = {
  ...baseConfig,
  setupFiles: [],
  testRegex: '.*\\.integration\\.test\\.ts$',
};
