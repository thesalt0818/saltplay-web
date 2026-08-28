# SaltPlay Web

HTML5 게임 포털 웹사이트. CrazyGames 형태.
**Flutter 안드로이드 앱(`D:\app_project\saltplay`)과 같은 브랜드·같은 백엔드를 쓰는 웹 버전이다.**

---

## 0. 나에 대해 — 작업할 때 꼭 지킬 것

이 프로젝트의 주인은 **웹 개발 초보**다. 아래는 협상 대상이 아니다.

1. **모든 설명은 한국어로.** 코드 식별자와 기술 용어는 원문 그대로 둔다.
2. **한 번에 한 가지 기능만.** 여러 화면을 한꺼번에 만들지 않는다.
   "헤더 + 목록 + 상세"가 아니라 "헤더" 하나만 끝내고 확인받는다.
3. **파일을 고치기 전에 무엇을 왜 바꾸는지 한두 줄로 먼저 설명한다.**
4. **새 라이브러리 추가는 반드시 먼저 물어본다.** `npm install` 을 마음대로 실행하지 않는다.
5. **작업이 끝나면 "브라우저에서 무엇을 확인하면 되는지"를 알려 준다.**
   예: `npm run dev` → `http://localhost:3000/game/slotclicker` 에서 제목이 나오는지,
   개발자도구 → Elements 에서 `<title>` 이 채워졌는지.

---

## 1. 최우선 원칙 (어길 수 없는 것)

### SEO 가 이 사이트의 생명이다

- **게임 상세 페이지는 반드시 서버에서 렌더링한다.** 클라이언트 전용 렌더링 금지.
  이 사이트는 정적 배포라 "서버 렌더링" = **빌드할 때 HTML 을 완성해 둔다**는 뜻이다(9절).
- `generateMetadata` 로 `title` / `description` / `openGraph` 를 채운다.
- 게임 목록·상세의 데이터 조회는 **서버 컴포넌트에서 빌드 시점에** 한다.
  `lib/supabase/client.ts` (브라우저용)는 로그인·즐겨찾기 토글처럼 **사용자 상호작용에만** 쓴다.
- `"use client"` 는 정말 필요한 잎사귀 컴포넌트에만 붙인다. 페이지 최상단에는 절대 붙이지 않는다.
- 게임이 추가·수정되면 `sitemap.ts` 와 `robots.ts` 에 자동으로 반영되게 만든다.

### 보안

- **`service_role`(secret) 키는 어떤 경우에도 클라이언트 코드에 넣지 않는다.**
  `NEXT_PUBLIC_` 접두사가 붙은 환경변수는 브라우저에 그대로 노출된다는 뜻이다.
  service_role 키에는 절대 `NEXT_PUBLIC_` 을 붙이지 않는다.
- **`.env.local` 은 절대 커밋하지 않는다.** (`.gitignore` 에 `.env*.local` 로 이미 들어가 있다.)
- 공개 데이터 보호는 Supabase **RLS(Row Level Security)** 로 한다.
  앱 코드의 조건절에만 의존하지 않는다.

---

## 2. 스택 (실제 설치된 버전)

| 항목 | 버전 / 값 |
|---|---|
| Next.js | **16.3.3** (App Router) |
| React | 19.2.8 |
| TypeScript | 5.x |
| Tailwind CSS | **v3.4** (`tailwind.config.ts` 사용. v4 아님) |
| Supabase | `@supabase/ssr` + `@supabase/supabase-js` |
| UI 프리미티브 | shadcn/ui (`components/ui/`) + Radix + lucide-react |
| 테마 | `next-themes` |

### Next 16 이라서 다른 점 — 실수하기 쉬움

1. **미들웨어를 쓰지 않는다.** Next 16 에서는 파일 이름이 `middleware.ts` 가 아니라
   루트의 `proxy.ts` 인데, 정적 배포라 어차피 동작하지 않으므로 **지웠다.**
   인터넷 예제에 미들웨어가 나오면 그 부분은 건너뛴다.
2. **`cacheComponents` 를 껐다.** 정적 내보내기와 함께 쓸 수 없다.
3. 환경변수 이름이 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 가 아니라
   **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** 다 (`.env.example` 참고).
4. `next dev` 를 돌리면 **이 파일(CLAUDE.md) 맨 끝에 Next.js 안내 블록이 자동으로
   덧붙는다.** 지워도 다시 생기므로 그대로 두고 함께 커밋한다.

### 해결된 SEO 지뢰 (기록용 — 되살리지 말 것)

스타터 킷의 `lib/supabase/proxy.ts` 는 **로그인하지 않은 방문자를 `/` 를 제외한 모든
경로에서 `/auth/login` 으로 리다이렉트했다.** 그대로 뒀다면 구글 크롤러가 게임 페이지에
들어와도 로그인 화면으로 튕겨 **단 한 페이지도 색인되지 않았을 것이다.**

정적 배포로 옮기면서 미들웨어를 통째로 지워 해결됐다. 로그인 여부에 따른 가림은
브라우저 쪽에서 한다. **어떤 이유로든 "로그인 안 하면 튕겨내는" 코드를 공개 경로에
다시 넣지 않는다.**

---

## 3. 브랜드 — 앱과 같아 보여야 한다

**색·아이콘 규칙의 원본은 Flutter 앱의 `lib/theme/app_theme.dart` 다.**
웹에서 색을 새로 고르지 말고 아래 값을 그대로 쓴다. 앱 쪽이 바뀌면 웹도 따라 바꾼다.

### 색

| 이름 | HEX | 쓰는 곳 |
|---|---|---|
| background | `#000000` | 화면 바닥 (순검정) |
| surface | `#1A1A26` | 카드·패널·검색창·상세 시트 바닥 |
| surfaceHigh | `#26263A` | 카드 위에 한 겹 더 (선택된 탭 알약, 태그 칩) |
| bottomBar | `#0E0E0E` | 하단 바 — 배경보다 **한 단계 밝게** |
| divider | `#1E1E2C` | 가는 구분선 |
| **primary** | `#0DD3DE` | 청록. 주요 버튼·강조 |
| **accent** | `#F79B4B` | 주황. 로고의 PLAY 와 같은 색 |
| adult | `#F84000` | 성인용 표시색 |
| hot | `#E8412E` | 'Hot' 배지 |
| top | `#F5C542` | 'Top' 배지 (글씨색 `#3A2A00`) |
| textPrimary | `#FFFFFF` | 본문 글씨 |
| textSecondary | `#9AA6C4` | 보조 글씨 |
| inputFill / inputText | `#CFD8E3` / `#2A3550` | 입력칸 바닥 / 글씨 |

