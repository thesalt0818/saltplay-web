import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Game, RowConfig } from "@/lib/games";
import { asset } from "@/lib/site";
import { GameCard } from "./game-card";
import { ScrollRow } from "./scroll-row";

/**
 * 홈에 쌓이는 가로 스크롤 줄 하나. 앱 `game_row.dart` 와 같은 구조다.
 *
 * 줄에는 두 가지 생김새가 있다.
 * - `standard` : 어두운 바닥 위에 정사각 카드
 * - `featured` : 배경 그림 위에 세로형(2:3) 큰 카드 — 'SaltPlay Originals'
 *
 * 서버 컴포넌트다. 카드와 링크가 HTML 에 그대로 들어가야 검색엔진이 게임 상세
 * 페이지를 찾아갈 수 있다.
 */
export function GameRow({
  row,
  games,
  priority = false,
  moreHref,
}: {
  row: RowConfig;
  games: Game[];
  /** 첫 화면에 보이는 줄이면 true — 그림을 미루지 않고 바로 받는다. */
  priority?: boolean;
  /** '더 보기'로 갈 주소. 없으면 화살표를 그리지 않는다. */
  moreHref?: string;
}) {
  if (games.length === 0) return null;

  const featured = row.style === "featured";

  return (
    <section
      className={
        featured
          ? "relative overflow-hidden rounded-2xl bg-cover bg-center px-3 py-4 sm:px-5 sm:py-6"
          : ""
      }
      style={
        featured
          ? {
              // 그림을 못 읽어도 비슷한 색이 깔리도록 그라디언트를 아래에 둔다.
              // 값은 앱의 featuredFrom/To 와 같다.
              backgroundImage: `url(${asset("/ui/featured-bg.png")}), linear-gradient(135deg, #595E95, #3E4178)`,
            }
          : undefined
      }
    >
      <header className="mb-2.5 flex items-center justify-between gap-3">
        <h2
          className={
            featured
              ? "text-lg font-bold sm:text-xl"
              : "text-lg font-bold sm:text-xl"
          }
        >
          {moreHref ? (
            <Link
              href={moreHref}
              className="inline-flex items-center gap-0.5 hover:text-primary"
            >
              {row.title}
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </Link>
          ) : (
            row.title
          )}
        </h2>

        {moreHref && (
          <Link
            href={moreHref}
            className="shrink-0 text-sm font-bold text-muted-foreground hover:text-primary"
          >
            더 보기
          </Link>
        )}
      </header>

      <ScrollRow>
        {games.map((game, index) => (
          <GameCard
            key={game.id}
            game={game}
            long={featured}
            priority={priority && index < 6}
            className={
              featured
                ? // 세로형 카드. 아이콘 원본이 200px 이라 그보다 크게 그리지 않는다.
                  "w-[128px] sm:w-[150px] lg:w-[168px]"
                : "w-[96px] sm:w-[120px] lg:w-[140px]"
            }
          />
        ))}
      </ScrollRow>
    </section>
  );
}
