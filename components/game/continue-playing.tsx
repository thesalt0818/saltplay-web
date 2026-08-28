"use client";

import { useEffect, useState } from "react";
import type { Game } from "@/lib/games";
import { readRecent } from "@/lib/recent";
import { GameCard } from "./game-card";
import { ScrollRow } from "./scroll-row";

/**
 * '계속 플레이하기' 줄. 홈 맨 위, 추천 띠보다 앞에 온다.
 *
 * ## 카드가 다른 줄보다 작다
 *
 * 이미 아는 게임을 다시 찾아 들어가는 줄이라 크게 보여 줄 이유가 없다. 작게 넣어야
 * 한 화면에 여러 개가 들어오고, 아래의 추천 띠가 화면 위쪽 자리를 차지한다.
 *
 * ## 브라우저에서만 그려진다
 *
 * 기록이 이 브라우저의 저장소에만 있어서 서버는 무엇이 들어갈지 알 수 없다.
 * 그래서 첫 화면에는 없다가 뜬 뒤에 나타난다. **SEO 손해는 없다** — 여기 나오는
 * 게임은 아래 줄들에도 이미 링크가 걸려 있다.
 *
 * ## 등급을 넘나들지 않는다
 *
 * `games` 는 이미 그 페이지의 등급으로 걸러진 목록이다. 기록에 성인용 게임이 있어도
 * 전체이용가 홈에서는 짝이 맞지 않아 그냥 빠진다. **여기서 따로 거르지 않는 것이
 * 중요하다** — 거르는 자리가 둘이 되면 한쪽만 고치는 실수가 난다.
 */
export function ContinuePlaying({ games }: { games: Game[] }) {
  // null = 아직 안 읽음. 빈 배열과 구분해야 첫 프레임에 빈 줄이 깜빡이지 않는다.
  const [recent, setRecent] = useState<Game[] | null>(null);

  useEffect(() => {
    const byId = new Map(games.map((game) => [game.id, game]));

    // 저장된 순서(최신순)를 그대로 지킨다. games 순서로 돌면 순서가 뒤집힌다.
    const found = readRecent()
      .map((id) => byId.get(id))
      .filter((game): game is Game => game !== undefined);

    setRecent(found);
  }, [games]);

  // 기록이 없으면 줄 자체를 만들지 않는다. 빈 제목만 덩그러니 남으면 고장처럼 보인다.
  if (!recent || recent.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2.5 text-lg font-bold sm:text-xl">계속 플레이하기</h2>

      <ScrollRow>
        {recent.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            priority
            // 다른 줄(96/120/140)보다 한 단계 작다.
            className="w-[72px] sm:w-[86px] lg:w-[96px]"
          />
        ))}
      </ScrollRow>
    </section>
  );
}