**다크 전용 사이트다.** 라이트 테마를 만들지 않는다 — 게임 아이콘 아트가 알록달록해서
바탕이 밝으면 서로 싸운다. 배경을 색기 없는 중성 다크로 둔 것도 같은 이유다.
`next-themes` 의 `defaultTheme` 은 `"dark"` 로 고정하고 토글 UI 는 두지 않는다.

이 값들은 `app/globals.css` 의 CSS 변수와 `tailwind.config.ts` 에 반영해서
`bg-surface` / `text-primary` 처럼 **이름으로 쓴다.** 컴포넌트에 `#1A1A26` 을 직접 적지 않는다.

### 글꼴

**Pretendard** 하나만 쓴다 (앱과 동일). 한글 제목과 영문 라벨이 섞여 나오는 화면이라
두 언어의 글자 높이가 같은 글꼴이 필요하다.
`app/globals.css` 에서 CDN(jsdelivr) 동적 서브셋으로 불러온다 — 실제로 쓰는 글자만
내려받으므로 한글 글꼴치고 가볍다. Tailwind 의 `font-sans` 가 이미 이 글꼴이다.

### 게임 카드 — 앱의 `game_card.dart` 규칙 그대로

- **카드에 게임 이름 글씨를 얹지 않는다.** 아이콘 아트에 이름이 이미 그려져 있다.
- **모서리 반지름 = 카드 가로 × 0.075 (7.5%).**
  아이콘 아트에 라운드가 200px 폭 기준 15px 로 이미 구워져 있다. 이 비율을 벗어나면
  모서리에 계단이 지거나 그림자가 비어져 나온다. 고정 px 가 아니라 **비율**이다.
- 그림자와 클립은 반드시 같은 반지름을 쓴다.
- 상태 표시는 **왼쪽 위 배지 하나뿐**이다. `hot` 태그가 있으면 Hot, 없고 `top` 이면 Top.
  둘 다 있으면 Hot 이 이긴다. 배지는 카드 **안쪽**에 둔다.
- 누름 반응: 앱은 누르는 동안 `scale 0.94`. 웹에서는 hover 시 살짝 커지는(scale 1.03) 정도로
  대응한다. 반응이 없으면 클릭이 먹었는지 알 수 없다.

### 아이콘 두 벌 (중요)

게임 하나에 아이콘이 두 개 있다.

| 파일 | 크기 | 쓰는 곳 |
|---|---|---|
| `<이름>_icon.png` | 200×200 (1:1) | 일반 줄·검색·상세·최근 목록 |
| `<이름>_icon_long.png` | 200×300 (2:3) | 'SaltPlay Originals' 추천 띠 |

- DB/JSON 에는 **정사각 쪽 경로만 적는다.** 세로형은 거기에 `_long` 을 붙여서 찾는다.
- `_long` 이 없으면 정사각으로 폴백한다 (좌우가 잘린다).
- **원본 가로가 200px 이다.** 카드를 200px 보다 크게 그리면 확대되어 흐려진다.
  넓은 화면에서는 카드를 더 키우지 말고 **한 줄의 카드 장수를 늘린다.**

---

## 4. 화면 구성 — 앱 → 웹 매핑

앱은 하단 4탭이다. 웹은 URL 이 있으므로 아래처럼 옮긴다.

| 앱 | 웹 경로 | 렌더링 |
|---|---|---|
| Home 탭 (가로 스크롤 줄들) | `/` | 서버 |
| Search 탭 (격자) | `/search?q=` | 서버 |
| — (앱엔 없음) | `/category/[slug]` | 서버 · **SEO 핵심** |
| 상세 시트 → WebView 실행 | `/game/[slug]` | **서버 · SEO 최우선** |
| My games 탭 (최근·즐겨찾기) | `/my` | 로그인 필요 |
| Profile 탭 | `/profile` | 로그인 필요 |

### 홈 화면의 "줄(row)" 개념

앱의 홈은 **가로 스크롤 줄이 세로로 쌓인 구조**다. 줄마다 태그로 게임을 골라 온다.
웹도 같은 구조로 만든다. 앱의 기본 줄 구성(`lib/models/row_config.dart` 의 `defaultRows`):

1. `SaltPlay Originals` — 추천 띠. 세로형 아이콘(2:3), 큰 카드, 배경 그림 위. 최대 6개
2. `지금 인기 있는 게임` — 태그 `hot`
3. `가볍게 즐기기` — 태그 `casual`
4. `느긋하게 키우기` — 태그 `idle, simulation`
5. `머리 쓰는 게임` — 태그 `puzzle`
6. `몸으로 하는 게임` — 태그 `action`
7. `전체 게임` — 전부

### 이용 등급(Audience) — 전체이용가 / 성인용

앱 홈 맨 위의 **두 로고가 등급 스위치**다 (탭이 아니다). 게임에 `audience: "adult"` 가
적힌 것만 성인용이고, **안 적으면 전체이용가**다.

**거르는 자리는 `getGames(audience)` 한 곳뿐이다.** 페이지마다 따로 거르면 한 곳만
빠뜨렸을 때 성인용이 전체이용가 화면에 섞인다.

### 웹에서는 등급이 곧 주소다 (중요)

`/` = 전체이용가, **`/adult` = 성인용.** 화면 상태로 목록만 갈아 끼우지 않는다 —
그러면 **성인용 게임이 전체이용가 페이지의 HTML 에도 들어가고**, 정적 사이트라
그 HTML 이 그대로 검색엔진에 올라간다.

