import rawCatalog from "@/data/games.json";
import { createStaticClient } from "./supabase/static";
import { asset } from "./site";

/**
 * 게임 카탈로그.
 *
 * ## Supabase 를 먼저 보고, 안 되면 파일을 쓴다
 *
 * 앱이 원격 `games.json` 을 읽고 실패하면 내장 사본으로 되돌아가는 것과 같은 방식이다.
 *
 * 1. `NEXT_PUBLIC_SUPABASE_*` 가 있으면 `games` 테이블에서 읽는다
 * 2. 키가 없거나, 오류가 나거나, 결과가 비어 있으면 `data/games.json` 으로 되돌아간다
 *
 * **되돌아가는 길이 반드시 있어야 한다.** 무료 Supabase 프로젝트는 1주일 동안
 * 쓰지 않으면 일시정지되는데, 그 상태로 배포가 돌면 게임이 하나도 없는 사이트가
 * 올라간다. 빌드는 성공하고 사이트만 비는 종류의 사고다.
 *
 * ## 빌드할 때 한 번만 읽힌다
 *
 * 정적 배포라 이 목록은 빌드 시점에 HTML 로 굳는다. 게임을 추가하면 다시 배포해야
 * 사이트에 나온다(CLAUDE.md 9절).
 *
 * ## 화면 코드는 이 파일만 알면 된다
 *
 * 출처가 파일이든 DB 든 밖에서는 `Game` 타입만 보인다. 그러라고 나눠 놓았다.
 */

export type Audience = "all" | "adult";
export type Orientation = "portrait" | "landscape" | "sensor";

export type Game = {
  /** URL 슬러그로도 쓴다: /game/slotclicker */
  id: string;
  title: string;
  description: string;
  /** 게임이 실제로 올라가 있는 주소. 반드시 https. */
  url: string;
  orientation: Orientation;
  /** `gameicon/toyslot_icon` 같은 상대 경로, 또는 https 로 시작하는 절대 주소 */
  thumbnail: string | null;
  /** #RRGGBB. 썸네일이 없을 때의 대체 색이자 카드 강조색 */
  accent: string;
  tags: string[];
  audience: Audience;
  /** 캐시 무효화용 문자열 */
  version: string;
};

/* ────────────────────────────── 읽기 · 검증 ────────────────────────────── */

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * 태그는 배열과 쉼표 문자열을 둘 다 받는다.
 * 손으로 json 을 쓰다 보면 `"tags": "action, hot"` 처럼 적기 쉽기 때문이다.
 */
function parseTags(value: unknown): string[] {
  const pieces = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  const tags: string[] = [];
  for (const piece of pieces) {
    if (typeof piece !== "string") continue;
    const tag = piece.trim();
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

/**
 * 게임 한 건을 검사한다. 쓸 수 없으면 null.
 *
 * 앱의 `GameEntry.tryParse` 와 같은 규칙이다 — 두 곳의 판단이 달라지면 앱에는
 * 보이는데 웹에는 없는 게임이 생긴다.
 */
function parseGame(raw: unknown): Game | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;

  const id = str(item.id).trim();
  const url = str(item.url).trim();
  if (!id || !url) return null;

  // 평문 http 는 받지 않는다. 브라우저가 https 페이지 안에서 http iframe 을 막는다.
  if (!url.startsWith("https://")) return null;

  const thumbnail = str(item.thumbnail).trim();
  const title = str(item.title);
  const accent = str(item.accent);
  const orientation = str(item.orientation);

  return {
    id,
    url,
    title: title || id,
    description: str(item.description),
    orientation:
      orientation === "landscape" || orientation === "sensor"
        ? orientation
        : "portrait",
    thumbnail: thumbnail || null,
    accent: accent || "#3A6EA5",
    tags: parseTags(item.tags),
    // 'adult' 라고 정확히 적었을 때만 성인용으로 본다.
    // 오타 하나로 성인용이 전체이용가에 섞이는 쪽이 그 반대보다 위험하다.
    audience:
      str(item.audience).trim().toLowerCase() === "adult" ? "adult" : "all",
    version: str(item.version).trim(),
  };
}

/** 여러 건을 정리한다. 중복 id 는 처음 것만 남긴다. */
function parseList(list: unknown): Game[] {
  if (!Array.isArray(list)) return [];

  const seen = new Set<string>();
  const games: Game[] = [];

  for (const item of list) {
    const game = parseGame(item);
    if (!game) continue;
    if (seen.has(game.id)) continue;
    seen.add(game.id);
    games.push(game);
  }
  return games;
}

/** 앱에서 가져온 파일. Supabase 를 못 읽었을 때 쓰는 사본이다. */
function loadFromFile(): Game[] {
  return parseList((rawCatalog as { games?: unknown[] }).games);
}

/**
 * Supabase 의 `games` 테이블에서 읽는다. 못 읽으면 null.
 *
 * ⚠️ **`status = 'published'` 조건을 빼면 안 된다.** 초안으로 넣어 둔 게임이
 * 사이트에 올라가고 검색엔진에 잡히면 되돌리기 어렵다.
 * (DB 쪽 RLS 정책에도 같은 조건이 걸려 있지만, 한쪽만 믿지 않는다.)
 */
async function loadFromSupabase(): Promise<Game[] | null> {
  const supabase = createStaticClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) {
    // 빌드를 멈추지는 않는다. 대신 로그에 남겨서 왜 파일로 되돌아갔는지 알 수 있게 한다.
    console.warn(
      `[games] Supabase 를 읽지 못해 data/games.json 으로 되돌아갑니다: ${error.message}`,
    );
    return null;
  }

  const games = parseList(data);
  if (games.length === 0) {
    console.warn(
      "[games] Supabase 에서 공개된 게임을 찾지 못해 data/games.json 으로 되돌아갑니다.",
    );
    return null;
  }
  return games;
}

