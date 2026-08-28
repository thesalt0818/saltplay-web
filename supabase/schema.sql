-- ============================================================================
-- SaltPlay 데이터베이스 스키마
--
-- 쓰는 법: Supabase 대시보드 → 왼쪽 메뉴 SQL Editor → New query →
--          이 파일 전체를 붙여넣고 Run.
--
-- 몇 번을 실행해도 안전하게 만들어 두었다(IF NOT EXISTS / ON CONFLICT).
-- 실패하면 중간까지만 반영되므로, 오류 메시지를 그대로 가지고 물어보면 된다.
--
-- ⚠️ 아래 정책(RLS)이 이 사이트의 유일한 방어선이다.
--    웹과 앱이 쓰는 publishable(anon) 키는 브라우저에 그대로 노출된다.
--    "앱 코드에서 안 부르니까 괜찮다"는 통하지 않는다 — 누구나 키를 꺼내서
--    직접 요청할 수 있다. 무엇을 열지는 반드시 여기서 정한다.
-- ============================================================================


-- ── 게임 ────────────────────────────────────────────────────────────────────
-- 필드 구성은 Flutter 앱의 GameEntry 와 같다. 두 곳이 어긋나면 앱에는 보이는데
-- 웹에는 없는 게임이 생긴다.

create table if not exists public.games (
  -- 주소 슬러그로도 쓴다: /game/slotclicker
  id           text primary key,
  title        text not null,
  description  text not null default '',

  -- 게임이 실제로 올라가 있는 주소. 반드시 https.
  -- 평문 http 는 앱이 차단하고, 브라우저도 https 페이지 안의 http iframe 을 막는다.
  url          text not null,
  constraint games_url_https check (url like 'https://%'),

  orientation  text not null default 'portrait'
               check (orientation in ('portrait', 'landscape', 'sensor')),

  -- 'gameicon/toyslot_icon' 같은 상대 경로. 세로형은 뒤에 _long 을 붙여 찾으므로
  -- 여기에는 정사각 경로만 적는다.
  thumbnail    text,

  -- 썸네일이 없을 때의 대체 색이자 카드 강조색.
  accent       text not null default '#3A6EA5',

  -- 홈의 줄과 카테고리를 고르는 기준. hot, top, casual, idle, puzzle, action, simulation
  tags         text[] not null default '{}',

  -- ⚠️ 'adult' 라고 정확히 적었을 때만 성인용이다. 기본값은 전체이용가.
  --    오타 하나로 성인용이 전체이용가에 섞이는 쪽이 그 반대보다 위험하다.
  audience     text not null default 'all' check (audience in ('all', 'adult')),

  -- 캐시 무효화용 문자열. 게임을 새로 배포했는데 이걸 안 바꾸면 브라우저가
  -- 예전 파일을 물고 있어 검은 화면이 된다.
  version      text not null default '',

  -- ⚠️ 'published' 인 것만 사이트에 나온다. 새로 넣으면 기본은 초안이다.
  status       text not null default 'draft' check (status in ('draft', 'published')),

  -- 홈 줄과 목록에서의 정렬 순서. 작을수록 앞.
  sort_order   int not null default 0,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 공개 목록을 읽을 때 매번 훑지 않도록.
create index if not exists games_published_idx
  on public.games (status, audience, sort_order);


-- ── 카테고리 ────────────────────────────────────────────────────────────────
-- 주소는 영어(/category/puzzle), 화면 글씨는 한국어여야 해서 이름을 따로 둔다.
--
-- ⚠️ 어떤 게임이 어느 카테고리인지는 games.tags 가 정한다. 이 표는 "슬러그 →
--    한국어 이름 + 어떤 태그를 모을지"를 적어 두는 곳이다.

create table if not exists public.categories (
  slug        text primary key,
  name        text not null,
  tags        text[] not null default '{}',
  sort_order  int not null default 0
);


-- ── 게임 ↔ 카테고리 (지금은 웹이 읽지 않는다) ───────────────────────────────
--
-- ⚠️ 이 표를 쓰기 시작하면 "어느 게임이 어느 분류인가"의 답이 games.tags 와
--    여기 두 곳이 된다. 두 곳이 어긋나면 앱과 웹의 목록이 달라진다.
--    당분간은 tags 만 쓰고, 이 표는 나중에 관리 화면을 만들 때 정리한다.

create table if not exists public.game_categories (
  game_id       text not null references public.games(id) on delete cascade,
  category_slug text not null references public.categories(slug) on delete cascade,
  primary key (game_id, category_slug)
);


-- ── 사용자 ──────────────────────────────────────────────────────────────────
-- auth.users 는 Supabase 가 관리한다. 여기에는 우리가 쓰는 값만 덧붙인다.

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- 회원가입하면 프로필 행을 자동으로 만든다.
-- 없으면 로그인은 됐는데 프로필이 없는 상태가 생겨 화면마다 예외 처리를 해야 한다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 즐겨찾기 ────────────────────────────────────────────────────────────────

create table if not exists public.favorites (
  user_id     uuid not null references auth.users(id) on delete cascade,
  game_id     text not null references public.games(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, game_id)
);


-- ── 플레이 기록 (앱의 '최근 목록') ──────────────────────────────────────────

create table if not exists public.game_plays (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  game_id     text not null references public.games(id) on delete cascade,
  played_at   timestamptz not null default now()
);

-- '내 최근 게임'은 늘 최신순으로 읽는다.
create index if not exists game_plays_recent_idx
  on public.game_plays (user_id, played_at desc);


-- ── 광고 수익 ───────────────────────────────────────────────────────────────
-- ⚠️ 운영자만 보는 자료다. 아래에서 RLS 를 켜고 정책을 하나도 만들지 않는다
--    = publishable 키로는 아무도 읽지 못한다. 정책을 추가하지 말 것.

create table if not exists public.ad_revenues (
  id          bigint generated always as identity primary key,
  game_id     text references public.games(id) on delete set null,
  day         date not null,
  impressions int not null default 0,
  revenue     numeric(12, 4) not null default 0,
  created_at  timestamptz not null default now()
);


-- ============================================================================
-- RLS — 누가 무엇을 읽고 쓸 수 있는가
-- ============================================================================

alter table public.games           enable row level security;
alter table public.categories      enable row level security;
alter table public.game_categories enable row level security;
alter table public.profiles        enable row level security;
alter table public.favorites       enable row level security;
alter table public.game_plays      enable row level security;
alter table public.ad_revenues     enable row level security;

-- 게임: 공개된 것만 누구나 읽는다. 쓰기는 아무에게도 열지 않는다
-- (게임 추가·수정은 Supabase 대시보드에서 한다).
drop policy if exists "공개된 게임은 누구나 읽는다" on public.games;
create policy "공개된 게임은 누구나 읽는다"
  on public.games for select
  using (status = 'published');

drop policy if exists "카테고리는 누구나 읽는다" on public.categories;
create policy "카테고리는 누구나 읽는다"
  on public.categories for select using (true);

drop policy if exists "게임-카테고리 연결은 누구나 읽는다" on public.game_categories;
create policy "게임-카테고리 연결은 누구나 읽는다"
  on public.game_categories for select using (true);

-- 프로필: 자기 것만.
drop policy if exists "자기 프로필만 읽는다" on public.profiles;
create policy "자기 프로필만 읽는다"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "자기 프로필만 고친다" on public.profiles;
create policy "자기 프로필만 고친다"
  on public.profiles for update using (auth.uid() = id);

-- 즐겨찾기: 자기 것만 읽고, 자기 것만 추가·삭제한다.
drop policy if exists "자기 즐겨찾기만 읽는다" on public.favorites;
create policy "자기 즐겨찾기만 읽는다"
  on public.favorites for select using (auth.uid() = user_id);

drop policy if exists "자기 즐겨찾기만 추가한다" on public.favorites;
create policy "자기 즐겨찾기만 추가한다"
  on public.favorites for insert with check (auth.uid() = user_id);

drop policy if exists "자기 즐겨찾기만 지운다" on public.favorites;
create policy "자기 즐겨찾기만 지운다"
  on public.favorites for delete using (auth.uid() = user_id);

-- 플레이 기록: 자기 것만. 남의 기록을 남기지 못하도록 with check 를 건다.
drop policy if exists "자기 플레이 기록만 읽는다" on public.game_plays;
create policy "자기 플레이 기록만 읽는다"
  on public.game_plays for select using (auth.uid() = user_id);

drop policy if exists "자기 플레이 기록만 남긴다" on public.game_plays;
create policy "자기 플레이 기록만 남긴다"
  on public.game_plays for insert with check (auth.uid() = user_id);

-- ad_revenues 에는 정책을 만들지 않는다 = publishable 키로는 접근 불가.


-- ============================================================================
-- 초기 데이터 — data/games.json 과 같은 내용
--
-- ⚠️ 웹의 data/games.json 과 앱의 assets/data/games.json 이 아직 남아 있다.
--    한쪽을 고치면 다른 쪽도 맞춰야 목록이 어긋나지 않는다.
-- ============================================================================

insert into public.categories (slug, name, tags, sort_order) values
  ('hot',    '인기',   '{hot}',              1),
  ('casual', '캐주얼', '{casual}',           2),
  ('idle',   '방치형', '{idle,simulation}',  3),
  ('puzzle', '퍼즐',   '{puzzle}',           4),
  ('action', '액션',   '{action}',           5)
on conflict (slug) do update
  set name = excluded.name,
      tags = excluded.tags,
      sort_order = excluded.sort_order;

insert into public.games
  (id, title, description, url, version, orientation, thumbnail, accent, tags, audience, status, sort_order)
values
  ('slotclicker', 'Toy Slots', '방치형 슬롯머신 클리커',
   'https://thesalt0818.github.io/slotclicker/', '20260819', 'portrait',
   'gameicon/toyslot_icon', '#E8A33D', '{hot,idle,casual}', 'all', 'published', 1),

  ('elpissurvival', 'Elpis Survival', '생존 액션 게임',
   'https://thesalt0818.github.io/elpissurvival/', '20260611', 'portrait',
   'gameicon/elpis_icon', '#5B7FDE', '{hot,action}', 'all', 'published', 2),

  ('candycan', 'Candy Can', '머지 수박 게임',
   'https://thesalt0225.github.io/candycanWtest/', '20260715', 'portrait',
   'gameicon/candycan_icon', '#5B7FDE', '{casual,puzzle}', 'all', 'published', 3),

  ('catguardians', 'Cat Guardians', '방치형 시뮬레이션 게임',
   'https://thesalt0818.github.io/catguardians/', '20260821', 'portrait',
   'gameicon/catguardians_icon', '#5B7FDE', '{idle,simulation,casual}', 'all', 'published', 4),

  -- ⚠️ 성인용 4개는 주소가 아직 임시다. 실제 게임 주소로 바꿔야 한다.
  ('adult01', '섹시 블리드', '주소가 아직 임시입니다 — 실제 게임 주소로 바꿔 주세요',
   'https://thesalt0818.github.io/saltplay/', '', 'portrait',
   'gameicon_adult/game01_icon_adult', '#C93A47', '{hot,simulation}', 'adult', 'published', 11),

  ('adult02', '탑 오브 유혹', '주소가 아직 임시입니다 — 실제 게임 주소로 바꿔 주세요',
   'https://thesalt0818.github.io/saltplay/', '', 'portrait',
   'gameicon_adult/game02_icon_adult', '#C93A47', '{hot,action}', 'adult', 'published', 12),

  ('adult03', '나이트 퀸', '주소가 아직 임시입니다 — 실제 게임 주소로 바꿔 주세요',
   'https://thesalt0818.github.io/saltplay/', '', 'portrait',
   'gameicon_adult/game03_icon_adult', '#C93A47', '{casual,puzzle}', 'adult', 'published', 13),

  ('adult04', '뜨거운 도시', '주소가 아직 임시입니다 — 실제 게임 주소로 바꿔 주세요',
   'https://thesalt0818.github.io/saltplay/', '', 'portrait',
   'gameicon_adult/game04_icon_adult', '#C93A47', '{idle,simulation}', 'adult', 'published', 14)

on conflict (id) do update
  set title       = excluded.title,
      description = excluded.description,
      url         = excluded.url,
      version     = excluded.version,
      orientation = excluded.orientation,
      thumbnail   = excluded.thumbnail,
      accent      = excluded.accent,
      tags        = excluded.tags,
      audience    = excluded.audience,
      status      = excluded.status,
      sort_order  = excluded.sort_order,
      updated_at  = now();
