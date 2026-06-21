import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist"]),
  {
    // ignore for shadcn auto-generated files
    ignores: ["src/components/ui/**", "src/hooks/use-mobile.ts"],
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // allow set state inside useEffect
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // needed to skip warning in eslint, since use lazy loading
    files: ["**/router.tsx", "**/routes.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
])
