import Link from "next/link";
import type { Audience } from "@/lib/games";
import { asset } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * 이용 등급 스위치. 앱 홈 맨 위의 두 로고와 같은 것이다.
 *
 * ## 왜 화면 상태가 아니라 주소를 바꾸나
 *
 * 자바스크립트로 목록만 갈아 끼우면 **성인용 게임이 전체이용가 페이지의 HTML 에도
 * 들어간다.** 정적 사이트라 그 HTML 이 그대로 검색엔진에 올라간다.
 * 그래서 `/` 와 `/adult` 를 아예 다른 페이지로 두고, 이 스위치는 링크로 만든다.
 * `/adult` 쪽만 noindex 라서 성인용은 검색 결과에 나오지 않는다.
 *
 * 링크라서 자바스크립트가 없어도 동작하고, 뒤로 가기도 자연스럽게 맞는다.
 *
 * ## 고르지 않은 쪽을 흑백으로 만들지 않는다
 *
 * 채도를 빼면 성인용의 주황이 사라져 두 쪽이 똑같은 회색이 된다. 밝기만 낮춘다.
 * 글씨색은 `globals.css` 의 토큰에, 그림은 `brightness(0.78)` 로 맞춰 두었다.
 * 둘 중 하나만 바꾸면 글씨와 그림의 어두운 정도가 어긋난다.
 */
export function AudienceSwitch({ current }: { current: Audience }) {
  return (
    // role="radiogroup" 이 아니라 평범한 링크 묶음이다 — 실제로 페이지를 옮기므로
    // 화면 낭독기에도 그렇게 알려 주는 편이 정확하다.
    <nav aria-label="이용 등급" className="flex items-center gap-3">
      <AudienceLink
        href="/"
        mascot="/brand/mascot.png"
        label="Games"
        active={current === "all"}
        activeClass="text-foreground"
        inactiveClass="text-audience-inactive"
      />

      <span aria-hidden className="h-7 w-px bg-border" />

      <AudienceLink
        href="/adult"
        mascot="/brand/mascot-adult.png"
        label="Adult"
        active={current === "adult"}
        activeClass="text-adult"
        inactiveClass="text-adult-inactive"
      />
    </nav>
  );
}

function AudienceLink({
  href,
  mascot,
  label,
  active,
  activeClass,
  inactiveClass,
}: {
  href: string;
  mascot: string;
  label: string;
  active: boolean;
  activeClass: string;
  inactiveClass: string;
}) {
  return (
    <Link
      href={href}
      // 지금 고른 쪽이 어디인지 화면 낭독기에 알려 준다.
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg px-1.5 py-1 transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
        active ? activeClass : inactiveClass,
        !active && "hover:brightness-125",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset(mascot)}
        alt=""
        className={cn(
          "h-9 w-9 shrink-0 transition sm:h-10 sm:w-10",
          // 글씨색 토큰과 같은 0.78 배다. 한쪽만 바꾸면 톤이 어긋난다.
          !active && "brightness-[0.78]",
        )}
        loading="eager"
        decoding="async"
      />

      {/* 로고 그림에는 글씨가 들어 있지 않아서 옆에 두 줄로 그린다(앱과 같다). */}
      <span className="text-left text-xs font-bold leading-tight sm:text-sm">
        SaltPlay
        <br />
        {label}
      </span>
    </Link>
  );
}
