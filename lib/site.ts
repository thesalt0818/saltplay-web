/**
 * 사이트 전체에서 쓰는 상수. 여기 한 곳에서만 고친다.
 */

/**
 * 주소 앞에 붙는 저장소 이름.
 *
 * GitHub Pages 주소가 https://thesalt0818.github.io/saltplay-web/ 이라서 필요하다.
 * `next.config.ts` 도 이 값을 가져다 쓰므로 **두 곳이 어긋날 일이 없다.**
 * 나중에 커스텀 도메인을 붙이면 여기를 빈 문자열("")로 바꾸면 된다.
 */
export const BASE_PATH = "/saltplay-web";

/**
 * 실제 배포 주소. `NEXT_PUBLIC_SITE_URL` 이 없을 때 쓰는 기본값이다.
 *
 * ⚠️ **기본값이 반드시 있어야 한다.** 예전에 기본값을 localhost 로 두었더니
 * 환경변수를 깜빡한 빌드에서 sitemap 주소가 상대경로가 되고 OG 주소가
 * `http://localhost:3000/...` 으로 나갔다 — 빌드는 멀쩡히 통과하고 배포된 뒤에야
 * 티가 나는 종류의 사고다.
 */
export const PRODUCTION_URL = "https://thesalt0818.github.io/saltplay-web";

export const SITE_NAME = "SaltPlay";

export const SITE_DESCRIPTION =
  "설치 없이 바로 즐기는 무료 HTML5 게임 모음. 방치형, 퍼즐, 액션, 캐주얼 게임을 브라우저에서 바로 플레이하세요.";

/**
 * `public/` 안의 파일을 가리키는 주소를 만든다.
 *
 * ⚠️ `<img src="/brand/logo.png">` 처럼 직접 적으면 basePath 가 붙지 않아 404 가 난다.
 * public/ 의 파일을 쓸 때는 **반드시 이 함수를 거친다.**
 *
 *   asset("/brand/logo.png")  →  "/saltplay-web/brand/logo.png"
 */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
