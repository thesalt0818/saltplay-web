"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { Game } from "@/lib/games";
import { searchableText } from "@/lib/games";
import { GameCard } from "./game-card";

/**
 * 검색 결과를 거르는 부분.
 *
 * ## 왜 목록을 props 로 받나
 *
 * 게임 목록은 **빌드할 때 서버에서** 읽는다(Supabase 또는 파일). 브라우저에서는
 * 데이터베이스에 접근할 수 없고, 접근하게 만들어서도 안 된다.
 * 그래서 서버가 목록을 넘겨 주고 여기서는 거르기만 한다.
 *
 * 게임 수가 적어서 목록 전체를 브라우저로 보내도 몇 KB 다. 수백 개로 늘면
 * 그때 검색 전용 색인을 따로 만든다.
 */
export function SearchResults({ games }: { games: Game[] }) {
  const query = (useSearchParams().get("q") ?? "").trim();

  const results = useMemo(() => {
    if (!query) return [];
    const needle = query.toLowerCase();
    return games.filter((game) => searchableText(game).includes(needle));
  }, [query, games]);

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
