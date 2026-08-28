"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { GameCard } from "@/components/game/game-card";
import { getGames, searchableText } from "@/lib/games";

/**
 * 검색 결과.
 *
 * ## 왜 브라우저에서 거르나
 *
 * 정적 배포에는 검색어를 받아 줄 서버가 없다. 다행히 게임 수가 적어서 **목록 전체를
 * 브라우저로 보내 놓고 거르는 것**으로 충분하다(목록은 몇 KB 다).
 * 게임이 수백 개로 늘면 그때 검색 전용 색인을 따로 만든다.
 *
 * ## SEO 는 신경 쓰지 않아도 된다
 *
 * 검색 결과 페이지는 원래 검색엔진에 올리는 페이지가 아니다. 게임 자체는
 * 홈·카테고리·상세 페이지로 이미 색인되므로 손해가 없다.
 */
function SearchResults() {
  const query = (useSearchParams().get("q") ?? "").trim();

  const results = useMemo(() => {
    if (!query) return [];
    const needle = query.toLowerCase();
    return getGames("all").filter((game) =>
      searchableText(game).includes(needle),
    );
  }, [query]);

  if (!query) {
    return (
      <p className="text-muted-foreground">
        위 검색창에 게임 이름이나 분류를 입력해 보세요.
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="text-muted-foreground">
        <span className="font-bold text-foreground">{query}</span> 에 대한
        결과가 없습니다.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:gap-4">
      {results.map((game) => (
        <li key={game.id}>
          <GameCard game={game} priority className="w-full" />
        </li>
      ))}
    </ul>
  );
}

export default function SearchPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold sm:text-3xl">검색</h1>
      {/* useSearchParams 는 Suspense 안에 있어야 정적 빌드가 통과한다. */}
      <Suspense
        fallback={<p className="text-muted-foreground">불러오는 중…</p>}
      >
        <SearchResults />
      </Suspense>
    </div>
  );
}