- `/adult` 는 `robots: { index: false, follow: false }` 다.
  `follow` 까지 막는 이유는 크롤러가 링크를 타고 성인용 게임 상세로 넘어가는 것을
  막기 위해서다.
- `sitemap.ts` 에 `/adult` 와 성인용 게임을 넣지 않는다.
- 성인용에서는 줄의 '더 보기'를 걸지 않는다. 카테고리 페이지는 전체이용가만
  보여 주므로, 누르는 순간 다른 등급의 목록이 나와 버린다.

스위치 구현은 `components/game/audience-switch.tsx`. **고르지 않은 쪽을 흑백으로
만들지 않는다** — 채도를 빼면 성인용의 주황이 사라져 두 쪽이 똑같은 회색이 된다.
밝기만 0.78 배로 낮춘다(글씨는 색 토큰, 그림은 `brightness(0.78)`).
한쪽만 바꾸면 글씨와 그림의 어두운 정도가 어긋난다.

⚠️ **연령 확인이 없다.** 테스트 단계라 그냥 눌러서 바뀐다. 실제로 공개하기 전에
반드시 붙여야 한다.

### 왼쪽 사이드바 (PC · `lg` 이상)

접혀 있을 때 64px, **마우스를 올리면 224px 로 펼쳐지며 이름이 나온다.**
아이콘만 있으면 무슨 메뉴인지 알 수 없고, 늘 펼쳐 두면 게임이 놓일 가로 자리를
224px 씩 잡아먹기 때문이다. 폰에서는 이 레일이 사라지고 하단 4탭이 대신한다.

- **펼쳐질 때 내용이 밀리지 않는다.** 바깥 `<div>` 는 자리만 잡는 빈 칸(64px)이고,
  실제 메뉴는 그 안에서 `absolute` 로 떠서 넓어진다. 밀리게 만들면 마우스를 스칠
  때마다 화면 전체가 출렁인다.
- ⚠️ **`z-30` 은 바깥 칸에 걸어야 한다.** `position: sticky` 는 그 자체로 쌓임
  맥락을 만들기 때문에, 안쪽 메뉴에만 z-index 를 주면 그 값이 칸 안에서만 통하고
  **게임 카드가 펼친 메뉴 위로 덮인다.** 실제로 그렇게 만들었다가 고쳤다.
- 이름은 접혔을 때도 지우지 않고 **투명하게만** 만든다. `hidden` 으로 지우면 화면
  낭독기도 못 읽어서 아이콘만 남는다.
- `hover` 뿐 아니라 `focus-within` 으로도 펼친다. Tab 키로 이동하는 사람에게 이름이
  안 보이면 어디로 가는 링크인지 알 수 없다.
- ⚠️ **메뉴를 누르면 접어야 한다.** 누른 링크에는 포커스가 남고, 그러면 위의
  `focus-within` 이 그 포커스를 붙잡아 **마우스를 치워도 메뉴가 계속 펼쳐져 있다.**
  그래서 클릭할 때 `blur()` 로 포커스를 놓고 `dismissed` 로 접는다.
  `dismissed` 는 마우스가 레일을 벗어날 때 풀린다 — 안 풀면 한 번 누른 뒤로 다시는
  펼쳐지지 않는다. Tab 이동은 click 이 아니라서 걸리지 않는다.

### '계속 플레이하기' 줄

홈 맨 위, 추천 띠보다 앞에 온다. 카드는 다른 줄보다 **한 단계 작다**
(`72/86/96` vs `96/120/140`) — 이미 아는 게임을 다시 찾는 줄이라 크게 보일 이유가 없다.

기록은 **브라우저 저장소(`localStorage`)** 에 남는다(`lib/recent.ts`).
로그인이 없고 정적 사이트라 서버에 남길 곳이 없기 때문이다. 로그인이 붙으면
Supabase 의 `game_plays` 로 옮기고, 로그인하지 않은 사람에게는 이 방식을 계속 쓴다.

- **게임을 실제로 시작했을 때만** 기록한다(`GamePlayer` 의 '플레이' 버튼).
  상세 페이지를 열기만 해도 기록하면 잠깐 들렀다 나온 게임까지 쌓인다.
- `localStorage` 접근은 **반드시 try/catch** 로 감싼다. 시크릿 모드나 사이트 데이터
  차단 설정에서는 읽는 것만으로 예외가 난다. 기록 하나 때문에 화면이 죽으면 안 된다.
- 서버에서는 늘 빈 목록이다. 화면이 뜬 뒤(`useEffect`)에 읽어야 서버가 만든 HTML 과
  어긋나지 않는다.
- **등급은 여기서 거르지 않는다.** 페이지가 이미 걸러 준 목록과 짝을 맞추는 방식이라
  성인용 기록은 전체이용가 홈에서 저절로 빠진다. 거르는 자리가 둘이 되면 한쪽만
  고치는 실수가 난다.
- 기록이 없으면 줄 자체를 그리지 않는다.

### 로그인 · 가입 패널

헤더의 '로그인'을 누르면 **오른쪽에서 밀려나오는 서랍**이 열린다
(`components/auth/auth-panel.tsx`). 별도 페이지로 옮기지 않는 이유는, 게임을 보다가
로그인하면 돌아왔을 때 보던 자리를 잃기 때문이다. 빈 곳을 누르거나 Esc 로 닫는다.

세 단계다: `이메일` → `비밀번호(로그인)` → `가입`.

⚠️ **"이 이메일이 가입돼 있는지"를 미리 묻지 않는다.** Supabase 의 공개 키로는
조회할 수 없고, 할 수 있다 해도 아무나 이메일을 넣어 보며 가입자 목록을 알아낼 수
있어(계정 열거) 열어 주면 안 되는 기능이다. 대신 로그인을 시도하고 실패하면
'이 이메일로 가입하기'를 권한다 — 쓰는 사람이 느끼는 흐름은 같으면서 계정 존재
여부가 새지 않는다.

