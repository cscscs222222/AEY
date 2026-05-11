module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module"
  },
  env: {
    es2022: true,
    node: true,
    browser: true
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "apps/web/.next/",
    "apps/mobile/.expo/",
    "apps/mobile/android/",
    "apps/mobile/ios/",
    "apps/mobile/web-build/"
  ]
};
