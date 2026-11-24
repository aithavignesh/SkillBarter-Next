import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    rules: {
      // Existing effects intentionally initiate async data loads and initialize form state.
      // Avoid a blanket new React Compiler rule until these flows can be refactored safely.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
