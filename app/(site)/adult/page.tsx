import type { Metadata } from "next";
import { AudienceSwitch } from "@/components/game/audience-switch";
import { ContinuePlaying } from "@/components/game/continue-playing";
import { HomeRows } from "@/components/game/home-rows";
import { getGames } from "@/lib/games";

export const metadata: Metadata = {
  title: "SaltPlay Adult",
  /**
   * 검색엔진에 올리지 않는다.
   *
   * `follow: false` 까지 준다 — 이 페이지에서 나가는 링크(성인용 게임 상세)도
   * 따라가지 말라는 뜻이다. index 만 막고 follow 를 열어 두면 크롤러가 링크를 타고
   * 성인용 게임 페이지로 넘어간다.
   *
   * sitemap.ts 에도 이 주소를 넣지 않는다.
   */
  robots: { index: false, follow: false },
};

/**
 * 성인용 홈.
 *
 * 전체이용가(`/`)와 **구성은 같고 목록만 다르다.** 줄 구성은 `HomeRows` 가,
 * 등급을 거르는 것은 `getGames(audience)` 가 한 곳에서 맡는다.
 *
 * ⚠️ 지금은 테스트 단계라 연령 확인이 없다. 실제로 공개하기 전에 반드시 붙여야 한다.
 */
export default async function AdultHomePage() {
  const games = await getGames("adult");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">SaltPlay Adult — 성인용 게임</h1>

      <AudienceSwitch current="adult" />
      <ContinuePlaying games={games} />
      <HomeRows audience="adult" />
    </div>
  );
}
