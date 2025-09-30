export default {
  displayName: 'multi-tenancy',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/packages/multi-tenancy',
  moduleNameMapper: {
    '^chalk$': '<rootDir>/src/__mocks__/chalk.js',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__mocks__/setup.js'],
};
