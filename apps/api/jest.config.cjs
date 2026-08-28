/** @type {import('jest').Config} */
module.exports = {
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/generated/**',
    '!<rootDir>/src/main.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text-summary', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 85,
      statements: 85,
    },
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@api/(.*)$': '<rootDir>/src/$1',
  },
  rootDir: '.',
  setupFiles: ['<rootDir>/test/setup/setup-env.ts'],
  testEnvironment: 'node',
  testRegex: '.*\\.(e2e-)?spec\\.ts$',
  testResultsProcessor: '<rootDir>/test/helpers/fail-on-skipped-tests.cjs',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
};
