import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  // 다크 전용 사이트지만, shadcn/ui 컴포넌트가 dark: 접두사를 쓰므로 설정은 남긴다.
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 색의 실제 값은 app/globals.css 에 있다. 여기는 "이름 ↔ 변수" 연결만 한다.
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // 청록 #0DD3DE
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        // 주황 #F79B4B (로고의 PLAY 색)
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // ── SaltPlay 전용 ──
        // 카드·패널 바닥. bg-surface / bg-surface-high
        surface: {
          DEFAULT: "hsl(var(--surface))",
          high: "hsl(var(--surface-high))",
        },
        // 하단 바. bg-bottombar
        bottombar: "hsl(var(--bottom-bar))",
        // 게임 카드 배지. bg-hot text-hot-foreground
        hot: {
          DEFAULT: "hsl(var(--hot))",
          foreground: "hsl(var(--hot-foreground))",
        },
        top: {
          DEFAULT: "hsl(var(--top))",
          foreground: "hsl(var(--top-foreground))",
        },
        // 성인용 표시색. 전체이용가 화면에서는 쓰지 않는다.
        adult: "hsl(var(--adult))",
        // 입력칸(앱의 textbox_bg 와 같은 밝은 회청색). bg-field text-field-foreground
        field: {
          DEFAULT: "hsl(var(--field))",
          foreground: "hsl(var(--field-foreground))",
        },
      },

      // 앱과 같은 글꼴. Pretendard 는 app/globals.css 의 @import 로 불러온다.
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // 게임 아이콘 원본이 200px 이라 카드를 그보다 크게 그리면 흐려진다.
      // 격자를 짤 때 max-w-icon 으로 상한을 건다.
      maxWidth: {
        icon: "200px",
      },

      // 화면을 눕혔을 때 세로 자리가 좁아지는 경우를 위한 조건.
      // 예: landscape-short:h-12 → 가로로 눕힌 폰에서만 헤더를 낮춘다.
      screens: {
        "landscape-short": {
          raw: "(orientation: landscape) and (max-height: 500px)",
        },
        // 마우스가 아니라 손가락으로 조작하는 기기.
        // 폭이 아니라 입력 방식으로 판단해야 하는 자리에 쓴다
        // (800px 태블릿을 눕히면 1280px 가 되어 데스크톱으로 오인된다).
        touch: { raw: "(pointer: coarse)" },
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
