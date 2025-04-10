import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/**/*.ts',
    'services/**/*.ts',
    'middleware/**/*.ts',
    '!**/node_modules/**'
  ],
  verbose: true,
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  clearMocks: true,
  restoreMocks: true,
};

export default config;