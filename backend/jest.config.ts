import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'controllers/**/*.{js,ts}',
    'services/**/*.{js,ts}',
    'repositories/**/*.{js,ts}',
    'middleware/**/*.{js,ts}',
    'utils/**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70
    }
  },
  testMatch: [
    '**/tests/**/*.{js,ts}',
    '**/?(*.)+(spec|test).{js,ts}'
  ],
  setupFilesAfterEnv: ['./tests/setup.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
};

export default config;