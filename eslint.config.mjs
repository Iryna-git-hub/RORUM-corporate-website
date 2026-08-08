import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "playwright-report/**",
      "test-results/**",
      "blob-report/**",
      "playwright/.cache/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
