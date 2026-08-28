"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * 가로로 스크롤되는 줄. 데스크톱에서는 좌우 화살표가 나온다.
 *
 * ## 카드는 서버에서 그려진다
 *
 * 이 컴포넌트는 브라우저 동작(스크롤·화살표)만 담당하고, 안에 들어가는 카드는
 * `children` 으로 **서버에서 만들어진 것을 그대로 받는다.** 그래서 자바스크립트가
 * 아직 안 돌아도 카드와 링크는 HTML 에 이미 들어 있다 — SEO 가 깨지지 않는다.
 *
 * ## 다음 카드가 조금 잘려 보여야 한다
 *
 * 화면 끝에 딱 떨어지면 더 있다는 걸 알 수 없다. 카드 폭을 화면 폭에서 나누지 않고
 * 고정 폭 + `overflow-x` 로 두는 이유다(앱도 같은 이유로 0.3장을 남긴다).
 */
export function ScrollRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    // 소수점 오차가 있어서 1px 여유를 둔다. 안 두면 끝까지 밀어도 화살표가 남는다.
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;

    // 창 크기가 바뀌면 화살표가 필요한지도 달라진다(태블릿을 눕히는 경우).
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  const scrollBy = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    // 한 번에 화면 하나만큼 — 조금 덜 움직여서 어디까지 봤는지 알 수 있게 한다.
    el.scrollBy({
      left: direction * el.clientWidth * 0.85,
      behavior: "smooth",
    });
  };

  return (
    <div className="group/row relative">
      <div
        ref={ref}
        onScroll={update}
        className={cn(
          "flex gap-2.5 overflow-x-auto scroll-smooth pb-1 sm:gap-3",
          // 스크롤바를 숨긴다 — 카드가 잘려 보이는 것으로 이미 더 있다는 게 전달된다.
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
      >
        {children}
      </div>

      {/* 화살표는 마우스가 있는 기기에서만 의미가 있다.
          손가락으로는 그냥 밀면 되므로 touch 기기에서는 숨긴다. */}
      <Arrow side="left" hidden={atStart} onClick={() => scrollBy(-1)} />
      <Arrow side="right" hidden={atEnd} onClick={() => scrollBy(1)} />
    </div>
  );
}

function Arrow({
  side,
  hidden,
  onClick,
}: {
  side: "left" | "right";
  hidden: boolean;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={side === "left" ? "이전" : "다음"}
      onClick={onClick}
      // aria-hidden 이 아니라 실제로 숨긴다 — 끝에 닿았는데 눌리면 반응이 없어 고장처럼 보인다.
      hidden={hidden}
      className={cn(
        "absolute top-1/2 z-10 hidden -translate-y-1/2 touch:!hidden",
        "h-10 w-10 place-items-center rounded-full",
        "bg-black/70 text-white backdrop-blur transition",
        "hover:bg-black/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
        // 줄에 마우스를 올렸을 때만 보인다.
        "group-hover/row:grid",
        side === "left" ? "-left-2" : "-right-2",
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}