⚠️ **패널은 `createPortal` 로 `document.body` 에 직접 그린다.**
여는 버튼이 헤더 안에 있는데 헤더에는 `backdrop-blur` 가 걸려 있다.
**`backdrop-filter` 가 있는 요소는 그 안의 `position: fixed` 자식에게 화면이 아니라
자기 자신을 기준으로 만든다**(containing block). 포털 없이 두면 `fixed inset-0` 이
헤더 높이(55px)에 갇혀서 입력칸만 헤더에 삐져나온다 — 실제로 겪고 고쳤다.
`transform` · `filter` · `perspective` 도 같은 일을 한다.

소셜 로그인(Google/Facebook/Apple)은 **Supabase 대시보드에서 켜야 동작한다.**
켜지 않은 상태로 누르면 그 안내가 오류로 나온다.

### 게임 실행

앱은 WebView 로 열지만 **웹은 `<iframe>` 으로 연다.** 게임은 전부 외부(GitHub Pages)에
따로 배포된 HTML5 빌드다. 이 사이트는 목록·상세·실행 껍데기다.

- `orientation` 값(`portrait` / `landscape` / `sensor`)에 맞춰 iframe 비율을 잡는다.
- iframe 에 `allow="autoplay; fullscreen"` 이 필요하다 — 없으면 게임 소리가 안 난다.

### 시작 방식

어느 기기에서든 표지의 '플레이'를 눌러야 시작한다. 그 뒤가 다르다.

- **PC**: 플레이어 안에서 그대로 실행된다. 창이 이미 넓다.
- **폰**: 누르는 그 순간 **전체화면으로 들어간다.**

⚠️ **그 버튼을 없앨 수 없다.** 브라우저는 사용자가 직접 누르지 않으면 전체화면을
허용하지 않는다(보안 정책). 자동으로 부르면 **조용히 거부당한다.**
`enterFullscreen()` 을 나중으로 미루거나 `await` 뒤에서 부르면 '사용자가 누른 것'으로
쳐 주지 않아 실패한다. 반드시 누른 그 자리에서 부른다.

기기 판단은 **화면 폭이 아니라 입력 방식**(`pointer: coarse`)으로 한다.
태블릿을 눕히면 1280px 이 되어 폭으로는 PC 로 오인된다.

### 전체화면은 두 가지 방법을 함께 쓴다

⚠️ **브라우저의 전체화면 기능만 믿으면 안 된다.**
**iOS 사파리는 일반 요소의 전체화면을 아예 지원하지 않는다**(영상만 된다).
그래서 요청이 조용히 실패하고 작은 화면 그대로 남는다 — 실제로 겪은 증상이다.

그래서 `enterFullscreen()` 은 **먼저 우리 방식(`immersive`)을 켜고** 그다음에
브라우저 전체화면을 시도한다. `immersive` 는 플레이어를 `fixed inset-0 z-[60]` 으로
만들어 화면을 덮는 것이라 어느 기기에서든 통한다. 브라우저 전체화면이 성공하면
그 위에 얹히므로 어색해지지 않는다.

- `immersive` 동안 `body` 스크롤을 잠근다. 안 잠그면 게임 뒤에서 페이지가 움직인다.
- 브라우저 전체화면은 Esc 가 기본이지만 **우리 방식은 직접 처리해야 한다.**
- `z-[60]` 은 헤더(z-40)·사이드바(z-30)보다 위여야 한다. 낮으면 게임 위로 헤더가 뜬다.

### 회전 잠금도 두 겹이다

게임의 `orientation` 이 `portrait` 인데 자동 회전이 켜진 폰을 눕히면 게임까지 누워
버린다. 이걸 두 가지로 막는다.

1. **`screen.orientation.lock()`** — 되면 이게 가장 깔끔하다.
   ⚠️ **브라우저 전체화면이 성공했을 때만 동작한다.** iOS 는 그 전체화면 자체가
   없으니 잠금도 걸리지 않는다.
2. **화면을 90° 돌려서 그린다**(`rotated`) — 막을 수 없으면 거꾸로 돌려서 되돌린다.
   화면이 가로가 됐는데 게임이 세로여야 하면 게임을 90° 돌려 그린다. 사용자가 폰을
   돌린 만큼 화면 안에서 되돌아가므로 눈에는 그대로 세로로 보인다.

돌릴 때는 가로세로를 뒤바꾼 상자를 왼쪽 위 기준으로 돌리고 `left: 100dvw` 에서
시작하게 둔다. 그래야 화면에 딱 떨어진다(브라우저에서 재서 확인했다).

⚠️ **조건을 좁게 건다.**
- **전체화면일 때만.** 평소 페이지에서 돌리면 글이 다 누워 버린다.
- **손가락 기기에서만.** PC 창은 대부분 가로라, 세로 게임을 열 때마다 화면 전체가
  돌아가 버린다.

### 플레이어 조작 줄

추천 · 비추천 · 음소거, 그리고 **폰에서만** 전체화면(`lg:hidden`). PC 는 창이 이미
크고 Esc 로 빠져나올 수도 있어서 전체화면 버튼을 두지 않는다.

- **추천·비추천은 아직 모양만 있다.** 누가 무엇을 눌렀는지 기억할 곳(Supabase)이
  없기 때문이다. ⚠️ **옆에 숫자를 지어내 붙이지 않는다.** 없는 값을 그럴듯하게
  보여 주면 나중에 진짜 숫자가 붙었을 때 아무도 그 숫자를 믿지 않는다.
- **전체화면 위의 버튼은 플레이어 상자 안에 둔다** (`작게 보기` · `게임 종료`).
  전체화면일 때는 그 상자만
  화면에 보이므로 아래 조작 줄에 두면 나가는 방법이 사라진다. **폰에는 Esc 키가
  없어서 이 버튼이 유일한 출구다.**
- 전체화면 상태는 `fullscreenchange` 를 구독해서 따라간다. Esc 나 기기 버튼으로
  빠져나가도 버튼 표시가 실제 상태와 어긋나지 않아야 한다.

### 음소거는 절반만 우리 손에 있다

iframe 안은 남의 페이지라 마음대로 만질 수 없다. 두 가지를 함께 시도한다.

