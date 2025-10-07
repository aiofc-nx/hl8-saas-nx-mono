export default {
  displayName: 'hybrid-archi',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/packages/hybrid-archi',
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|ansi-styles|strip-ansi|has-flag|supports-color|color-convert|color-name|@hl8)/)',
  ],
  moduleNameMapper: {
    '^chalk$': '<rootDir>/../../node_modules/.pnpm/chalk@4.1.2/node_modules/chalk',
  },
};
