import nextVitals from "eslint-config-next/core-web-vitals.js";

export default [
  nextVitals,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"],
  },
];