1. **같은 출처면 직접 끈다** — 안의 `<audio>`/`<video>` 를 만진다.
   배포 주소(`thesalt0818.github.io/saltplay-web`)와 게임 주소
   (`thesalt0818.github.io/...`)는 **같은 출처라 이게 동작한다.**
   ⚠️ 단, 개발 중(`localhost`)에는 다른 출처라 이 경로가 막힌다 — 로컬에서 음소거가
   안 되는 것은 고장이 아니다. 그리고 `thesalt0225.github.io` 에 있는 게임처럼
   계정이 다른 것도 막힌다.
2. **게임에 메시지를 보낸다** — Cocos 는 소리를 Web Audio 로 내는데 그건 밖에서 끌
   방법이 아예 없다. 게임 쪽이 받아서 스스로 꺼 줘야 한다.

**게임 프로젝트(Cocos)에 이 코드를 넣으면 음소거가 완전히 동작한다:**

```js
// 게임의 시작 스크립트에 한 번만 넣는다.
window.addEventListener("message", (event) => {
  // 우리 사이트에서 온 것만 받는다.
  if (event.origin !== "https://thesalt0818.github.io") return;
  if (event.data?.type !== "saltplay:mute") return;

  // Cocos Creator 2.x
  cc.audioEngine.setVolume?.(event.data.muted ? 0 : 1);
  // Cocos Creator 3.x 라면 AudioSource 의 volume 을 바꾸거나 mute 플래그를 쓴다.
});
```

이 코드를 넣기 전까지는 음소거가 **게임에 따라 듣지 않을 수 있다.**

---

## 5. 데이터 구조

### 데이터는 "Supabase 먼저, 안 되면 파일"

출입구는 **`lib/games.ts`** 한 곳이다. 화면 코드는 `Game` 타입만 알면 되고
출처가 어디인지 신경 쓰지 않는다.

1. `NEXT_PUBLIC_SUPABASE_*` 가 있으면 `games` 테이블에서 읽는다
   (`lib/supabase/static.ts` — 쿠키를 쓰지 않는 빌드 전용 클라이언트)
2. 키가 없거나 · 오류가 나거나 · 결과가 비어 있으면 **`data/games.json`** 으로 되돌아간다

앱이 원격 `games.json` 을 읽고 실패하면 내장 사본을 쓰는 것과 같은 방식이다.

⚠️ **되돌아가는 길을 없애지 말 것.** 무료 Supabase 프로젝트는 1주일 동안 쓰지 않으면
일시정지된다. 그 상태로 배포가 돌면 **빌드는 성공하는데 게임이 하나도 없는 사이트**가
올라간다. 폴백이 그걸 막는다. 어느 쪽을 썼는지는 빌드 로그의 `[games]` 줄에 남는다.

⚠️ **사본이 셋이다.** `data/games.json` · 앱의 `assets/data/games.json` · Supabase.
한쪽을 고치면 나머지도 맞춰야 앱과 웹의 목록이 어긋나지 않는다.

**조회 함수는 전부 비동기다** (`await getGames()` / `await getGame()`).
브라우저에서 도는 컴포넌트는 DB 에 접근할 수 없으므로, 서버 컴포넌트가 목록을
읽어 `props` 로 내려 준다 (`search/page.tsx` → `SearchResults` 가 그 예다).

### 테이블 만들기

**`supabase/schema.sql`** 을 Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
테이블 · RLS 정책 · 초기 데이터가 한 번에 들어간다. 여러 번 실행해도 안전하다.

### Supabase 테이블

| 테이블 | 내용 |
|---|---|
| `categories` | 카테고리 (슬러그·이름) |
| `games` | 게임 본체. **`status` 가 `published` 인 것만 공개된다** |
| `game_categories` | 게임 ↔ 카테고리 N:M |
| `profiles` | 사용자 프로필 (auth.users 확장) |
| `favorites` | 즐겨찾기 |
| `game_plays` | 플레이 기록 (앱의 '최근 목록'에 해당) |
| `ad_revenues` | 광고 수익 |

**모든 공개 조회에서 `status = 'published'` 조건을 빼먹지 않는다.** 초안 게임이 검색엔진에
잡히면 되돌리기 어렵다. 가능하면 RLS 정책과 뷰로 DB 단에서 막는다.

### 게임 한 건의 필드 (앱 `GameEntry` 기준 — 웹도 같은 개념을 쓴다)

| 필드 | 뜻 · 규칙 |
|---|---|
| `id` | 고유 식별자. URL 슬러그로 쓴다 (`/game/slotclicker`) |
| `title` | 표시 이름 (예: "Toy Slots") |
| `description` | 한 줄 설명. **`generateMetadata` 의 description 원본** |
| `url` | 게임 주소. **반드시 `https://`** (앱이 평문 http 를 차단한다) |
| `orientation` | `portrait` / `landscape` / `sensor` |
| `thumbnail` | `gameicon/toyslot_icon` 같은 상대 경로 또는 `https://` 절대 주소 |
| `accent` | `#RRGGBB`. 썸네일이 없을 때의 대체 색이자 카드 강조색 |
| `tags` | 줄·카테고리를 고르는 꼬리표 (`hot`, `top`, `casual`, `idle`, `puzzle`, `action`, `simulation`) |
| `audience` | `all`(기본) 또는 `adult` |
| `version` | 캐시 무효화용 문자열. 있으면 실행 주소에 `?v=` 로 붙인다 |

**`version` 을 꼭 이해할 것.** 게임을 새로 배포했는데 브라우저가 예전 파일을 물고 있으면
검은 화면이 된다. URL 자체를 다르게 만드는 것이 확실한 방법이다.
`#` 프래그먼트가 있으면 쿼리는 그 **앞**에 들어가야 한다.

### 앱은 아직 Supabase 를 쓰지 않는다 (현재 상태)

Flutter 앱은 지금 원격 `games.json` 을 읽는다.
`https://thesalt0818.github.io/saltplay/games.json` (실패하면 앱 내장 사본으로 폴백)

