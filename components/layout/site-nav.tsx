"use client";

import {
  Brain,
  Flame,
  Gamepad2,
  Home,
  Search,
  Star,
  Swords,
  Timer,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * 사이트 이동 메뉴.
 *
 * ## 화면 크기에 따라 두 모습이 된다
 *
 * - 데스크톱·태블릿(lg 이상): 왼쪽 세로 아이콘 레일 (CrazyGames 형태)
 * - 폰: 화면 아래 4탭 (Flutter 앱과 같은 형태)
 *
 * **같은 목록을 두 벌 만들지 않는다.** 항목이 하나만 어긋나도 기기에 따라 메뉴가
 * 달라지는데, 그런 어긋남은 한쪽 기기에서만 보여 늦게 발견된다.
 *
 * 활성 표시를 위해 현재 주소를 알아야 해서 클라이언트 컴포넌트다.
 * 링크 자체는 `<a>` 로 나가므로 검색엔진이 카테고리 페이지를 찾아갈 수 있다.
 */

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  /** 폰 하단 탭에도 넣을지. 넣지 않는 항목은 데스크톱 레일에만 나온다. */
  onBottomBar?: boolean;
};

const ITEMS: NavItem[] = [
  { href: "/", label: "홈", icon: Home, onBottomBar: true },
  { href: "/search", label: "검색", icon: Search, onBottomBar: true },
  { href: "/category/hot", label: "인기", icon: Flame },
  { href: "/category/casual", label: "캐주얼", icon: Gamepad2 },
  { href: "/category/idle", label: "방치형", icon: Timer },
  { href: "/category/puzzle", label: "퍼즐", icon: Brain },
  { href: "/category/action", label: "액션", icon: Swords },
  { href: "/my", label: "내 게임", icon: Star, onBottomBar: true },
  { href: "/profile", label: "프로필", icon: User, onBottomBar: true },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** 데스크톱·태블릿의 왼쪽 세로 레일. */
export function SiteRail() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="주요 메뉴"
      className={cn(
        "sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-16 shrink-0 lg:block",
        "overflow-y-auto border-r border-border bg-background py-3",
      )}
    >
      <ul className="flex flex-col items-center gap-1">
        {ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              title={item.label}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "grid h-12 w-12 place-items-center rounded-xl transition",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                isActive(item.href)
                  ? "bg-surface-high text-primary"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              <item.icon className="h-6 w-6" aria-hidden />
              <span className="sr-only">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * 폰의 하단 탭. 앱과 같은 4개다.
 *
 * 바탕은 `bg-bottombar`(#0E0E0E) — 배경이 순검정이라 **한 단계 밝게** 깔아야
 * 바가 구분된다(앱에서 방향을 뒤집었다가 고친 자리다).
 */
export function SiteBottomBar() {
  const isActive = useIsActive();
  const items = ITEMS.filter((item) => item.onBottomBar);

  return (
    <nav
      aria-label="주요 메뉴"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bottombar lg:hidden",
        // 아이폰 홈 바에 가려지지 않게 한다.
        "pb-[env(safe-area-inset-bottom)]",
        // 눕힌 폰에서는 세로 자리가 귀해서 바를 낮춘다.
        "landscape-short:hidden",
      )}
    >
      <ul className="mx-auto flex max-w-md">
        {items.map((item) => (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold transition",
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-6 w-6" aria-hidden />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
