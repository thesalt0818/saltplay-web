/**
 * 최근에 플레이한 게임 기록.
 *
 * ## 왜 브라우저 저장소인가
 *
 * 사람마다 다른 목록인데 아직 로그인이 없다. 정적 사이트라 서버에 남길 곳도 없다.
 * 그래서 이 브라우저에만 남긴다. 로그인이 붙으면 Supabase 의 `game_plays` 테이블로
 * 옮기고, 로그인하지 않은 사람에게는 계속 이 방식을 쓰면 된다.
 *
 * ⚠️ **읽고 쓰는 모든 곳을 try/catch 로 감싼다.** 시크릿 모드나 사이트 데이터 차단
 * 설정에서는 `localStorage` 에 접근하는 것만으로 예외가 난다. 기록 하나 때문에
 * 화면이 통째로 죽으면 안 된다.
 */

const KEY = "saltplay:recent";

/** 너무 길게 들고 있을 이유가 없다. 줄에 담기는 수보다 넉넉하면 충분하다. */
const MAX = 12;

/**
 * 최근에 플레이한 게임 id 를 최신순으로 돌려준다.
 *
 * **서버에서는 늘 빈 배열이다.** 이 값으로 첫 화면을 그리면 서버가 만든 HTML 과
 * 브라우저가 그린 결과가 달라져 React 가 경고를 낸다. 반드시 화면이 뜬 뒤
 * (`useEffect`) 읽어야 한다.
 */
export function readRecent(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // 손으로 고쳤거나 예전 형식일 수 있으니 문자열만 남긴다.
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

/**
 * 게임 하나를 목록 맨 앞에 올린다. 이미 있으면 자리를 옮긴다.
 *
 * 게임을 **실제로 시작했을 때만** 부른다. 상세 페이지를 열기만 해도 기록하면
 * 잠깐 들렀다 나온 게임까지 '계속 플레이하기'에 쌓인다.
 */
export function pushRecent(gameId: string): void {
  if (typeof window === "undefined" || !gameId) return;

  try {
    const next = [gameId, ...readRecent().filter((id) => id !== gameId)].slice(
      0,
      MAX,
    );
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장할 수 없는 브라우저 — 기록만 못 남길 뿐 게임은 그대로 돌아간다 */
  }
}