즉 **"같은 Supabase 백엔드"는 목표이지 현재 상태가 아니다.** 웹이 먼저 Supabase 로 가고
앱은 나중에 옮겨 온다. 그때까지는 두 카탈로그의 내용이 어긋나지 않는지 사람이 챙겨야 한다.
웹의 스키마를 짤 때 위 `GameEntry` 필드를 그대로 담을 수 있게 만들어 두면 이관이 쉬워진다.
앱에는 아직 **인증도 없다** (로그인 버튼이 그냥 홈으로 들어간다).

---

## 6. 반응형 — PC·모바일 하나로

**별도 모바일 사이트를 만들지 않는다.** 하나의 반응형 레이아웃으로 전부 대응한다.

### 브레이크포인트 (Tailwind 기본값을 쓴다)

| 이름 | 폭 | 대상 |
|---|---|---|
| (기본) | ~639px | 폰. **최소 지원 폭 320px** (갤럭시 폴드 접힘 344px 포함) |
| `sm` | 640px~ | 큰 폰 가로 |
| `md` | 768px~ | 태블릿 세로, 폴드 펼침(약 673~816px) |
| `lg` | 1024px~ | 태블릿 가로 · 작은 노트북 |
| `xl` | 1280px~ | 데스크톱 |
| `2xl` | 1536px~ | 큰 모니터 |

- 내용 최대 폭을 정해 가운데로 모은다 (예: `max-w-screen-2xl mx-auto`).
  **가로로 무한정 늘어나면 카드가 잘디잘게 깔려 아이콘을 알아볼 수 없다.**
- 게임 격자는 폭을 고정하지 말고 `grid-cols-*` 를 단계별로 늘린다.
  카드 한 장이 **200px 를 넘지 않게** 한다 (아이콘 원본 크기, 3절 참고).
- 가로 스크롤 줄은 **다음 카드가 조금 잘려 보이게** 만든다. 화면 끝에 딱 떨어지면
  스크롤이 되는지 알 수 없다. (앱은 보통 줄 0.3장, 추천 띠 0.55장을 남긴다.)

### 화면 회전 대응

- **`100vh` 를 쓰지 않는다. `100dvh` 를 쓴다.** 모바일 주소창이 접히고 펴질 때
  `100vh` 는 화면 밖으로 삐져나간다.
- 가로로 눕혔을 때 세로 자리가 좁아지는 것을 따로 처리한다:
  `@media (orientation: landscape) and (max-height: 500px)` 에서 헤더를 낮추거나 숨긴다.
- **폭이 아니라 "짧은 변"으로 판단해야 하는 자리가 있다.**
  800px 태블릿을 눕히면 1280px 가 되어 데스크톱으로 오인된다.
  기기 종류를 알아야 하는 곳(터치 UI 여부 등)은 `(pointer: coarse)` 로 판단한다.
- 게임 실행 화면은 회전할 때 iframe 이 다시 로드되지 않게 주의한다 (진행 상황이 날아간다).
- `viewport` 에 `maximum-scale=1` / `user-scalable=no` 를 넣지 않는다 — 접근성 위반이다.

### 확인해야 할 대표 해상도

`320`(최소) · `344`(폴드 접힘) · `390`(iPhone) · `673`/`816`(폴드 펼침) ·
`768`(iPad 세로) · `1024`(iPad 가로) · `1440`(노트북) · `1920`

---

## 7. 지금 프로젝트 상태

CrazyGames 형태의 포털이 동작한다. 홈 · 게임 상세(전용 플레이어) · 카테고리 · 검색이
있고 GitHub Actions 로 배포된다. **스타터 데모는 전부 지웠다.**

```
app/
  layout.tsx            ← Pretendard · 다크 고정 · lang="ko" · 메타데이터
  globals.css           ← 브랜드 색 변수 + .rounded-icon 유틸리티
  sitemap.ts robots.ts  ← 빌드 때 /sitemap.xml, /robots.txt 로 만들어진다
  (site)/               ← 포털 화면. 괄호 폴더라 주소에는 안 나온다
    layout.tsx          ← 헤더 + 왼쪽 레일 + 하단 탭
    page.tsx            ← 홈 (가로 스크롤 줄)
    game/[slug]/page.tsx      ← 게임 상세 · SEO 최우선
    category/[slug]/page.tsx  ← 카테고리
    search/page.tsx     ← 검색 (브라우저에서 거른다)
    my/ profile/        ← 자리만 잡아 둔 화면
  auth/                 ← 로그인·회원가입 (껍데기 없이 단독 화면)
components/
  game/
    game-card.tsx       ← 카드 (글씨 없음 · 7.5% 라운드 · 배지 하나)
    game-thumbnail.tsx  ← 아이콘. _long 없으면 정사각으로 폴백 (클라이언트)
    game-row.tsx        ← 홈의 줄 하나
    scroll-row.tsx      ← 가로 스크롤 + 화살표 (클라이언트)
    game-player.tsx     ← 게임 실행 iframe · 전체화면 · 회전 (클라이언트)
  layout/
    site-header.tsx  search-box.tsx  site-nav.tsx
  auth-button.tsx       ← 로그인 상태 헤더 버튼 (브라우저 판단)
  ui/                   ← shadcn/ui 프리미티브
lib/
  games.ts              ← 게임 데이터의 유일한 출입구 (타입·검증·줄 구성·주소)
  site.ts               ← BASE_PATH · PRODUCTION_URL · asset()
  supabase/client.ts    ← 브라우저용. 로그인·즐겨찾기는 전부 이쪽
  utils.ts              ← cn(), hasEnvVars, siteUrl()
data/games.json         ← 지금의 게임 목록 (앱에서 복사)
public/
  .nojekyll             ← 없으면 GitHub Pages 가 _next/ 를 무시해 CSS·JS 가 전부 404
  gameicon/ gameicon_adult/ brand/ ui/   ← 앱에서 가져온 그림
.github/workflows/deploy.yml   ← GitHub Pages 자동 배포
```

**삭제한 파일** (정적 호스팅에서 동작 자체가 불가능해서 지웠다. 되살리지 말 것):
`proxy.ts` · `lib/supabase/proxy.ts` · `lib/supabase/server.ts` ·
`app/auth/confirm/route.ts` · `app/protected/`

