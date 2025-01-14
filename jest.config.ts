import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/server/__tests__', '<rootDir>/client/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@db/(.*)$': '<rootDir>/db/$1',
    '^@db$': '<rootDir>/db/index.ts',
    '^@/vite$': '<rootDir>/server/__mocks__/vite.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/server/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: [
    '<rootDir>/server/__tests__/setup.ts',
    '<rootDir>/client/src/test/setup.ts'
  ],
  testTimeout: 10000,
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: './tsconfig.json',
      useESM: true,
      isolatedModules: true,
      jsx: 'react-jsx'
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@radix-ui|@testing-library|wouter|class-variance-authority|tailwind-merge|clsx)/)'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
    '**/*.test.tsx'
  ],
  modulePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: './tsconfig.json'
    },
  }
};

export default config;