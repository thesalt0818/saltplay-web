// 정적 내보내기에서는 이 파일이 "빌드 때 한 번 만들어지는 파일"임을 명시해야 한다.
// 없으면 Next 가 요청마다 만드는 것으로 보고 빌드가 실패한다.
export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

/**
 * 크롤러에게 주는 규칙. 빌드할 때 `/robots.txt` 파일로 만들어진다.
 *
 * 게임·카테고리는 전부 열어 두고, 사람만 쓰는 화면(로그인·검색 결과·마이페이지)만
 * 막는다. **게임 페이지를 막으면 이 사이트의 존재 이유가 사라진다** —
 * disallow 목록에 `/game` 이 들어가는 일이 없어야 한다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/", "/search", "/my", "/profile"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
