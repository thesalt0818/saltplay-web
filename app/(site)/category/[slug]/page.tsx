import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameCard } from "@/components/game/game-card";
import { CATEGORIES, gamesInCategory, getGames } from "@/lib/games";
import { SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

/**
 * 카테고리 페이지. 홈에 다 실리지 않은 게임까지 크롤러가 찾아가는 통로다.
 *
 * 주소는 영어(`/category/puzzle`), 화면 글씨는 한국어로 나눈다 —
 * 주소는 검색엔진에 유리해야 하고 화면은 사람이 읽어야 하기 때문이다.
 */
export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return { title: "카테고리를 찾을 수 없습니다" };

  return {
    title: `${category.name} 게임`,
    description: `${SITE_NAME}의 ${category.name} 게임 모음. 설치 없이 브라우저에서 바로 플레이하세요.`,
    alternates: { canonical: `/category/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();

  const games = gamesInCategory(category, getGames("all"));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold sm:text-3xl">
        {category.name} 게임
      </h1>

      {games.length === 0 ? (
        <p className="text-muted-foreground">아직 이 분류의 게임이 없습니다.</p>
      ) : (
        <GameGrid>
          {games.map((game, index) => (
            <li key={game.id}>
              <GameCard game={game} priority={index < 12} className="w-full" />
            </li>
          ))}
        </GameGrid>
      )}
    </div>
  );
}

/**
 * 게임 격자.
 *
 * 칸 수를 화면 크기마다 정하지 않고 **칸 최소 폭**으로 정한다(`minmax`).
 * 그래야 폴드를 펼치거나 태블릿을 눕히는 것처럼 애매한 폭에서도 알아서 채워진다.
 * 200px 상한은 아이콘 원본 크기다 — 그보다 크게 그리면 흐려진다.
 */
export function GameGrid({ children }: { children: React.ReactNode }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:gap-4">
      {children}
    </ul>
  );
}
