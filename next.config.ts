import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/site";

/**
 * GitHub Pages(서버 없는 정적 호스팅) 배포 설정.
 *
 * 자세한 배경은 CLAUDE.md 9절에 있다. 핵심만 적으면:
 * 빌드할 때 모든 페이지를 완성된 HTML 로 뽑아 `out/` 폴더에 넣고, GitHub Pages 는
 * 그 파일을 그대로 내보낸다. 그래서 SEO 에는 오히려 가장 좋지만,
 * **요청을 받아 처리하는 서버가 없다** — 미들웨어·Route Handler·쿠키 세션은 못 쓴다.
 */
const nextConfig: NextConfig = {
  // 정적 내보내기. `npm run build` 를 하면 out/ 폴더가 만들어진다.
  output: "export",

  // 배포 주소가 https://thesalt0818.github.io/saltplay-web/ 이라
  // 모든 경로 앞에 저장소 이름이 붙어야 한다.
  //
  // ⚠️ <Link href="/game/xxx"> 같은 내부 링크와 next/font 는 이 값을 자동으로 붙여 준다.
  //    하지만 public/ 안의 파일을 <img src="/logo.png"> 처럼 직접 적으면 붙지 않는다.
  //    그런 자리는 basePath 를 직접 붙이거나 import 해서 쓴다.
  //
  // 값의 원본은 lib/site.ts 다. public/ 파일 주소를 만드는 asset() 도 같은 값을 쓰므로
  // 두 곳이 어긋날 일이 없다. 커스텀 도메인을 붙이면 거기서 ""로 바꾼다.
  basePath: BASE_PATH,

  // GitHub Pages 는 /game/toyslot 요청을 /game/toyslot/index.html 에서 찾는다.
  // 이 값이 없으면 새로고침할 때 404 가 난다.
  trailingSlash: true,

  images: {
    // next/image 의 이미지 최적화는 서버가 하는 일이라 정적 배포에서는 못 쓴다.
    // 이미지를 올릴 때 미리 알맞은 크기로 줄여서 올려야 한다.
    unoptimized: true,
  },
};

export default nextConfig;
