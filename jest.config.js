export default {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['./jest.setup.js'],
}; 