/**
 * 카탈로그를 한 번만 읽어 두고 재사용한다.
 *
 * 페이지마다 부르면 빌드 중에 DB 요청이 수십 번 나간다. 약속(Promise)을 저장하므로
 * 동시에 여러 번 불려도 요청은 한 번뿐이다.
 */
let catalogPromise: Promise<Game[]> | null = null;

function catalog(): Promise<Game[]> {
  catalogPromise ??= loadFromSupabase().then(
    (games) => games ?? loadFromFile(),
  );
  return catalogPromise;
}

/* ──────────────────────────────── 조회 ─────────────────────────────────── */

/**
 * 화면에 내보낼 게임 목록.
 *
 * ⚠️ **이용 등급을 거르는 자리는 여기 하나뿐이다.** 화면마다 따로 거르면 한 곳만
 * 빠뜨렸을 때 성인용이 전체이용가 화면에 섞인다.
 */
export async function getGames(audience: Audience = "all"): Promise<Game[]> {
  return (await catalog()).filter((game) => game.audience === audience);
}

export async function getGame(id: string): Promise<Game | undefined> {
  return (await catalog()).find((game) => game.id === id);
}

/** 정적 페이지를 미리 만들 주소 목록(`generateStaticParams` 용). */
export async function getAllGameIds(): Promise<string[]> {
  return (await catalog()).map((game) => game.id);
}

export function hasTag(game: Game, tag: string): boolean {
  const needle = tag.toLowerCase();
  return game.tags.some((t) => t.toLowerCase() === needle);
}

/** 검색이 훑는 대상. */
export function searchableText(game: Game): string {
  return `${game.title} ${game.description} ${game.tags.join(" ")}`.toLowerCase();
}

/* ──────────────────────────────── 주소 ─────────────────────────────────── */

/**
 * 카드에 그릴 아이콘 주소.
 *
 * @param long 세로형(2:3) 아이콘을 쓸지. 추천 띠에서만 true 다.
 *
 * json 에는 정사각 경로만 적혀 있고, 세로형은 거기에 `_long` 을 붙여서 찾는다.
 * 그래서 게임을 추가할 때 파일만 같이 올리면 되고 json 은 건드릴 필요가 없다.
 * (`_long` 파일이 없으면 이미지가 깨지므로 `GameThumbnail` 이 정사각으로 폴백한다.)
 */
export function iconUrl(game: Game, long = false): string | null {
  if (!game.thumbnail) return null;
  if (game.thumbnail.startsWith("https://")) return game.thumbnail;
  return asset(`/${game.thumbnail}${long ? "_long" : ""}.png`);
}

/**
 * 실제로 플레이어(iframe)에 물릴 주소.
 *
 * `version` 이 있으면 `?v=` 를 붙여 브라우저가 예전 파일을 물고 있지 않게 한다.
 * 게임을 새로 배포했는데 이걸 안 바꾸면 검은 화면이 된다.
 * `#` 프래그먼트가 있으면 쿼리는 그 **앞**에 들어가야 한다.
 */
