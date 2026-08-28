import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameCard } from "@/components/game/game-card";
import { GamePlayer } from "@/components/game/game-player";
import { getAllGameIds, getGame, getGames, hasTag } from "@/lib/games";
import { SITE_NAME } from "@/lib/site";
import { siteUrl } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

/**
 * 빌드할 때 어떤 주소들을 미리 만들지 알려 준다.
 *
 * 정적 배포에는 서버가 없으므로 **여기 없는 게임은 페이지 자체가 존재하지 않는다.**
 * 게임을 추가하면 다시 빌드해야 하는 이유가 이것이다.
 */
export function generateStaticParams() {
  return getAllGameIds().map((slug) => ({ slug }));
}

/**
 * 검색 결과와 카카오톡·트위터 미리보기에 나가는 정보.
 *
 * **이 사이트에서 가장 중요한 함수다.** 여기가 비면 검색 결과에 사이트 이름만
 * 나오고 무슨 게임인지 알 수 없어 아무도 누르지 않는다.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);

  if (!game) return { title: "게임을 찾을 수 없습니다" };

  const description =
    game.description || `${game.title} — ${SITE_NAME}에서 무료로 플레이하세요.`;
  // ⚠️ 여기서는 asset() 을 쓰면 안 된다.
  //
  // metadataBase 에 이미 basePath(/saltplay-web)가 들어 있고, Next 는 여기 적은
  // 경로를 그 뒤에 이어 붙인다. asset() 이 접두사를 한 번 더 붙이면 주소가
  // .../saltplay-web/saltplay-web/... 이 되어 **미리보기 그림이 404** 가 된다.
  // 빌드도 배포도 멀쩡히 통과하고 카카오톡에 링크를 붙여 봐야 티가 나는 종류다.
  // siteUrl() 은 절대 주소를 만들므로 Next 가 손대지 않는다.
  const image = game.thumbnail ? siteUrl(`/${game.thumbnail}.png`) : undefined;

  return {
    title: game.title,
    description,
    alternates: { canonical: `/game/${game.id}` },
    openGraph: {
      type: "website",
      title: `${game.title} | ${SITE_NAME}`,
      description,
      url: siteUrl(`/game/${game.id}/`),
      images: image ? [{ url: image, width: 200, height: 200 }] : undefined,
    },
    // 성인용 게임은 검색엔진에 올리지 않는다.
    robots:
      game.audience === "adult" ? { index: false, follow: false } : undefined,
  };
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const game = getGame(slug);

  // 빌드 때 만들지 않은 주소로 들어온 경우. 정적 배포에서는 404.html 이 나간다.
  if (!game) notFound();

  // 바깥으로 나가는 주소는 절대 주소여야 한다(위 generateMetadata 의 경고 참고).
  const image = game.thumbnail ? siteUrl(`/${game.thumbnail}.png`) : undefined;

  // 같은 태그를 가진 다른 게임 — 시안 오른쪽의 '다음 게임 플레이' 자리다.
  const related = getGames(game.audience)
    .filter((other) => other.id !== game.id)
    .filter((other) => other.tags.some((tag) => hasTag(game, tag)))
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
      <div className="min-w-0 flex-1">
        <GamePlayer game={game} />

        <article className="mt-6">
          <h1 className="text-2xl font-bold sm:text-3xl">{game.title}</h1>

          {game.description && (
            <p className="mt-3 text-muted-foreground">{game.description}</p>
          )}

          {game.tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {game.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/category/${tag.toLowerCase()}`}
                    className="inline-block rounded-full bg-surface-high px-3 py-1 text-sm text-muted-foreground transition hover:text-foreground"
                  >
                    #{tag}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:max-w-sm">
            <dt className="text-muted-foreground">화면 방향</dt>
            <dd>{ORIENTATION_LABEL[game.orientation]}</dd>
            <dt className="text-muted-foreground">설치</dt>
            <dd>필요 없음 (브라우저에서 바로 실행)</dd>
          </dl>
        </article>

        {/* 검색엔진에게 "이건 게임 페이지"라고 알려 준다. 검색 결과에 별점·분류가
            함께 나올 수 있게 하는 표준 형식(schema.org)이다. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "VideoGame",
              name: game.title,
              description: game.description,
              url: siteUrl(`/game/${game.id}/`),
              // 구조화 데이터의 주소도 절대 주소여야 한다.
              image,
              genre: game.tags,
              gamePlatform: "Web browser",
              applicationCategory: "Game",
              operatingSystem: "Any",
              publisher: { "@type": "Organization", name: SITE_NAME },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "KRW",
              },
            }),
          }}
        />
      </div>

      {related.length > 0 && (
        <aside className="lg:w-64 lg:shrink-0">
          <h2 className="mb-3 text-lg font-bold">다음 게임 플레이</h2>
          <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
            {related.map((other) => (
              <li key={other.id}>
                <GameCard game={other} className="w-full" />
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}

const ORIENTATION_LABEL = {
  portrait: "세로",
  landscape: "가로",
  sensor: "기기에 맞춤",
} as const;
