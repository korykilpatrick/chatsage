import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/server/__tests__', '<rootDir>/client/src/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@db/(.*)$': '<rootDir>/db/$1',
    '^@db$': '<rootDir>/db/index.ts',
    '^@/vite$': '<rootDir>/server/__mocks__/vite.ts',
    '^./vite$': '<rootDir>/server/__mocks__/vite.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/client/src/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: [
    '<rootDir>/server/__tests__/setup.ts',
    '<rootDir>/client/src/__tests__/setup.ts'
  ],
  testTimeout: 10000,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.json',
      useESM: true,
      isolatedModules: true
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  modulePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  }
};

export default config;