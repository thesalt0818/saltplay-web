import { GameRow } from "@/components/game/game-row";
import { HOME_ROWS, getGames, selectGames } from "@/lib/games";

/**
 * 홈. 가로 스크롤 줄이 세로로 쌓인 화면 (Flutter 앱의 Home 탭과 같은 구조).
 *
 * **서버 컴포넌트다.** 게임 목록과 링크가 빌드 시점에 HTML 로 완성되어야
 * 검색엔진이 게임 상세 페이지를 전부 찾아갈 수 있다.
 */
export default function HomePage() {
  // 이용 등급을 거르는 자리는 여기가 아니라 getGames() 안이다.
  const games = getGames("all");

  const rows = HOME_ROWS.map((row) => ({
    row,
    games: selectGames(row, games),
  })).filter((entry) => entry.games.length > 0);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* 페이지에 h1 은 하나여야 한다. 화면에는 필요 없지만 검색엔진에는 필요해서
          읽어 주기만 하고 보이지는 않게 둔다. */}
      <h1 className="sr-only">
        SaltPlay — 설치 없이 바로 즐기는 무료 온라인 게임
      </h1>

      {rows.map(({ row, games }, index) => (
        <GameRow
          key={row.title}
          row={row}
          games={games}
          // 첫 두 줄은 화면에 바로 보이므로 그림을 미루지 않는다.
          priority={index < 2}
          moreHref={row.href}
        />
      ))}
    </div>
  );
}
