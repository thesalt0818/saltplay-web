import { AudienceSwitch } from "@/components/game/audience-switch";
import { HomeRows } from "@/components/game/home-rows";

/**
 * 홈 (전체이용가). 가로 스크롤 줄이 세로로 쌓인 화면.
 *
 * **서버 컴포넌트다.** 게임 목록과 링크가 빌드 시점에 HTML 로 완성되어야
 * 검색엔진이 게임 상세 페이지를 전부 찾아갈 수 있다.
 *
 * 성인용은 `/adult` 라는 별도 페이지다 — 자세한 이유는 `AudienceSwitch` 에.
 */
export default function HomePage() {
  return (
    <div className="flex flex-col gap-4">
      {/* 페이지에 h1 은 하나여야 한다. 화면에는 필요 없지만 검색엔진에는 필요해서
          읽어 주기만 하고 보이지는 않게 둔다. */}
      <h1 className="sr-only">
        SaltPlay — 설치 없이 바로 즐기는 무료 온라인 게임
      </h1>

      <AudienceSwitch current="all" />
      <HomeRows audience="all" />
    </div>
  );
}
