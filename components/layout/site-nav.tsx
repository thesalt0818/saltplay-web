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
  /** 이 항목 앞에 가는 구분선을 넣을지. 성격이 다른 묶음을 나눈다. */
  dividerBefore?: boolean;
};

const ITEMS: NavItem[] = [
  { href: "/", label: "홈", icon: Home, onBottomBar: true },
  { href: "/search", label: "검색", icon: Search, onBottomBar: true },

  {
    href: "/category/hot",
    label: "인기 게임",
    icon: Flame,
    dividerBefore: true,
  },
  { href: "/category/casual", label: "캐주얼", icon: Gamepad2 },
  { href: "/category/idle", label: "방치형", icon: Timer },
  { href: "/category/puzzle", label: "퍼즐", icon: Brain },
  { href: "/category/action", label: "액션", icon: Swords },

  {
    href: "/my",
    label: "내 게임",
    icon: Star,
    onBottomBar: true,
    dividerBefore: true,
  },
  { href: "/profile", label: "프로필", icon: User, onBottomBar: true },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * 데스크톱·태블릿의 왼쪽 세로 레일. 마우스를 올리면 펼쳐지며 이름이 나온다.
 *
 * ## 왜 펼쳐지게 하나
 *
 * 아이콘만 있으면 무슨 메뉴인지 알 수 없다. 그렇다고 늘 펼쳐 두면 게임이 놓일
 * 가로 자리를 224px 씩 잡아먹는다. CrazyGames 가 쓰는 방식을 그대로 따랐다.
 *
 * ## 펼쳐질 때 내용이 밀리지 않는다
 *
 * 바깥의 `<div>` 가 **자리만 잡는 빈 칸**(64px)이고, 실제 메뉴는 그 안에서
 * `absolute` 로 떠서 넓어진다. 그래서 펼쳐질 때 게임 목록이 오른쪽으로 밀리거나
 * 줄이 다시 계산되지 않는다. 밀리게 만들면 마우스를 스칠 때마다 화면 전체가
 * 출렁여서 쓰기 어렵다.
 *
 * ## 마우스뿐 아니라 키보드로도 펼쳐진다
 *
 * `focus-within` 을 함께 건다. Tab 키로 이동하는 사람에게 이름이 안 보이면
 * 어디로 가는 링크인지 알 수 없다.
 */
export function SiteRail() {
  const isActive = useIsActive();

  return (
    // 자리만 잡는 빈 칸. 실제 메뉴는 이 안에서 떠 있다.
    //
    // ⚠️ `z-30` 은 **바깥 칸에** 있어야 한다. `position: sticky` 는 그 자체로
    // 쌓임 맥락(stacking context)을 만들기 때문에, 안쪽 메뉴에만 z-30 을 주면
    // 그 값이 이 칸 안에서만 통하고 **바깥의 게임 카드가 메뉴 위로 덮인다.**
    // 실제로 그렇게 만들었다가 펼친 메뉴가 카드에 가려지는 것을 보고 고쳤다.
    <div className="sticky top-14 z-30 hidden h-[calc(100dvh-3.5rem)] w-16 shrink-0 lg:block">
      <nav
        aria-label="주요 메뉴"
        className={cn(
          "group/rail absolute inset-y-0 left-0 z-30 w-16",
          "overflow-y-auto overflow-x-hidden border-r border-border bg-background py-3",
          // 펼쳐질 때 아래 내용과 겹치므로 그림자로 층을 나눈다.
          "transition-[width,box-shadow] duration-200 ease-out",
          "hover:w-56 hover:shadow-2xl hover:shadow-black/60",
          "focus-within:w-56 focus-within:shadow-2xl focus-within:shadow-black/60",
        )}
      >
        <ul className="flex flex-col gap-1">
          {ITEMS.map((item) => (
            <li key={item.href}>
              {item.dividerBefore && (
                <hr className="my-2 border-border" aria-hidden />
              )}

              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "mx-2 flex h-12 items-center gap-4 rounded-xl transition-colors",
                  // px-3 = 12px. 아이콘 24px 과 좌우 여백이 (12+2)+24+... 로
                  // 접힌 폭 64px 안에서 가운데에 오도록 맞춘 값이다.
                  "px-3",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                  isActive(item.href)
                    ? "bg-surface-high text-primary"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
                )}
              >
                <item.icon className="h-6 w-6 shrink-0" aria-hidden />

                {/*
                  접혀 있을 때도 글씨는 그대로 둔다(투명하게만 만든다).
                  `hidden` 으로 지우면 화면 낭독기도 못 읽어서 아이콘만 남는다.
                  넘치는 부분은 바깥 nav 의 overflow-x-hidden 이 잘라 준다.
                */}
                <span
                  className={cn(
                    "whitespace-nowrap text-sm font-bold opacity-0",
                    "transition-opacity duration-200",
                    "group-hover/rail:opacity-100 group-focus-within/rail:opacity-100",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
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
