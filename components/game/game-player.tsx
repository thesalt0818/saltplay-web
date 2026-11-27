"use client";

import {
  Maximize,
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
 * ## 시작 방식
 *
 * 어느 기기에서든 표지의 '플레이'를 눌러야 시작한다. 그 뒤가 다르다.
 *
 * - **PC**: 플레이어 안에서 그대로 실행된다. 창이 이미 넓다.
 * - **폰**: 누르는 그 순간 **전체화면으로 들어간다.**
 *
 * ⚠️ **버튼을 없앨 수 없다.** 브라우저는 사용자가 직접 누르지 않으면 전체화면을
 * 허용하지 않는다(보안 정책). 자동으로 부르면 조용히 거부당한다.
 * 그래서 그 한 번의 누름을 시작과 전체화면에 함께 쓴다.
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
  /**
   * 브라우저 전체화면이 안 될 때 우리가 직접 화면을 덮는 상태.
   * iOS 사파리처럼 전체화면 기능이 없는 기기에서 이게 유일한 방법이다.
   */
  const [immersive, setImmersive] = useState(false);

  /** 손가락으로 쓰는 기기인가. 화면 폭이 아니라 입력 방식으로 판단한다. */
  const [touchDevice, setTouchDevice] = useState(false);
  /** 지금 기기가 세로로 들려 있는가. */
  const [viewportPortrait, setViewportPortrait] = useState(true);

  /**
   * 가로·세로를 둘 다 지원하는 게임인가(`orientation: "sensor"`).
   * 이런 게임은 방향을 잠그지 않고, 사용자가 폰을 돌리는 대로 따라간다.
   * 앱(`game_screen.dart`)도 `sensor` 면 회전을 잠그지 않는다 — 같은 뜻이다.
   */
  const free = game.orientation === "sensor";

  /**
   * 지금 가로로 그려야 하는가. 메뉴 띠 위치(위/왼쪽)와 플레이어 비율이 이걸 따른다.
   * 고정 게임은 정해진 방향, `sensor` 게임은 **지금 기기 방향**을 따른다.
   */
  const landscape = free ? !viewportPortrait : game.orientation === "landscape";

  // 기기 종류와 지금 방향을 지켜본다.
  // 서버에서는 알 수 없으므로 화면이 뜬 뒤에 읽는다.
  useEffect(() => {
    setTouchDevice(window.matchMedia("(pointer: coarse)").matches);

    const query = window.matchMedia("(orientation: portrait)");
    const update = () => setViewportPortrait(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  /**
   * 게임을 90° 돌려서 그려야 하는가.
   *
   * ## 왜 이런 게 필요한가
   *
   * `screen.orientation.lock()` 은 **브라우저 전체화면이 성공했을 때만** 동작한다.
   * iOS 사파리는 그 전체화면 자체가 없으니 잠금도 걸리지 않는다. 그래서 자동 회전이
   * 켜진 폰을 눕히면 세로 게임이 같이 누워 버린다.
   *
   * 막을 수 없다면 **거꾸로 돌려서 되돌린다.** 화면이 가로가 됐는데 게임이 세로여야
   * 하면, 게임을 90° 돌려 그린다. 사용자가 폰을 돌린 만큼 화면 안에서 되돌아가므로
   * 눈에는 그대로 세로로 보인다 — 회전이 잠긴 것과 같은 결과다.
   *
   * ## 조건이 좁은 이유
   *
   * - 전체화면(`immersive`)일 때만. 평소 페이지에서 돌리면 글이 다 누워 버린다.
   * - 손가락 기기에서만. PC 창은 대부분 가로라, 세로 게임을 열 때마다 화면 전체가
   *   돌아가 버린다.
   * - `sensor` 게임은 돌리지 않는다. 기기를 따라 도는 것이 원래 원하는 동작이다.
   */
  const rotated =
    !free &&
    immersive &&
    touchDevice &&
    (landscape ? viewportPortrait : !viewportPortrait);

  /** 전체화면인가(브라우저 방식이든 우리 방식이든). 이때 메뉴 띠가 생긴다. */
  const fullscreen = isFullscreen || immersive;

  /** 게임을 실제로 띄운다. '계속 플레이하기'에 쌓이는 시점도 여기다. */
  const start = useCallback(() => {
    setStarted(true);
    pushRecent(game.id);
  }, [game.id]);

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

  /**
   * 게임이 "준비됐다"고 알려 오면 지금 음소거 상태를 다시 보낸다.
   *
   * ⚠️ iframe 의 `load` 는 **게임 엔진이 부팅되기 전에** 끝난다. 그때 보낸 음소거
   * 명령은 게임이 아직 받을 준비가 안 돼서 그냥 사라진다. 그래서 게임 쪽이
   * 준비를 마치고 `saltplay:ready` 를 보내 오면 여기서 한 번 더 보낸다.
   */
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // 우리가 띄운 게임에서 온 것만 받는다
      if (event.source !== iframeRef.current?.contentWindow) return;
      if ((event.data as { type?: string } | null)?.type !== "saltplay:ready") {
        return;
      }
      applyMute(muted);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [applyMute, muted]);

  /* ── 전체화면 ────────────────────────────────────────────────────────── */

  // 화면을 덮는 동안에는 뒤 페이지가 따라 스크롤되지 않아야 한다.
  // Esc 로도 빠져나올 수 있게 한다(브라우저 전체화면은 Esc 가 기본이지만
  // 우리 방식은 직접 처리해야 한다).
  useEffect(() => {
    if (!immersive) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImmersive(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [immersive]);

  // 브라우저의 전체화면 상태를 따라간다. Esc 나 기기 버튼으로 빠져나가도
  // 우리 버튼이 실제 상태와 어긋나지 않아야 한다.
  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === frameRef.current);

    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /**
   * 전체화면으로 들어간다.
   *
   * ⚠️ **브라우저의 전체화면 기능만 믿으면 안 된다.**
   * iOS 사파리는 일반 요소의 전체화면을 **아예 지원하지 않는다**(영상만 된다).
   * 그래서 요청이 조용히 실패하고 작은 화면 그대로 남는다 — 실제로 겪은 증상이다.
   *
   * 그래서 실패하면 **우리가 직접 화면을 덮는다**(`immersive`). CSS 로 화면 전체를
   * 채우는 것이라 어느 기기에서든 통한다. 주소창이 남는다는 차이는 있지만
   * 게임은 화면을 꽉 채운다.
   */
  const enterFullscreen = useCallback(async () => {
    const el = frameRef.current;
    if (!el) return;

    // 어떤 방법이든 화면은 채워야 하므로 우리 방식을 먼저 켠다.
    // 브라우저 전체화면이 성공하면 그 위에 얹히므로 어색해지지 않는다.
    setImmersive(true);

    // webkit 접두사가 붙은 옛 방식도 함께 본다(구형 안드로이드 브라우저).
    const request =
      el.requestFullscreen ??
      (el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
        .webkitRequestFullscreen;

    if (!request) return;

    try {
      await request.call(el);
    } catch {
      // 브라우저가 막았다 — 위에서 켠 우리 방식으로 계속한다.
      return;
    }

    // 가로·세로 둘 다 되는 게임은 잠그지 않는다 — 사용자가 돌리는 대로 따라간다.
    if (free) return;

    // 방향 고정은 되면 좋고 안 되면 그만이다. 예외를 그냥 삼킨다.
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (value: string) => Promise<void>;
      };
      await orientation.lock?.(landscape ? "landscape" : "portrait");
    } catch {
      /* 지원하지 않는 기기 — 무시한다 */
    }
  }, [free, landscape]);

  const exitFullscreen = useCallback(async () => {
    setImmersive(false);

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* 이미 나와 있으면 그만이다 */
      }
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
            "relative overflow-hidden bg-black",
            // 브라우저 전체화면일 때는 비율·크기 제한을 모두 푼다.
            "[&:fullscreen]:aspect-auto [&:fullscreen]:h-full [&:fullscreen]:w-full [&:fullscreen]:max-h-none [&:fullscreen]:rounded-none",
            immersive
              ? // 우리가 직접 화면을 덮는 경우. 헤더(z-40)보다 위에 있어야 한다.
                // 크기는 아래 style 에서 정한다(돌려야 할 때 가로세로가 뒤바뀐다).
                "fixed z-[60]"
              : [
                  "rounded-xl",
                  landscape
                    ? "aspect-video w-full"
                    : // 세로 게임을 16:9 틀에 넣으면 폭에 맞춰 커지면서 위아래가 잘린다.
                      // 그래서 세로 비율을 지키되, 넓은 화면에서는 **높이**를 먼저
                      // 정하고 폭이 거기서 따라 나오게 한다. 그러지 않으면 플레이어가
                      // 화면보다 길어져서 아래 조작 줄이 스크롤해야 보인다.
                      "aspect-[3/4] w-full sm:h-[calc(100dvh-13rem)] sm:max-h-[700px] sm:w-auto",
                ],
          )}
          style={
            immersive
              ? rotated
                ? {
                    // 화면을 90° 돌려서 채운다.
                    // 가로세로를 뒤바꾼 상자를 왼쪽 위 모서리 기준으로 돌리고,
                    // 오른쪽 끝(100dvw)에서 시작하게 두면 화면에 딱 맞아떨어진다.
                    top: 0,
                    left: "100dvw",
                    width: "100dvh",
                    height: "100dvw",
                    transformOrigin: "0 0",
                    transform: "rotate(90deg)",
                  }
                : { top: 0, left: 0, width: "100dvw", height: "100dvh" }
              : undefined
          }
        >
          {/*
            게임이 그려지는 자리.
            전체화면일 때는 메뉴 띠만큼 비켜 선다 — 세로 게임은 위, 가로 게임은 왼쪽.
            ⚠️ 이 상자는 **늘 같은 자리에 둔다.** 전체화면 여부에 따라 iframe 을
            다른 상자로 옮기면 React 가 iframe 을 새로 만들어 게임이 처음부터
            다시 로드된다(진행이 날아간다). 그래서 위치(className)만 바꾼다.
          */}
          <div
            className={cn(
              "absolute",
              !fullscreen && "inset-0",
              fullscreen &&
                (landscape
                  ? "inset-y-0 left-14 right-0"
                  : "inset-x-0 bottom-0 top-11"),
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
                  start();

                  // 폰에서만 전체화면으로 들어간다. PC 는 창이 이미 넓어서
                  // 플레이어 안에서 그대로 하는 편이 낫다.
                  //
                  // ⚠️ 반드시 이 자리(누른 순간)에서 불러야 한다. 나중으로 미루면
                  // '사용자가 누른 것'으로 쳐 주지 않아 전체화면이 조용히 거부된다.
                  if (window.matchMedia("(pointer: coarse)").matches) {
                    enterFullscreen();
                  }
                }}
              />
            )}
          </div>

          {/*
            전체화면 메뉴 띠 — 세로 게임은 위, 가로 게임은 왼쪽.

            예전에는 버튼을 게임 위에 띄웠더니 게임의 UI(코인·설정 버튼 등)를
            가렸다. 그래서 띠만큼 게임 자리를 비워 두고 거기에 버튼을 둔다.

            ⚠️ **반드시 플레이어 안에 있어야 한다.** 전체화면일 때는 이 상자만
            화면에 보이므로, 아래 조작 줄에 두면 나가는 방법이 사라진다.
            폰에는 Esc 키가 없어서 이 띠가 유일한 출구다.

            돌려 그릴 때(`rotated`)도 띠는 상자와 함께 돌아가므로 늘 게임의
            위(또는 왼쪽)에 붙어 있다.
          */}
          {fullscreen && (
            <div
              className={cn(
                "absolute flex justify-between bg-black p-1.5",
                landscape
                  ? "inset-y-0 left-0 w-14 flex-col items-center"
                  : "inset-x-0 top-0 h-11 items-center",
              )}
            >
              {/* 게임을 끝내고 목록으로 돌아가는 길. 전체화면에서는 사이트의
                  메뉴가 하나도 안 보이므로 이 버튼이 없으면 갇힌 느낌이 된다. */}
              <button
                type="button"
                onClick={quitToHome}
                className={cn(
                  "flex items-center justify-center rounded-md bg-white/40 font-bold",
                  "text-white transition hover:bg-white/50",
                  landscape
                    ? "w-11 flex-col gap-1.5 py-2 text-base"
                    : "h-full gap-1 px-2.5 text-sm",
                )}
              >
                <X
                  className={landscape ? "h-7 w-7" : "h-5 w-5"}
                  strokeWidth={3.5}
                  aria-hidden
                />
                {/* 왼쪽 띠에서는 글씨를 눕혀 **아래에서 위로** 읽히게 쓴다.
                    vertical-rl 만 쓰면 위에서 아래로 읽혀서 180° 더 돌린다.
                    (같은 일을 하는 sideways-lr 은 구형 iOS 사파리가 몰라서 안 쓴다.) */}
                <span
                  className={cn(
                    landscape &&
                      "rotate-180 [writing-mode:vertical-rl] [text-orientation:sideways]",
                  )}
                >
                  종료
                </span>
              </button>

              <div
                className={cn(
                  "flex items-center gap-1.5",
                  landscape && "flex-col-reverse",
                )}
              >
                {/* 흰 테두리 알약. 종료(꽉 찬 회색)와 모양을 달리해 잘못 누르지 않게 한다. */}
                <button
                  type="button"
                  onClick={exitFullscreen}
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 border-white",
                    "text-sm font-bold text-white transition hover:bg-white/10",
                    landscape
                      ? "w-10 py-3 rotate-180 [writing-mode:vertical-rl] [text-orientation:sideways]"
                      : "h-8 px-3",
                  )}
                >
                  작게 보기
                </button>
                <BarButton
                  label={muted ? "소리 켜기" : "소리 끄기"}
                  onClick={toggleMute}
                  active={muted}
                >
                  {muted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </BarButton>
              </div>
            </div>
          )}

          {/* 세로로 든 폰에서 가로 게임을 열었을 때만 나온다.
            CSS 조건만으로 판단하므로 자바스크립트가 관여하지 않는다.
            전체화면에서는 게임을 돌려 그려 주므로 띄울 필요가 없다. */}
          {landscape && !free && started && !fullscreen && (
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

/** 전체화면 메뉴 띠의 아이콘 버튼. */
function BarButton({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md text-white transition hover:bg-white/10",
        active && "text-primary",
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
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
