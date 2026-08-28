import Link from "next/link";
import type { Game } from "@/lib/games";
import { hasTag } from "@/lib/games";
import { cn } from "@/lib/utils";
import { GameThumbnail } from "./game-thumbnail";

/**
 * 목록에 놓이는 게임 카드 한 장. 앱 `game_card.dart` 의 규칙을 그대로 옮겼다.
 *
 * - **카드에 게임 이름 글씨를 얹지 않는다.** 아이콘 아트에 이름이 이미 그려져 있다.
 * - 모서리는 `rounded-icon`(가로의 7.5%). 아이콘 아트에 라운드가 구워져 있어서
 *   이 비율을 벗어나면 모서리에 계단이 진다.
 * - 상태 표시는 **왼쪽 위 배지 하나뿐**이고, 반드시 카드 안쪽에 둔다.
 *
 * 링크(`<a>`)로 감싸는 것이 중요하다 — 검색엔진이 이 링크를 따라가 게임 상세
 * 페이지를 찾는다. 자바스크립트로 이동시키면 색인되지 않는다.
 */
export function GameCard({
  game,
  long = false,
  priority = false,
  className,
}: {
  game: Game;
  /** 세로형(2:3) 아이콘을 쓰는 추천 띠용 카드인지. */
  long?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const badge = badgeOf(game);

  return (
    <Link
      href={`/game/${game.id}`}
      title={game.title}
      className={cn(
        "group relative block shrink-0 overflow-hidden bg-surface",
        long ? "rounded-icon-long" : "rounded-icon",
        // 앱은 누르는 동안 줄어든다(scale 0.94). 웹은 마우스가 있으므로
        // 올렸을 때 살짝 커지는 것으로 대신한다. 반응이 없으면 눌리는지 알 수 없다.
        "shadow-lg shadow-black/40 transition-transform duration-150",
        "hover:scale-[1.04] focus-visible:scale-[1.04]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
        className,
      )}
    >
      <div className={long ? "aspect-[2/3]" : "aspect-square"}>
        <GameThumbnail game={game} long={long} priority={priority} />
      </div>

      {badge && (
        <span
          className={cn(
            "absolute left-1.5 top-1.5 rounded-full px-2 py-0.5",
            "text-[11px] font-bold leading-tight shadow-md shadow-black/40",
            badge.className,
          )}
        >
          {badge.text}
        </span>
      )}
    </Link>
  );
}

/**
 * 태그에서 배지를 정한다. `hot` 이 `top` 보다 세다 — 둘 다 붙어 있으면 Hot.
 */
function badgeOf(game: Game) {
  if (hasTag(game, "hot")) {
    return { text: "Hot", className: "bg-hot text-hot-foreground" };
  }
  if (hasTag(game, "top")) {
    return { text: "Top", className: "bg-top text-top-foreground" };
  }
  return null;
}
