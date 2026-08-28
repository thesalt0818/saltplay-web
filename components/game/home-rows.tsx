import type { Audience } from "@/lib/games";
import { HOME_ROWS, getGames, selectGames } from "@/lib/games";
import { GameRow } from "./game-row";

/**
 * 홈의 가로 스크롤 줄 전체.
 *
 * 전체이용가(`/`)와 성인용(`/adult`)이 **같은 구성을 쓴다.** 두 페이지가 각자
 * 줄 목록을 들고 있으면 한쪽만 고치는 실수가 나므로 여기 한 곳에 둔다.
 * 게임을 거르는 것은 `getGames(audience)` 안에서만 일어난다.
 */
export function HomeRows({ audience }: { audience: Audience }) {
  const games = getGames(audience);

  const rows = HOME_ROWS.map((row) => ({
    row,
    games: selectGames(row, games),
  })).filter((entry) => entry.games.length > 0);

  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        아직 등록된 게임이 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {rows.map(({ row, games }, index) => (
        <GameRow
          key={row.title}
          row={row}
          games={games}
          // 첫 두 줄은 화면에 바로 보이므로 그림을 미루지 않는다.
          priority={index < 2}
          audience={audience}
          // 카테고리 페이지는 전체이용가만 보여 준다. 성인용에서 그리로 보내면
          // 누르는 순간 다른 등급의 목록이 나와 버리므로 링크를 걸지 않는다.
          moreHref={audience === "all" ? row.href : undefined}
        />
      ))}
    </div>
  );
}
