import { SiteHeader } from "@/components/layout/site-header";
import { SiteBottomBar, SiteRail } from "@/components/layout/site-nav";

/**
 * 게임 포털 화면의 껍데기 — 헤더 · 왼쪽 레일 · 하단 탭.
 *
 * `(site)` 처럼 괄호로 묶은 폴더는 **주소에 나타나지 않는다.**
 * `app/(site)/page.tsx` 는 `/` 이고 `app/(site)/game/x/page.tsx` 는 `/game/x` 다.
 * 로그인 화면(`app/auth/...`)은 이 껍데기를 쓰지 않아야 해서 이렇게 나눴다.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <div className="mx-auto flex max-w-screen-2xl">
        <SiteRail />

        {/* min-w-0 이 없으면 가로 스크롤 줄이 부모를 밀어내 화면 전체에
            가로 스크롤바가 생긴다. flex 자식의 기본 최소 폭이 내용 크기라서 그렇다. */}
        <main className="min-w-0 flex-1 px-3 pb-24 pt-4 sm:px-4 lg:pb-10">
          {children}
        </main>
      </div>

      <SiteBottomBar />
    </div>
  );
}