### 그림 규칙

`public/` 안의 그림은 **반드시 `asset()` 을 거쳐** 주소를 만든다.
`<img src="/brand/logo.png">` 처럼 직접 적으면 basePath 가 빠져 404 가 난다.

| 경로 | 내용 |
|---|---|
| `public/gameicon/<이름>_icon.png` | 정사각 200×200 |
| `public/gameicon/<이름>_icon_long.png` | 세로형 200×300 (추천 띠 전용) |
| `public/brand/logo.png` | 헤더 로고 (소금통+조이스틱) |
| `public/brand/mascot.png` | 마스코트. 등급 스위치·프로필 |
| `public/ui/featured-bg.png` | 추천 띠 배경 |

### 색을 쓰는 법

```
bg-background   검정 바탕      bg-surface       카드 바닥 #1A1A26
bg-primary      청록 #0DD3DE   bg-surface-high  한 겹 위 #26263A
bg-accent       주황 #F79B4B   bg-bottombar     하단 바 #0E0E0E
bg-hot / bg-top 배지            text-muted-foreground  보조 글씨 #9AA6C4
rounded-icon    정사각 카드 모서리(7.5%)   rounded-icon-long  세로형 카드용
max-w-icon      200px (아이콘 원본 크기 상한)
landscape-short: 눕힌 폰       touch:  손가락 조작 기기
```

### 명령어

```bash
npm run dev     # 개발 서버 → http://localhost:3000/saltplay-web
npm run build   # 정적 빌드 → out/ 폴더 생성. SEO 실수는 대부분 여기서 잡힌다
npm run lint
```

⚠️ **개발 주소에도 `/saltplay-web` 이 붙는다.** `basePath` 때문이다.
`http://localhost:3000` 만 치면 404 가 난다.

`.env.local` 을 `.env.example` 을 보고 만들어야 실행된다.

### 빌드 결과를 읽는 법

`npm run build` 가 찍는 표에서 모든 경로가 **`○ (Static)`** 이어야 한다.
`ƒ (Dynamic)` 이나 `◐ (Partial Prerender)` 가 하나라도 있으면 **GitHub Pages 에서 동작하지
않는다.** 원인은 대부분 서버에서 `searchParams` · `cookies()` 를 읽는 코드다 →
브라우저에서 `useSearchParams` 로 읽고 `<Suspense>` 로 감싸면 해결된다.

---

## 8. 앞으로 할 일 (순서대로, 하나씩)

- [x] **브랜드 토큰 심기** — `globals.css` 색 변수 + `tailwind.config.ts` + Pretendard + 다크 고정
- [x] **정적 배포로 전환** — `output: "export"`, `basePath: "/saltplay-web"`, 미들웨어 삭제,
      인증을 전부 브라우저 쪽으로
- [x] 앱 리소스 복사 + 데이터 계층(`lib/games.ts`, `data/games.json`)
- [x] `GameCard` · `GameRow` · 헤더 · 레일/하단탭
- [x] 홈 `/` — 가로 스크롤 줄 구조
- [x] `/game/[slug]` — `generateStaticParams` + `generateMetadata` + 전용 플레이어
- [x] `/category/[slug]`, `/search`
- [x] `sitemap.ts` / `robots.ts` / JSON-LD (`VideoGame` 스키마)
- [x] GitHub Actions 자동 배포 (`.github/workflows/deploy.yml`)
- [ ] **첫 배포** — 저장소 만들고 푸시 (9절 "처음 한 번만 하는 일")
- [x] 이용 등급 전환 UI (`/` ↔ `/adult`)
- [ ] **연령 확인** — 지금은 그냥 눌러서 바뀐다. 공개 전에 반드시 붙일 것
- [x] Supabase 연결 준비 — `supabase/schema.sql`, 빌드 전용 클라이언트, JSON 폴백
- [ ] **Supabase 프로젝트 만들고 `.env.local` · GitHub Secrets 채우기** (사람이 해야 함)
- [x] '계속 플레이하기' 줄 (브라우저 저장소 기반)
- [ ] 즐겨찾기 (로그인 필요)
- [ ] 최근 플레이를 `game_plays` 테이블로 이관 (로그인 시)
- [ ] 광고 자리 (`ad_revenues`)

---

## 9. 배포 — GitHub Pages (정적 호스팅)

**1차 공개는 서버 없이 GitHub Pages 로 한다.** 이 제약이 코드 구조를 크게 좌우한다.

### 무엇이 되고 무엇이 안 되나

GitHub Pages 는 **미리 만들어 둔 HTML 파일을 그대로 내보내는 것만** 한다.
Next.js 를 `output: "export"` 로 돌려서 빌드 때 모든 페이지를 HTML 로 뽑아 둔다.

| 기능 | 정적 호스팅에서 |
|---|---|
| 페이지 HTML 서버 렌더링 | ✅ **된다.** 빌드 시점에 완성된 HTML 이 나온다 |
| `generateMetadata` (title/OG) | ✅ 된다 (빌드 때 실행) |
| `sitemap.ts` / `robots.ts` | ✅ 된다 (빌드 때 파일로 생성) |
| 빌드 때 Supabase 에서 게임 목록 읽기 | ✅ 된다 → **SEO 는 문제없다** |
| 브라우저에서 Supabase 호출(로그인·즐겨찾기) | ✅ 된다 |
| 미들웨어 (`proxy.ts`) | ❌ **안 된다. 파일을 지운다** |
| Route Handler (`app/auth/confirm/route.ts`) | ❌ 안 된다 |
| 서버 컴포넌트의 쿠키 기반 인증 | ❌ 안 된다 (요청을 받을 서버가 없다) |
| ISR · 요청 시 렌더링 · PPR | ❌ 안 된다 (`cacheComponents` 도 꺼야 한다) |
| `next/image` 최적화 | ❌ `images.unoptimized: true` 로 끈다 |

### 가장 중요한 결과: 게임을 추가하면 다시 배포해야 한다

