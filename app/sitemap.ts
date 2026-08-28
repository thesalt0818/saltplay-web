// 정적 내보내기에서는 이 파일이 "빌드 때 한 번 만들어지는 파일"임을 명시해야 한다.
// 없으면 Next 가 요청마다 만드는 것으로 보고 빌드가 실패한다.
export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { CATEGORIES, getGames } from "@/lib/games";
import { siteUrl } from "@/lib/utils";

/**
 * 검색엔진에게 "이 사이트에 어떤 페이지가 있는지" 알려 주는 목록.
 *
 * 빌드할 때 `/sitemap.xml` 파일로 만들어진다. **게임을 추가하면 여기에도 자동으로
 * 들어가므로 손댈 일이 없다** — 대신 다시 빌드·배포해야 반영된다.
 *
 * 성인용 게임은 넣지 않는다.
 * 검색 결과·마이페이지처럼 색인할 이유가 없는 페이지도 넣지 않는다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = await getGames("all");

  return [
    {
      url: siteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    ...CATEGORIES.map((category) => ({
      url: siteUrl(`/category/${category.slug}/`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...games.map((game) => ({
      url: siteUrl(`/game/${game.id}/`),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
