import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/game/search-results";
import { getGames } from "@/lib/games";

export const metadata: Metadata = {
  title: "검색",
  // 검색 결과 페이지는 원래 검색엔진에 올리는 페이지가 아니다.
  // 게임 자체는 홈·카테고리·상세로 이미 색인되므로 손해가 없다.
  robots: { index: false, follow: true },
};

/**
 * 검색.
 *
 * **서버 컴포넌트다.** 게임 목록을 빌드 시점에 읽어 두고, 실제로 거르는 일만
 * 브라우저(`SearchResults`)에 맡긴다. 정적 배포에는 검색어를 받아 줄 서버가 없다.
 */
export default async function SearchPage() {
  const games = await getGames("all");

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold sm:text-3xl">검색</h1>
      {/* useSearchParams 는 Suspense 안에 있어야 정적 빌드가 통과한다. */}
      <Suspense
        fallback={<p className="text-muted-foreground">불러오는 중…</p>}
      >
        <SearchResults games={games} />
      </Suspense>
    </div>
  );
}
