"use client";

import { useState } from "react";
import type { Game } from "@/lib/games";
import { iconUrl } from "@/lib/games";
import { cn } from "@/lib/utils";

/**
 * 게임 아이콘 그림.
 *
 * ## 왜 클라이언트 컴포넌트인가
 *
 * 세로형 아이콘(`_long`)이 없는 게임이 있어서 **그림을 못 읽었을 때 정사각으로
 * 되돌릴** 필요가 있다. 그건 브라우저에서 실제로 읽어 봐야 알 수 있다(`onError`).
 * 앱의 `GameThumbnail` 도 같은 폴백을 한다.
 *
 * 그림이 아예 없는 게임은 `accent` 색 사각형에 첫 글자를 그린다.
 *
 * ## next/image 를 쓰지 않는 이유
 *
 * 정적 배포라 이미지 최적화 서버가 없어서 `next/image` 의 이점이 거의 없고,
 * basePath 접두사를 직접 다루는 편이 예측 가능하다(`asset()`).
 */
export function GameThumbnail({
  game,
  long = false,
  className,
  priority = false,
}: {
  game: Game;
  /** 세로형(2:3) 아이콘을 먼저 찾을지. 추천 띠에서만 true. */
  long?: boolean;
  className?: string;
  /** 첫 화면에 보이는 그림이면 true — 미루지 않고 바로 받는다. */
  priority?: boolean;
}) {
  // long 을 요청했는데 파일이 없으면 정사각으로 한 번 되돌린다.
  const [useLong, setUseLong] = useState(long);
  const [failed, setFailed] = useState(false);

  const src = iconUrl(game, useLong);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center",
          className,
        )}
        style={{ backgroundColor: game.accent }}
      >
        <span className="text-2xl font-bold text-white/90">
          {game.title.slice(0, 1)}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={game.title}
      className={cn("h-full w-full object-cover", className)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onError={() => {
        // _long 이 없어서 실패한 것이면 정사각으로 한 번 더 시도한다.
        if (useLong) setUseLong(false);
        else setFailed(true);
      }}
    />
  );
}
