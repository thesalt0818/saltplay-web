"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * 인증 과정에서 문제가 생겼을 때 보여 주는 화면.
 *
 * 원래는 서버에서 `await searchParams` 로 에러 내용을 읽었다. 정적 호스팅에는
 * 주소를 읽어 줄 서버가 없어서 **브라우저에서 읽도록** 바꿨다.
 * 이 화면은 검색엔진에 노출될 이유가 없으므로 클라이언트 렌더링이어도 손해가 없다.
 */
function ErrorMessage() {
  const message = useSearchParams().get("error");

  return (
    <p className="text-sm text-muted-foreground">
      {message ? `오류: ${message}` : "알 수 없는 오류가 발생했습니다."}
    </p>
  );
}

export default function Page() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">문제가 발생했습니다</CardTitle>
          </CardHeader>
          <CardContent>
            {/* useSearchParams 는 주소에 따라 결과가 달라지므로 Suspense 가 필요하다.
                감싸지 않으면 정적 빌드가 실패한다. */}
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">불러오는 중…</p>
              }
            >
              <ErrorMessage />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
