import nextVitals from "eslint-config-next/core-web-vitals.js";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
