import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { SITE_DESCRIPTION, SITE_NAME, asset } from "@/lib/site";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  // OG 이미지와 정규 주소의 기준. 상대 경로로 적은 주소가 이 값을 기준으로 완성된다.
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} — 무료 온라인 게임 포털`,
    // 하위 페이지에서 title 을 정하면 "게임 이름 | SaltPlay" 로 나온다.
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
  },
  icons: {
    icon: asset("/brand/app-icon.png"),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 배경과 같은 순검정. 모바일 주소창까지 검게 칠해져 앱처럼 보인다.
  themeColor: "#000000",
  // ⚠️ maximumScale / userScalable 을 넣지 않는다 — 확대를 막는 것은 접근성 위반이다.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="ko" — 한국어 사이트라고 검색엔진에 알린다.
    // class="dark" — 자바스크립트가 실행되기 전에도 검은 배경으로 그려져
    //                첫 화면이 흰색으로 번쩍이지 않는다.
    <html lang="ko" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {/* 다크 전용 사이트다. forcedTheme 으로 항상 dark 에 고정한다.
            (시스템 설정이 라이트여도 바뀌지 않는다.) */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
