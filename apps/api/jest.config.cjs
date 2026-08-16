/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@api/(.*)$': '<rootDir>/src/$1',
  },
  rootDir: '.',
  setupFiles: ['<rootDir>/test/setup/setup-env.ts'],
  testEnvironment: 'node',
  testRegex: '.*\\.(e2e-)?spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
};
