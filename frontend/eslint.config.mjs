import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Existing effects intentionally initiate async data loads and initialize form state.
      // Avoid a blanket new React Compiler rule until these flows can be refactored safely.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
