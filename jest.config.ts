import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // nanoid ships ESM-only; jest runs CJS
    "^nanoid$": "<rootDir>/tests/mocks/nanoid.ts",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/e2e/"],
  transformIgnorePatterns: ["/node_modules/(?!(nanoid)/)"],
};

export default createJestConfig(config);
