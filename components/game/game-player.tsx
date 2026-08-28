"use client";

import {
  Home,
  Maximize,
  Minimize,
  Play,
  Smartphone,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/games";
import { playUrl } from "@/lib/games";
import { pushRecent } from "@/lib/recent";
import { cn } from "@/lib/utils";
import { GameThumbnail } from "./game-thumbnail";

/**
 * 게임 전용 플레이어.
 *
 * 게임은 이 사이트에 들어 있지 않다 — 바깥(GitHub Pages)에 따로 배포된 HTML5
 * 빌드를 `<iframe>` 으로 불러온다. 앱이 WebView 로 하는 일과 같다.
 *
 * ## 시작 방식이 기기마다 다르다
 *
 * - **PC**: 페이지에 들어오면 바로 실행된다. 창이 넓어 플레이어 안에서 그대로 할 수 있다.
 * - **폰**: '플레이'를 한 번 눌러야 하고, 그 누름이 곧 **전체화면 진입**이 된다.
 *
 * ⚠️ **폰에서 버튼을 없앨 수 없다.** 브라우저는 사용자가 직접 누르지 않으면
 * 전체화면을 허용하지 않는다(보안 정책). 자동으로 부르면 조용히 거부당해서
 * 작은 화면에 그대로 남는다. 그래서 그 한 번의 누름을 시작과 전체화면에 함께 쓴다.
 *
 * 기기 판단은 **화면 폭이 아니라 입력 방식**(`pointer: coarse`)으로 한다.
 * 태블릿을 눕히면 1280px 이 되어 폭으로는 PC 로 오인된다.
 *
 * ## 조작 줄
 *
 * 추천 · 비추천 · 음소거가 있고, **전체화면은 폰에서만** 나온다. PC 는 창이 이미
 * 크고 Esc 로 빠져나오는 방법도 있지만, 폰은 화면이 좁아 전체화면이 실제로 필요하다.
 */
export function GamePlayer({ game }: { game: Game }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const router = useRouter();

  const [started, setStarted] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 가로 게임인지. 'sensor'(기기에 맡김)는 가로로 본다 — 대부분 가로가 기본이다.
  const landscape = game.orientation !== "portrait";

  /** 게임을 실제로 띄운다. '계속 플레이하기'에 쌓이는 시점도 여기다. */
  const start = useCallback(() => {
    setStarted(true);
    pushRecent(game.id);
  }, [game.id]);

  // PC 는 들어오자마자 실행한다.
  //
  // ⚠️ 손가락 기기에서는 그러지 않는다. 자동으로 시작해 버리면 전체화면으로 들어갈
  // 기회(사용자의 누름)를 잃어서, 폰에서 손톱만 한 화면으로 게임을 하게 된다.
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    start();
  }, [start]);

  /* ── 음소거 ──────────────────────────────────────────────────────────────
   *
   * iframe 안은 남의 페이지라 마음대로 들여다볼 수 없다. 두 가지를 함께 시도한다.
   *
   * 1. **같은 출처면 직접 끈다.** 게임이 사이트와 같은 도메인(github.io)에 있으면
   *    안의 `<audio>`/`<video>` 를 그대로 만질 수 있다.
   * 2. **게임에 메시지를 보낸다.** Cocos 같은 엔진은 소리를 Web Audio 로 내는데,
   *    그건 밖에서 끌 방법이 없다. 게임 쪽에서 이 메시지를 받아 스스로 꺼 줘야 한다.
   *    (게임에 넣을 코드는 CLAUDE.md 4절에 적어 두었다.)
   *
   * 둘 다 실패해도 **예외를 밖으로 내보내지 않는다.** 소리 하나 때문에 게임 화면이
   * 통째로 죽으면 안 된다.
   */
  const applyMute = useCallback(
    (next: boolean) => {
      const frame = iframeRef.current;
      if (!frame) return;

      try {
        frame.contentDocument
          ?.querySelectorAll<HTMLMediaElement>("audio, video")
          .forEach((element) => {
            element.muted = next;
          });
      } catch {
        /* 다른 출처의 게임 — 들여다볼 수 없다. 아래 메시지에 맡긴다. */
      }

      try {
        // 아무 데나 보내지 않도록 게임 주소의 출처로만 보낸다.
        const origin = new URL(game.url).origin;
        frame.contentWindow?.postMessage(
          { type: "saltplay:mute", muted: next },
          origin,
        );
      } catch {
        /* 주소가 이상하면 보낼 곳이 없다 */
      }
    },
    [game.url],
  );

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    applyMute(next);
  };

  /* ── 전체화면 ────────────────────────────────────────────────────────── */

  // 브라우저의 전체화면 상태를 따라간다. Esc 나 기기 버튼으로 빠져나가도
  // 우리 버튼이 실제 상태와 어긋나지 않아야 한다.
  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === frameRef.current);

    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enterFullscreen = useCallback(async () => {
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

  const exitFullscreen = useCallback(async () => {
    try {
      await document.exitFullscreen();
    } catch {
      /* 이미 나와 있으면 그만이다 */
    }
    try {
      screen.orientation.unlock?.();
    } catch {
      /* 방향을 고정한 적이 없으면 그만이다 */
    }
  }, []);

  /**
   * 게임을 끝내고 홈으로 간다.
   *
   * ⚠️ 전체화면을 **먼저 벗어난 뒤** 이동한다. 전체화면인 채로 페이지를 옮기면
   * 브라우저에 따라 전체화면이 남아 홈 화면이 이상하게 보인다.
   */
  const quitToHome = useCallback(async () => {
    await exitFullscreen();
    router.push("/");
  }, [exitFullscreen, router]);

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
              ref={iframeRef}
              src={playUrl(game)}
              title={game.title}
              onLoad={() => applyMute(muted)}
              className="absolute inset-0 h-full w-full border-0"
              // autoplay 가 없으면 화면을 한 번 건드리기 전까지 소리가 나지 않는다.
              allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
              // 게임은 남의 사이트다. 최소 권한만 준다.
              sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
            />
          ) : (
            <PlayPoster
              game={game}
              onStart={() => {
                // 이 한 번의 누름이 시작과 전체화면 진입을 함께 맡는다.
                // 나눠서 부르면 두 번째는 '사용자가 누른 것'으로 쳐 주지 않아
                // 전체화면이 조용히 거부된다.
                start();
                enterFullscreen();
              }}
            />
          )}

          {/*
            전체화면에서 빠져나오는 버튼.
            ⚠️ **반드시 플레이어 안에 있어야 한다.** 전체화면일 때는 이 상자만
            화면에 보이므로, 아래 조작 줄에 두면 나가는 방법이 사라진다.
            폰에는 Esc 키가 없어서 이 버튼이 유일한 출구다.
          */}
          {isFullscreen && (
            <div className="absolute left-3 top-3 z-10 flex gap-2">
              <OverlayButton onClick={exitFullscreen}>
                <Minimize className="h-4 w-4" aria-hidden />
                작게 보기
              </OverlayButton>

              {/* 게임을 끝내고 목록으로 돌아가는 길. 전체화면에서는 사이트의
                  메뉴가 하나도 안 보이므로 이 버튼이 없으면 갇힌 느낌이 된다. */}
              <OverlayButton onClick={quitToHome}>
                <Home className="h-4 w-4" aria-hidden />
                게임 종료
              </OverlayButton>
            </div>
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

      {/* 플레이어 아래 조작 줄. */}
      <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-icon">
          <GameThumbnail game={game} priority />
        </div>
        <p className="min-w-0 flex-1 truncate font-bold">{game.title}</p>

        {/*
          추천·비추천은 아직 **모양만** 있다. 누가 무엇을 눌렀는지 기억할 곳
          (Supabase)이 없기 때문이다.
          ⚠️ 옆에 숫자를 지어내 붙이지 않는다. 없는 값을 그럴듯하게 보여 주면
          나중에 진짜 숫자가 붙었을 때 아무도 그 숫자를 믿지 않는다.
        */}
        <PlayerButton label="추천 (준비 중)" disabled>
          <ThumbsUp className="h-5 w-5" />
        </PlayerButton>
        <PlayerButton label="비추천 (준비 중)" disabled>
          <ThumbsDown className="h-5 w-5" />
        </PlayerButton>

        <PlayerButton
          label={muted ? "소리 켜기" : "소리 끄기"}
          onClick={toggleMute}
          active={muted}
        >
          {muted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </PlayerButton>

        {/* 전체화면은 폰에서만. PC 는 창이 이미 크다. */}
        <PlayerButton
          label="전체화면"
          onClick={enterFullscreen}
          className="lg:hidden"
        >
          <Maximize className="h-5 w-5" />
        </PlayerButton>
      </div>
    </div>
  );
}

/** 게임을 시작하기 전에 보이는 표지. */
function PlayPoster({ game, onStart }: { game: Game; onStart: () => void }) {
  return (
    <div className="absolute inset-0">
      {/* 아이콘을 크게 늘려 흐린 배경으로 쓴다 — 게임마다 표지 색이 달라진다. */}
      <div className="absolute inset-0 scale-110 opacity-40 blur-2xl">
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

/** 전체화면 위에 떠 있는 버튼. 게임 화면 위에서도 읽히도록 어둡게 깐다. */
function OverlayButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-2",
        "text-sm font-bold text-white backdrop-blur transition hover:bg-black/85",
      )}
    >
      {children}
    </button>
  );
}

function PlayerButton({
  label,
  onClick,
  children,
  disabled,
  active,
  className,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  /** 켜져 있는 상태(예: 음소거 중)를 눈에 띄게 한다. */
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-pressed={active}
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition",
        disabled
          ? "cursor-not-allowed text-muted-foreground/40"
          : "text-muted-foreground hover:bg-surface-high hover:text-foreground",
        active && "bg-surface-high text-primary",
        className,
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
