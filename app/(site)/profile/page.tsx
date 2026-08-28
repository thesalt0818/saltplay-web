import type { Metadata } from "next";
import Link from "next/link";
import { asset } from "@/lib/site";

export const metadata: Metadata = {
  title: "프로필",
  robots: { index: false, follow: false },
};

/**
 * 프로필. 아직 자리만 잡아 둔 화면이다.
 * Supabase 의 `profiles` 테이블을 붙이는 작업에서 채운다.
 */
export default function ProfilePage() {
  return (
    <div className="py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset("/brand/mascot.png")}
        alt=""
        className="mx-auto h-24 w-24"
        loading="lazy"
        decoding="async"
      />
      <h1 className="mt-4 text-2xl font-bold">프로필</h1>
      <p className="mt-3 text-muted-foreground">
        로그인하면 즐겨찾기와 플레이 기록이 기기 사이에서 이어집니다.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/auth/login"
          className="rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground transition hover:brightness-110"
        >
          로그인
        </Link>
        <Link
          href="/auth/sign-up"
          className="rounded-full bg-surface-high px-6 py-2.5 font-bold transition hover:brightness-125"
        >
          회원가입
        </Link>
      </div>
    </div>
  );
}
