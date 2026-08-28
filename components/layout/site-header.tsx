import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { asset } from "@/lib/site";
import { SearchBox } from "./search-box";

/**
 * 사이트 맨 위 줄. 로고 · 검색 · 로그인.
 *
 * `sticky` 로 붙여 둔다 — 게임을 훑어 내려가다가도 검색창이 늘 손에 닿아야 한다.
 * 다만 **눕힌 폰에서는 세로 자리가 부족해** 높이를 줄인다(`landscape-short`).
 */
export function SiteHeader() {
  return (
    <header
      className={[
        "sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur",
        "h-14 landscape-short:h-12",
      ].join(" ")}
    >
      <div className="mx-auto flex h-full max-w-screen-2xl items-center gap-3 px-3 sm:gap-4 sm:px-4">
        <Link
          href="/"
          className="shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="SaltPlay 홈"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/brand/logo.png")}
            alt="SaltPlay"
            className="h-8 w-auto sm:h-9 landscape-short:h-7"
            // 로고는 첫 화면에 반드시 보이므로 미루지 않는다.
            loading="eager"
            decoding="async"
          />
        </Link>

        {/* 검색창이 남는 자리를 전부 먹는다. 좁은 폰에서는 로고 옆에 붙어 작아진다. */}
        <SearchBox className="min-w-0 flex-1 sm:max-w-xl sm:mx-auto" />

        <div className="shrink-0">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
