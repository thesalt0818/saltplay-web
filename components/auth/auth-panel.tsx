"use client";

import { ArrowLeft, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { cn, hasEnvVars, siteUrl } from "@/lib/utils";
import { AppleIcon, FacebookIcon, GoogleIcon } from "./brand-icons";

/**
 * 로그인·가입 패널. 오른쪽에서 밀려나오는 서랍 형태다.
 *
 * ## 왜 별도 페이지가 아닌가
 *
 * 게임을 보다가 로그인하려고 페이지를 통째로 옮기면, 돌아왔을 때 보던 자리를
 * 잃는다. 서랍은 뒤의 화면을 그대로 두므로 로그인 뒤 하던 일을 이어갈 수 있다.
 * (`/auth/login` 페이지는 그대로 둔다 — 메일의 링크가 그리로 오기 때문이다.)
 *
 * ## 세 단계로 나뉜다
 *
 * 1. `email`  — 이메일만 받는다
 * 2. `password` — 로그인 시도
 * 3. `signup` — 가입 (비밀번호 + 확인)
 *
 * ⚠️ **"이 이메일이 가입돼 있는지"를 미리 물어보지 않는다.**
 * Supabase 의 공개 키로는 조회할 수 없고, 할 수 있다 해도 아무나 이메일을 넣어 보며
 * 가입자 목록을 알아낼 수 있어(계정 열거) 열어 주면 안 되는 기능이다.
 * 대신 로그인을 시도해 보고, 실패하면 가입으로 안내한다 — 쓰는 사람이 느끼는
 * 흐름은 같으면서 계정 존재 여부가 새지 않는다.
 */
export function AuthPanel({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"email" | "password" | "signup">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 가입 안내 메일을 보낸 뒤처럼, 오류가 아닌 알림. */
  const [notice, setNotice] = useState<string | null>(null);
  /** 로그인이 실패해서 '가입하기'를 권해야 하는 상태인가. */
  const [offerSignup, setOfferSignup] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // Esc 로 닫기 + 뒤 화면이 따라 스크롤되지 않게 막기.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  // 열리면 첫 입력칸으로 커서를 옮긴다. 안 그러면 키보드 사용자가 패널 밖에 남는다.
  useEffect(() => {
    panelRef.current?.querySelector("input")?.focus();
  }, [step]);

  /** Supabase 설정이 없을 때 공통으로 쓰는 안내. */
  function requireConfig(): boolean {
    if (hasEnvVars) return false;
    setError(
      "로그인 설정이 아직 없습니다. .env.local 에 Supabase 주소와 키를 넣어 주세요.",
    );
    return true;
  }

  async function handleSocial(provider: "google" | "facebook" | "apple") {
    if (requireConfig()) return;
    setError(null);
    setBusy(true);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider,
        // 로그인을 마치면 보던 곳이 아니라 홈으로 돌아온다.
        options: { redirectTo: siteUrl("/") },
      });
      if (error) throw error;
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} (Supabase 대시보드에서 이 로그인 방식을 켜야 합니다)`
          : "로그인하지 못했습니다.",
      );
      setBusy(false);
    }
  }

  async function handleLogin() {
    if (requireConfig()) return;
    setError(null);
    setOfferSignup(false);
    setBusy(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      // Supabase 는 '없는 계정'과 '틀린 비밀번호'를 같은 오류로 돌려준다.
      // 계정이 있는지 알려 주지 않기 위해서다. 그래서 양쪽 가능성을 함께 안내한다.
      if (message.toLowerCase().includes("invalid login credentials")) {
        setError("비밀번호가 다르거나, 아직 가입하지 않은 이메일입니다.");
        setOfferSignup(true);
      } else {
        setError(message || "로그인하지 못했습니다.");
      }
      setBusy(false);
    }
  }

  async function handleSignup() {
    if (requireConfig()) return;
    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 다릅니다.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { error } = await createClient().auth.signUp({
        email,
        password,
        // ⚠️ window.location.origin 이 아니라 siteUrl() 이다. basePath 가 빠지면
        // 메일의 확인 링크가 404 로 간다.
        options: { emailRedirectTo: siteUrl("/") },
      });
      if (error) throw error;
      setNotice(
        `${email} 으로 확인 메일을 보냈습니다. 메일의 링크를 눌러 가입을 마쳐 주세요.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "가입하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  /*
   * ⚠️ **반드시 `document.body` 에 직접 그린다(포털).**
   *
   * 이 패널을 여는 버튼은 헤더 안에 있는데, 헤더에는 `backdrop-blur` 가 걸려 있다.
   * `backdrop-filter` 가 있는 요소는 그 안의 `position: fixed` 자식에게 **화면이
   * 아니라 자기 자신을 기준**으로 만든다(containing block). 그래서 포털 없이 두면
   * `fixed inset-0` 이 화면 전체가 아니라 **헤더 높이(55px)에 갇힌다** —
   * 실제로 그렇게 만들었다가 입력칸만 헤더에 삐져나온 것을 보고 고쳤다.
   */
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/*
        빈 곳(뒷배경)을 누르면 닫힌다.
        `<button>` 으로 만들어야 키보드로도 닫을 수 있고 화면 낭독기에도 알려진다.
      */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="로그인 또는 가입"
        className={cn(
          "relative flex h-full w-full max-w-sm flex-col overflow-y-auto",
          "bg-surface shadow-2xl shadow-black/60",
          // 오른쪽에서 밀려나온다(globals.css 에 정의한 것).
          "animate-slide-in-right",
        )}
      >
        <div className="flex items-center justify-between p-4">
          {step !== "email" && !notice ? (
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
                setOfferSignup(false);
              }}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-surface-high hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">이메일 다시 입력</span>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-surface-high hover:text-foreground"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">닫기</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col px-6 pb-8">
          <h2 className="mb-6 mt-6 text-center text-2xl font-bold">
            {step === "signup" ? "가입하기" : "로그인 또는 가입"}
          </h2>

          {notice ? (
            <p className="rounded-lg bg-surface-high p-4 text-center text-sm leading-relaxed">
              {notice}
            </p>
          ) : (
            <>
              {step === "email" && (
                <EmailStep
                  email={email}
                  onEmailChange={setEmail}
                  onNext={() => {
                    setError(null);
                    setStep("password");
                  }}
                  onSocial={handleSocial}
                  busy={busy}
                />
              )}

              {step === "password" && (
                <PasswordStep
                  email={email}
                  password={password}
                  onPasswordChange={setPassword}
                  onSubmit={handleLogin}
                  busy={busy}
                />
              )}

              {step === "signup" && (
                <SignupStep
                  email={email}
                  password={password}
                  passwordConfirm={passwordConfirm}
                  onPasswordChange={setPassword}
                  onPasswordConfirmChange={setPasswordConfirm}
                  onSubmit={handleSignup}
                  busy={busy}
                />
              )}

              {error && (
                <p className="mt-4 text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              {offerSignup && (
                <button
                  type="button"
                  onClick={() => {
                    setStep("signup");
                    setError(null);
                    setOfferSignup(false);
                    setPassword("");
                  }}
                  className="mt-3 w-full rounded-lg border border-border py-3 font-bold transition hover:bg-surface-high"
                >
                  이 이메일로 가입하기
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ──────────────────────────────── 단계별 화면 ──────────────────────────── */

function EmailStep({
  email,
  onEmailChange,
  onNext,
  onSocial,
  busy,
}: {
  email: string;
  onEmailChange: (value: string) => void;
  onNext: () => void;
  onSocial: (provider: "google" | "facebook" | "apple") => void;
  busy: boolean;
}) {
  // 아주 느슨하게만 본다. 정규식으로 이메일을 엄격히 검사하면 멀쩡한 주소가 막힌다.
  const valid = /.+@.+\..+/.test(email.trim());

  return (
    <>
      <div className="flex flex-col gap-3">
        <SocialButton
          onClick={() => onSocial("google")}
          disabled={busy}
          className="bg-white text-neutral-900 hover:brightness-95"
        >
          <GoogleIcon className="h-5 w-5" />
          Google 계정으로 로그인
        </SocialButton>

        <SocialButton
          onClick={() => onSocial("facebook")}
          disabled={busy}
          className="bg-[#1877F2] text-white hover:brightness-110"
        >
          <FacebookIcon className="h-5 w-5" />
          Facebook으로 계속 진행
        </SocialButton>

        <SocialButton
          onClick={() => onSocial("apple")}
          disabled={busy}
          className="bg-white text-neutral-900 hover:brightness-95"
        >
          <AppleIcon className="h-5 w-5" />
          Apple로 계속 진행
        </SocialButton>
      </div>

      <div className="my-6 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        또는
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onNext();
        }}
        className="flex flex-col gap-3"
      >
        <Field
          type="email"
          value={email}
          onChange={onEmailChange}
          placeholder="이메일 입력"
          autoComplete="email"
        />
        <PrimaryButton disabled={!valid || busy}>계속하기</PrimaryButton>
      </form>
    </>
  );
}

function PasswordStep({
  email,
  password,
  onPasswordChange,
  onSubmit,
  busy,
}: {
  email: string;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-3"
    >
      <p className="mb-1 text-center text-sm text-muted-foreground">{email}</p>

      <Field
        type="password"
        value={password}
        onChange={onPasswordChange}
        placeholder="비밀번호"
        autoComplete="current-password"
      />
      <PrimaryButton disabled={!password || busy} busy={busy}>
        로그인
      </PrimaryButton>
    </form>
  );
}

function SignupStep({
  email,
  password,
  passwordConfirm,
  onPasswordChange,
  onPasswordConfirmChange,
  onSubmit,
  busy,
}: {
  email: string;
  password: string;
  passwordConfirm: string;
  onPasswordChange: (value: string) => void;
  onPasswordConfirmChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-3"
    >
      <p className="mb-1 text-center text-sm text-muted-foreground">{email}</p>

      <Field
        type="password"
        value={password}
        onChange={onPasswordChange}
        placeholder="비밀번호 (6자 이상)"
        autoComplete="new-password"
      />
      <Field
        type="password"
        value={passwordConfirm}
        onChange={onPasswordConfirmChange}
        placeholder="비밀번호 확인"
        autoComplete="new-password"
      />
      <PrimaryButton
        disabled={password.length < 6 || !passwordConfirm || busy}
        busy={busy}
      >
        가입하기
      </PrimaryButton>
    </form>
  );
}

/* ────────────────────────────────── 조각들 ─────────────────────────────── */

function Field({
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  type: "email" | "password";
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      aria-label={placeholder}
      className={cn(
        "h-14 w-full rounded-lg border border-border bg-surface-high px-4",
        "text-foreground placeholder:text-muted-foreground",
        "outline-none transition focus:border-primary focus:ring-1 focus:ring-primary",
      )}
    />
  );
}

function PrimaryButton({
  children,
  disabled,
  busy,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        "flex h-14 items-center justify-center gap-2 rounded-lg font-bold transition",
        // 누를 수 없을 때는 눌러도 소용없다는 것이 보여야 한다.
        disabled
          ? "cursor-not-allowed bg-surface-high text-muted-foreground"
          : "bg-primary text-primary-foreground hover:brightness-110",
      )}
    >
      {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

function SocialButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-12 items-center justify-center gap-3 rounded-lg font-bold transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
