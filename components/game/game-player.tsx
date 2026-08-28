"use client";

import {
  ExternalLink,
  Maximize,
  Play,
  RotateCcw,
  Smartphone,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { Game } from "@/lib/games";
import { playUrl } from "@/lib/games";
import { cn } from "@/lib/utils";
import { GameThumbnail } from "./game-thumbnail";

/**
 * 게임 전용 플레이어.
 *
 * 게임은 이 사이트에 들어 있지 않다 — 바깥(GitHub Pages)에 따로 배포된 HTML5
 * 빌드를 `<iframe>` 으로 불러온다. 앱이 WebView 로 하는 일과 같다.
 *
 * ## 왜 처음에는 iframe 을 안 띄우나
 *
 * 페이지에 들어오자마자 게임을 받기 시작하면 **아직 할 생각이 없는 사람에게도**
 * 수 MB 를 내려받게 하고, 소리가 갑자기 나기도 한다. 그래서 표지를 먼저 보여 주고
 * '플레이'를 누른 뒤에 iframe 을 만든다. 이 방식은 검색엔진에도 유리하다 —
 * 크롤러는 게임을 실행하지 않고 설명 글만 읽는다.
 *
 * ## 회전 대비
 *
 * 가로 게임을 세로로 든 폰에서 열면 화면이 손톱만 해진다. 그때는 "가로로 돌려
 * 주세요" 안내를 띄운다. `screen.orientation.lock()` 은 전체화면에서만, 그것도
 * 되는 기기에서만 동작하므로 **실패해도 게임은 그대로 돌아가야 한다.**
 */
export function GamePlayer({ game }: { game: Game }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [noticeOpen, setNoticeOpen] = useState(true);

  // 가로 게임인지. 'sensor'(기기에 맡김)는 가로로 본다 — 대부분 가로가 기본이다.
  const landscape = game.orientation !== "portrait";

  const goFullscreen = useCallback(async () => {
    const el = frameRef.current;
    if (!el) return;

    try {
      await el.requestFullscreen();
    } catch {
      // 브라우저가 막으면 그냥 전체화면 없이 계속한다.
      return;
    }

    // 방향 고정은 되면 좋고 안 되면 그만이다. 예외를 그냥 삼킨다.
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (value: string) => Promise<void>;
      };
      await orientation.lock?.(landscape ? "landscape" : "portrait");
    } catch {
      /* 지원하지 않는 기기 — 무시한다 */
    }
  }, [landscape]);

  return (
    <div className="flex flex-col gap-2">
      {noticeOpen && (
        <div className="flex items-center gap-3 rounded-lg bg-surface-high px-4 py-2.5 text-sm">
          <p className="min-w-0 flex-1 text-muted-foreground">
            로그인하면 즐겨찾기와 최근 플레이가 저장됩니다.
          </p>
          <Link
            href="/auth/login"
            className="shrink-0 font-bold text-primary hover:underline"
          >
            로그인
          </Link>
          <button
            type="button"
            onClick={() => setNoticeOpen(false)}
            aria-label="안내 닫기"
            className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 세로 게임을 가운데로 모으기 위한 줄. 가로 게임은 폭을 다 쓰므로 영향이 없다. */}
      <div className="flex justify-center">
        <div
          ref={frameRef}
          className={cn(
            "relative overflow-hidden rounded-xl bg-black",
            // 전체화면일 때는 비율·크기 제한을 모두 풀고 화면을 꽉 채운다.
            "[&:fullscreen]:aspect-auto [&:fullscreen]:h-full [&:fullscreen]:w-full [&:fullscreen]:max-h-none [&:fullscreen]:rounded-none",
            landscape
              ? "aspect-video w-full"
              : // 세로 게임을 16:9 틀에 넣으면 폭에 맞춰 커지면서 위아래가 잘린다.
                // 그래서 세로 비율을 지키되, 넓은 화면에서는 **높이**를 먼저 정하고
                // 폭이 거기서 따라 나오게 한다. 그러지 않으면 플레이어가 화면보다
                // 길어져서 아래 조작 줄이 스크롤해야 보인다.
                [
                  "aspect-[3/4] w-full",
                  "sm:h-[calc(100dvh-13rem)] sm:max-h-[700px] sm:w-auto",
                ].join(" "),
          )}
        >
          {started ? (
            <iframe
              key={reloadKey}
              src={playUrl(game)}
              title={game.title}
              className="absolute inset-0 h-full w-full border-0"
              // autoplay 가 없으면 화면을 한 번 건드리기 전까지 소리가 나지 않는다.
              allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
              // 게임은 남의 사이트다. 최소 권한만 준다.
              sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
            />
          ) : (
            <PlayPoster game={game} onStart={() => setStarted(true)} />
          )}

          {/* 세로로 든 폰에서 가로 게임을 열었을 때만 나온다.
            CSS 조건만으로 판단하므로 자바스크립트가 관여하지 않는다. */}
          {landscape && started && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 hidden justify-center portrait:touch:flex">
              <p className="flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-xs text-white">
                <Smartphone className="h-4 w-4" aria-hidden />
                가로로 돌리면 더 크게 즐길 수 있습니다
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 플레이어 아래 조작 줄 — 두 번째 시안의 그 자리다. */}
      <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-icon">
          <GameThumbnail game={game} priority />
        </div>
        <p className="min-w-0 flex-1 truncate font-bold">{game.title}</p>

        {started && (
          <PlayerButton
            label="다시 시작"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            <RotateCcw className="h-5 w-5" />
          </PlayerButton>
        )}
        <PlayerButton label="전체화면" onClick={goFullscreen}>
          <Maximize className="h-5 w-5" />
        </PlayerButton>
        <a
          href={playUrl(game)}
          target="_blank"
          rel="noopener noreferrer"
          title="새 탭에서 열기"
          className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-surface-high hover:text-foreground"
        >
          <ExternalLink className="h-5 w-5" />
          <span className="sr-only">새 탭에서 열기</span>
        </a>
      </div>
    </div>
  );
}

/** 게임을 시작하기 전에 보이는 표지. */
function PlayPoster({ game, onStart }: { game: Game; onStart: () => void }) {
  return (
    <div className="absolute inset-0">
      {/* 아이콘을 크게 늘려 흐린 배경으로 쓴다 — 게임마다 표지 색이 달라진다. */}
      <div className="absolute inset-0 scale-110 blur-2xl opacity-40">
        <GameThumbnail game={game} priority />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 px-4">
        <div className="h-24 w-24 overflow-hidden rounded-icon shadow-xl shadow-black/50 sm:h-28 sm:w-28">
          <GameThumbnail game={game} priority />
        </div>

        <button
          type="button"
          onClick={onStart}
          className={cn(
            "flex items-center gap-2 rounded-full bg-primary px-7 py-3",
            "text-base font-bold text-primary-foreground transition",
            "hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white",
          )}
        >
          <Play className="h-5 w-5 fill-current" aria-hidden />
          플레이
        </button>
      </div>
    </div>
  );
}

function PlayerButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-surface-high hover:text-foreground"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
