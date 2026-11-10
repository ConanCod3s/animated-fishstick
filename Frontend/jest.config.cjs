module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/pages/**/*.test.cjs"],
  transform: {
    "^.+\\.(?:[cm]?js|jsx)$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          ["@babel/preset-react", { runtime: "automatic" }],
        ],
      },
    ],
  },
  moduleNameMapper: {
    "^(?:\\.\\./\\.\\./firebase/Config|\\.\\./\\.\\./utils/constants|\\.\\./\\.\\./components/TankReadingCharts/TankReadingCharts|firebase/auth|firebase/firestore|.*\\.css)$":
      "<rootDir>/src/test/mocks.cjs",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
};
