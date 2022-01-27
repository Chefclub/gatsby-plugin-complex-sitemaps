module.exports = {
  // Specifies the ESLint parser for TypeScript
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended",
  ],
  env: {
    node: true,
    es6: true,
  },
  plugins: ["@typescript-eslint", "prettier"],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    // Allows for the parsing of modern ECMAScript features
    ecmaVersion: 2018,
    // Allows for the use of imports
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": "error",
    // allow "any" as type
    "@typescript-eslint/no-explicit-any": "off",
    // allow not defining the return type of exported functions
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
}
