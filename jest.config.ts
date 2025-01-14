import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@db/(.*)$': '<rootDir>/db/$1',
    '^@db$': '<rootDir>/db/index.ts',
    '^@/vite$': '<rootDir>/server/__mocks__/vite.ts',
    '^./vite$': '<rootDir>/server/__mocks__/vite.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/server/__tests__/setup.ts'],
  testTimeout: 10000,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.json',
      useESM: true,
      isolatedModules: true
    }]
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  modulePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  }
};

export default config;