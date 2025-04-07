module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverageFrom: [
      'controllers/**/*.js',
      'services/**/*.js',
      'repositories/**/*.js',
      'middleware/**/*.js',
      'utils/**/*.js',
      '!**/node_modules/**'
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
      '**/tests/**/*.js',
      '**/?(*.)+(spec|test).js'
    ],
    setupFilesAfterEnv: ['./tests/setup.js'],
    // Dodano opcję forceExit, aby rozwiązać problem z niezakończonymi procesami
    forceExit: true
  };