export function playUrl(game: Game): string {
  if (!game.version) return game.url;

  const hashAt = game.url.indexOf("#");
  const base = hashAt >= 0 ? game.url.slice(0, hashAt) : game.url;
  const hash = hashAt >= 0 ? game.url.slice(hashAt) : "";
  const separator = base.includes("?") ? "&" : "?";

  return `${base}${separator}v=${encodeURIComponent(game.version)}${hash}`;
}

/* ────────────────────────────── 홈의 줄 구성 ───────────────────────────── */

export type RowStyle = "standard" | "featured";
export type RowMode = "tag" | "keyword" | "ids" | "all";

export type RowConfig = {
  title: string;
  mode: RowMode;
  /** 쉼표로 여러 개를 적으면 그중 하나라도 맞으면 들어온다. */
  query?: string;
  /** 0 이면 제한 없음. */
  maxCount?: number;
  style?: RowStyle;
  /**
   * 줄 제목을 눌렀을 때 갈 곳. 그 줄의 게임을 전부 볼 수 있는 페이지다.
   *
   * 이 링크가 SEO 에서 중요하다 — 홈에 다 못 실은 게임도 크롤러가 카테고리
   * 페이지를 통해 찾아갈 수 있어야 한다.
   */
  href?: string;
};

/**
 * 홈 화면의 줄 구성. 앱 `row_config.dart` 의 `defaultRows` 와 같다.
 *
 * 게임에 태그만 붙이면 해당 줄에 자동으로 들어오므로, 게임을 추가할 때 이 목록을
 * 고칠 일은 거의 없다.
 */
export const HOME_ROWS: RowConfig[] = [
  {
    title: "SaltPlay Originals",
    mode: "all",
    style: "featured",
    maxCount: 6,
  },
  {
    title: "지금 인기 있는 게임",
    mode: "tag",
    query: "hot",
    href: "/category/hot",
  },
  {
    title: "가볍게 즐기기",
    mode: "tag",
    query: "casual",
    href: "/category/casual",
  },
  {
    title: "느긋하게 키우기",
    mode: "tag",
    query: "idle, simulation",
    href: "/category/idle",
  },
  {
    title: "머리 쓰는 게임",
    mode: "tag",
    query: "puzzle",
    href: "/category/puzzle",
  },
  {
    title: "몸으로 하는 게임",
    mode: "tag",
    query: "action",
    href: "/category/action",
  },
  { title: "전체 게임", mode: "all" },
];

function splitQuery(query: string): string[] {
  return query
    .split(/[,\n]/)
    .map((piece) => piece.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * 줄 설정에 맞는 게임만 골라 낸다.
 *
 * 순수 함수다 — 어떤 게임이 왜 그 줄에 들어왔는지 이 함수 하나만 보면 된다.
 */
export function selectGames(row: RowConfig, games: Game[]): Game[] {
  const terms = splitQuery(row.query ?? "");
  let picked: Game[];

  switch (row.mode) {
    case "all":
      picked = [...games];
      break;

    case "ids": {
      // 적은 순서를 지키는 것이 이 모드의 존재 이유다.
      const byId = new Map(games.map((g) => [g.id.toLowerCase(), g]));
      picked = terms
        .map((term) => byId.get(term))
        .filter((g): g is Game => !!g);
      break;
    }

    case "keyword":
      picked = terms.length
        ? games.filter((g) => terms.some((t) => searchableText(g).includes(t)))
        : [];
      break;

    case "tag":
    default:
      picked = terms.length
        ? games.filter((g) => terms.some((t) => hasTag(g, t)))
        : [];
      break;
  }

  const max = row.maxCount ?? 0;
  return max > 0 ? picked.slice(0, max) : picked;
}

/* ──────────────────────────────── 카테고리 ─────────────────────────────── */

/**
 * 사이드바·검색에 쓰는 카테고리.
 *
 * 태그를 그대로 쓰지 않고 한국어 이름을 붙여 둔다 — 주소(`/category/puzzle`)는
 * 영어라야 검색엔진에 유리하고, 화면에는 한국어가 나와야 하기 때문이다.
 */
export const CATEGORIES = [
  { slug: "hot", name: "인기", tags: ["hot"] },
  { slug: "casual", name: "캐주얼", tags: ["casual"] },
  { slug: "idle", name: "방치형", tags: ["idle", "simulation"] },
  { slug: "puzzle", name: "퍼즐", tags: ["puzzle"] },
  { slug: "action", name: "액션", tags: ["action"] },
] as const;

export type Category = (typeof CATEGORIES)[number];

export function gamesInCategory(category: Category, games: Game[]): Game[] {
  return games.filter((game) => category.tags.some((tag) => hasTag(game, tag)));
}
