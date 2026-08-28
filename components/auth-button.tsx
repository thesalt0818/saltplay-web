"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { hasEnvVars } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

/**
 * 로그인 상태에 따라 달라지는 헤더 버튼.
 *
 * 원래는 서버에서 쿠키를 읽어 판단했다. 정적 호스팅에는 서버가 없어서
 * **브라우저에서 판단**하도록 바꿨다.
 *
 * `onAuthStateChange` 를 구독하는 이유: 로그인·로그아웃한 뒤에도 이 버튼이
 * 저절로 바뀌어야 한다. 구독하지 않으면 새로고침해야 반영된다.
 *
 * ⚠️ 이 컴포넌트는 브라우저에서 그려지므로 **검색엔진이 보는 HTML 에는 없다.**
 * 로그인 여부에 따라 달라지는 UI 는 전부 이렇게 만든다 — 대신 SEO 가 필요한
 * 내용(게임 제목·설명)은 절대 이런 곳에 넣지 않는다.
 */
export function AuthButton() {
  // null = 아직 확인 중. 확인 전에 "로그인" 버튼을 보여 주면 이미 로그인한
  // 사용자에게 잠깐 잘못된 화면이 스친다.
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    // ⚠️ Supabase 키가 없으면 createClient() 가 예외를 던진다.
    // 그대로 두면 헤더 하나 때문에 **사이트 전체가 빈 화면이 된다** — 게임을 보러 온
    // 사람에게 로그인 설정 문제로 아무것도 못 보여 주는 것은 말이 안 된다.
    // 키가 없을 때는 그냥 로그인 안 한 상태로 본다.
    if (!hasEnvVars) {
      setEmail(null);
      return;
    }

    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setEmail(session?.user.email ?? null);
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  if (email === undefined) {
    // 자리만 잡아 둔다. 비워 두면 확인이 끝나는 순간 헤더가 덜컥 움직인다.
    return <div className="h-8" />;
  }

  return email ? (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-muted-foreground">{email}</span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">로그인</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href="/auth/sign-up">회원가입</Link>
      </Button>
    </div>
  );
}
