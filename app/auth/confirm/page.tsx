"use client";

import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

/**
 * 이메일로 받은 확인 링크를 처리하는 화면.
 *
 * 원래 이 자리에는 서버가 처리하는 Route Handler(`route.ts`)가 있었다.
 * 정적 호스팅에는 요청을 받을 서버가 없어서 **브라우저에서 직접 확인**하도록 바꿨다.
 * 하는 일은 같다 — 주소에 붙어 온 token_hash 를 Supabase 에 보내 검증한다.
 */
function ConfirmInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    // 확인이 끝난 뒤 갈 곳. 주소로 지정할 수 있지만 기본은 홈이다.
    const next = params.get("next") ?? "/";

    if (!tokenHash || !type) {
      setError(
        "확인에 필요한 정보가 주소에 없습니다. 메일의 링크를 다시 눌러 주세요.",
      );
      return;
    }

    const verify = async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

      if (error) {
        setError(error.message);
        return;
      }
      router.replace(next);
    };

    verify();
  }, [params, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      {error ? (
        <div className="max-w-sm text-center">
          <p className="text-lg font-bold">확인하지 못했습니다</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">확인하는 중입니다…</p>
      )}
    </div>
  );
}

/**
 * useSearchParams 는 주소에 따라 결과가 달라지므로 Suspense 로 감싸야 한다.
 * 감싸지 않으면 정적 빌드가 실패한다.
 */
export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">확인하는 중입니다…</p>
        </div>
      }
    >
      <ConfirmInner />
    </Suspense>
  );
}
