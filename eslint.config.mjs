import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier/flat"
import importPlugin from "eslint-plugin-import"
import n from "eslint-plugin-n"
import promise from "eslint-plugin-promise"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import sortClassMembers from "eslint-plugin-sort-class-members"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: [
      ".claude/**",
      "coverage/**",
      "dist/**",
      "docs/**",
      "node_modules/**",
      "test-result/**",
      "wiki/**",
      ".idea/**",
      ".vscode/**",
      "out/**",
      ".env"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  n.configs["flat/recommended"],
  promise.configs["flat/recommended"],
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
      "sort-class-members": sortClassMembers
    },
    rules: {
      "import/no-unresolved": "off",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "sort-class-members/sort-class-members": [
        2,
        {
          order: [
            "[static-properties]",
            "[static-methods",
            "[properties]",
            "[conventional-private-properties]",
            "constructor",
            "[methods]",
            "[conventional-private-methods]"
          ],
          accessorPairPositioning: "getThenSet",
          groups: {
            allMethods: [
              {
                type: "method",
                sort: "alphabetical"
              }
            ]
          }
        }
      ]
    }
  },
  {
    files: ["vite.config.ts", "vitest.config.ts", "eslint.config.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      "import/no-unresolved": "off"
    }
  },
  eslintConfigPrettier
)
