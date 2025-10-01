/**
 * 基础设施层测试配置
 *
 * @description Jest测试配置文件
 * @since 1.0.0
 */

module.exports = {
  displayName: 'Infrastructure Tests',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/infrastructure/__tests__'],
  testMatch: ['**/__tests__/**/*.spec.ts', '**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/infrastructure/**/*.ts',
    '!src/infrastructure/**/*.d.ts',
    '!src/infrastructure/**/*.spec.ts',
    '!src/infrastructure/**/*.test.ts',
    '!src/infrastructure/__tests__/**',
  ],
  coverageDirectory: 'coverage/infrastructure',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/infrastructure/__tests__/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  moduleNameMapping: {
    '^@hl8/(.*)$': '<rootDir>/packages/$1/src',
  },
};
