import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PRODUCTION_URL } from "./site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * 이 사이트의 바깥 주소를 만든다. 항상 `https://...` 로 시작하는 절대 주소다.
 *
 * ⚠️ `window.location.origin` 을 쓰면 안 된다.
 * 배포 주소가 https://thesalt0818.github.io/saltplay-web 인데 origin 은
 * https://thesalt0818.github.io 까지만 준다 — 저장소 이름(basePath)이 빠져서
 * 회원가입 확인 메일의 링크가 404 로 간다.
 *
 * 개발 중에는 `.env.local` 의 NEXT_PUBLIC_SITE_URL 이 이기고,
 * 그 값이 없으면 실제 배포 주소([PRODUCTION_URL])를 쓴다.
 *
 *   siteUrl("/game/toyslot/")  →  "https://thesalt0818.github.io/saltplay-web/game/toyslot/"
 */
export function siteUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_URL).replace(
    /\/$/,
    "",
  );

  return `${base}${path}`;
}