Supabase 에 게임을 새로 넣어도 **사이트는 바뀌지 않는다.** 빌드할 때의 목록이 HTML 로
굳어 있기 때문이다. (앱은 `games.json` 을 실행할 때마다 읽으므로 즉시 반영된다 — 이
차이를 혼동하지 말 것.)

→ 게임을 추가하면 GitHub Actions 로 다시 빌드·배포한다. 나중에 Supabase 웹훅으로
자동화할 수 있지만, 처음에는 수동으로 워크플로를 돌리는 것으로 충분하다.

### 인증은 전부 브라우저 쪽에서 한다

서버가 없으니 쿠키 세션을 갱신해 줄 곳이 없다. 로그인 상태는 브라우저에만 있다.

- 쿠키를 읽던 `lib/supabase/server.ts` 는 **지웠다.** 빌드 시점에 게임 목록을 읽는
  클라이언트는 앞으로 `lib/supabase/static.ts` 로 따로 만든다 (쿠키를 쓰지 않는 것).
- 로그인·즐겨찾기·최근 플레이는 `lib/supabase/client.ts` 로 한다.
- 로그인 필요한 화면(`/my`, `/profile`)은 브라우저에서 확인하고 안내를 띄운다.
  **이 화면들은 어차피 색인 대상이 아니므로 SEO 손해가 없다.**
- 이메일 확인은 `app/auth/confirm/page.tsx` 가 브라우저에서 `verifyOtp` 로 처리한다
  (원래 있던 `route.ts` 는 정적에서 동작하지 않아 지웠다).

### 정해진 값 (이미 적용됨)

저장소는 **`thesalt0818/saltplay-web`**, 배포 주소는
`https://thesalt0818.github.io/saltplay-web/` 이다.

```ts
// next.config.ts
output: "export",
basePath: "/saltplay-web",    // 주소 앞에 저장소 이름이 붙는다
trailingSlash: true,          // GitHub Pages 는 /game/xxx/index.html 로 찾는다
images: { unoptimized: true },
```

**`basePath` 때문에 주의할 것 두 가지.**

1. `<Link href="/game/xxx">` 와 `next/font` 는 접두사를 **자동으로** 붙인다.
   하지만 `public/` 안의 파일을 `<img src="/logo.png">` 처럼 직접 적으면 **붙지 않아서
   404 가 난다.** 그런 자리는 `import logo from "@/public/logo.png"` 로 가져다 쓰거나
   경로에 `/saltplay-web` 을 직접 붙인다.
2. `window.location.origin` 은 `https://thesalt0818.github.io` 까지만 준다 —
   저장소 이름이 빠진다. 바깥에 내보낼 주소는 **`lib/utils.ts` 의 `siteUrl()`** 을 쓴다
   (회원가입 확인 메일 링크에서 실제로 걸렸던 자리다).
3. **`generateMetadata` 안에서는 `asset()` 을 쓰지 않는다.**
   `metadataBase` 에 이미 basePath 가 들어 있어서 Next 가 그 뒤에 경로를 이어 붙인다.
   `asset()` 이 한 번 더 붙이면 `.../saltplay-web/saltplay-web/...` 이 되어 미리보기
   그림이 404 가 된다. 여기서는 절대 주소(`siteUrl()`)를 쓴다.
   **빌드도 배포도 통과하고 링크를 공유해 봐야 티가 나는 종류다** — 실제로 첫 배포
   뒤에 발견했다. (파비콘 `icons` 는 이 규칙과 무관하다. 거기서는 `asset()` 이 맞다.)

나머지:

- `.env.local` 의 `NEXT_PUBLIC_SITE_URL` 을 실제 배포 주소로 맞춘다 (OG 미리보기·메일 링크).
- GitHub Actions 빌드에서도 `NEXT_PUBLIC_SUPABASE_*` 와 `NEXT_PUBLIC_SITE_URL` 이 필요하다 →
  저장소 Settings → Secrets 에 넣는다. **publishable(anon) 키만 넣는다.**
- Supabase 대시보드 → Authentication → URL Configuration 의 Site URL / Redirect URLs 에
  배포 주소를 등록해야 로그인·메일 확인이 동작한다.
- `public/.nojekyll` 이 있어야 한다. GitHub Pages 는 `_` 로 시작하는 폴더를 무시하는데
  Next 는 `_next/` 를 쓰기 때문이다. 없으면 **CSS·JS 가 전부 404** 가 되어 글씨만 남는다.
- 나중에 커스텀 도메인을 붙이면 `basePath` 를 지우고 `NEXT_PUBLIC_SITE_URL` 을 바꾼다.

### 처음 한 번만 하는 일

1. GitHub 에서 **`saltplay-web`** 이름으로 저장소를 만든다 (Public — Pages 무료 조건).
2. 이 폴더를 그 저장소에 푸시한다.
3. 저장소 **Settings → Pages → Source** 를 **GitHub Actions** 로 바꾼다.
   (기본값인 "Deploy from a branch" 로 두면 워크플로가 올린 결과가 무시된다.)
4. **Settings → Secrets and variables → Actions** 에 값을 넣는다.
   `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ·
   `NEXT_PUBLIC_SITE_URL`. 없어도 빌드는 되지만 로그인이 동작하지 않는다.
5. Actions 탭에서 초록불이 되면 `https://thesalt0818.github.io/saltplay-web/` 에서 열린다.

이후로는 **push 하면 자동으로 다시 배포된다.** 게임만 추가했을 때는 Actions 탭의
"Run workflow" 로 직접 돌려도 된다.

### 알아 둘 한계

- 서버 헤더·리다이렉트를 설정할 수 없다 (`next.config` 의 `redirects`/`headers` 무시됨).
- 404 는 `404.html` 로만 처리된다.
- 비공개 데이터를 숨길 서버가 없다. **공개하면 안 되는 것은 애초에 빌드에 넣지 않는다.**
- 나중에 트래픽이 늘거나 서버 기능이 필요해지면 Cloudflare Pages / Vercel 무료 티어로
  옮길 수 있다. 그때를 위해 **서버에서만 할 수 있는 일을 코드에 섞지 않는 편이 좋다.**

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
