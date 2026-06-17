"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, signup, type AuthState } from "./actions";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");

  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined
  );

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-sm font-medium"
            style={{ color: "#1e3a5f" }}
          >
            AIプロンプト診断
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-slate-800">
            {isLogin ? "ログイン" : "新規登録"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isLogin
              ? "メールアドレスとパスワードでログインしてください。"
              : "メールアドレスとパスワードでアカウントを作成します。"}
          </p>
        </div>

        {/* タブ切り替え */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              isLogin ? "text-white" : "text-slate-500 hover:text-slate-700"
            }`}
            style={isLogin ? { backgroundColor: "#1e3a5f" } : undefined}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              !isLogin ? "text-white" : "text-slate-500 hover:text-slate-700"
            }`}
            style={!isLogin ? { backgroundColor: "#1e3a5f" } : undefined}
          >
            新規登録
          </button>
        </div>

        <form
          action={formAction}
          className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 placeholder-slate-400 text-sm transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={isLogin ? "パスワード" : "6文字以上"}
              className="w-full px-4 py-2.5 rounded border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 placeholder-slate-400 text-sm transition-colors"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {state.error}
            </p>
          )}
          {state?.message && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white font-semibold rounded text-sm transition-colors shadow-sm disabled:cursor-not-allowed"
            style={{ backgroundColor: pending ? "#cbd5e1" : "#1e3a5f" }}
          >
            {pending ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                処理中...
              </>
            ) : isLogin ? (
              "ログイン"
            ) : (
              "アカウントを作成"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
