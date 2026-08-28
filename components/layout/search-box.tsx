"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * 헤더 가운데의 검색창.
 *
 * `<form>` 으로 감싸는 이유: 모바일 키보드의 '검색' 키와 엔터가 그냥 동작하고,
 * 자바스크립트가 아직 안 돌아도 주소는 만들어진다.
 */
export function SearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
      }}
      className={cn("relative", className)}
    >
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="게임 및 카테고리 검색"
        aria-label="게임 검색"
        className={cn(
          "h-11 w-full rounded-full bg-surface pl-12 pr-4",
          "text-sm text-foreground placeholder:text-muted-foreground",
          "border border-border outline-none transition",
          "focus:border-primary focus:ring-1 focus:ring-primary",
        )}
      />
    </form>
  );
}
