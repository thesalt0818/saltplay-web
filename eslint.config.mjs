import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // 빌드 결과물은 검사하지 않는다.
    // out/ 은 정적 내보내기(output: "export")가 만드는 폴더다 — 그 안의 압축된
    // 자바스크립트까지 검사하면 에러가 수천 개 나온다.
    ignores: [".next/**", "out/**", "node_modules/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
