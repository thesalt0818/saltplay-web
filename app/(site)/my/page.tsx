import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 게임",
  // 로그인한 사람만 의미가 있는 화면이라 검색엔진에 올리지 않는다.
  robots: { index: false, follow: false },
};

/**
 * 즐겨찾기·최근 플레이.
 *
 * 아직 자리만 잡아 둔 화면이다. 로그인(Supabase)과 `favorites` / `game_plays`
 * 테이블을 붙이는 작업에서 채운다.
 */
export default function MyGamesPage() {
  return (
    <div className="py-10 text-center">
      <h1 className="text-2xl font-bold">내 게임</h1>
      <p className="mt-3 text-muted-foreground">
        즐겨찾기와 최근에 플레이한 게임이 여기에 모입니다.
      </p>
      <Link
        href="/auth/login"
        className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground transition hover:brightness-110"
      >
        로그인
      </Link>
    </div>
  );
}
