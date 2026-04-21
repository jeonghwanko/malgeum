/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^\\.\\./(\\.\\./)modules/widget-bridge$": "<rootDir>/src/__tests__/__mocks__/widget-bridge.ts",
    "^@react-native-async-storage/async-storage$": "<rootDir>/src/__tests__/__mocks__/async-storage.ts",
    "^@sentry/react-native$": "<rootDir>/src/__tests__/__mocks__/sentry.ts",
    "^expo-localization$": "<rootDir>/src/__tests__/__mocks__/expo-localization.ts",
    "^expo-crypto$": "<rootDir>/src/__tests__/__mocks__/expo-crypto.ts",
    "\\.(jpg|jpeg|png|gif|webp)$": "<rootDir>/src/__tests__/__mocks__/fileMock.ts",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  globals: {
    __DEV__: true,
  },
};
