import { createClient } from "@supabase/supabase-js";

/**
 * **빌드할 때만** 쓰는 Supabase 클라이언트.
 *
 * ## 브라우저용(`client.ts`)과 무엇이 다른가
 *
 * 이쪽은 로그인한 사람이 누구인지 전혀 신경 쓰지 않는다. 게임 목록처럼 **모두에게
 * 똑같은 공개 데이터**를 읽어 HTML 로 굳히는 것이 전부다. 그래서 쿠키도 세션도
 * 다루지 않는다(`persistSession: false`).
 *
 * 정적 배포라 이 코드는 GitHub Actions 안에서 딱 한 번 돌고, 결과는 HTML 에 남는다.
 * 사이트를 보는 사람의 브라우저는 이 클라이언트를 쓰지 않는다.
 *
 * ## 키가 없으면 null 을 돌려준다
 *
 * 예외를 던지지 않는다. 키가 없을 때는 `lib/games.ts` 가 `data/games.json` 으로
 * 되돌아가야 하기 때문이다. 여기서 죽으면 빌드가 통째로 실패한다.
 */
export function createStaticClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      // 빌드 서버에는 저장할 곳도, 세션을 이어 갈 이유도 없다.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
