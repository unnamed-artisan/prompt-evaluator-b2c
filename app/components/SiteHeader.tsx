import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/login/actions";

/**
 * アプリ全体のナビゲーションヘッダー（Server Component）。
 * ログイン状態に応じて表示するボタンを切り替える。
 *   - 未ログイン: 「ログイン」
 *   - ログイン中: 「マイページ」「ログアウト」
 */
export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="bg-white border-b border-slate-200">
      <nav className="max-w-5xl mx-auto px-8 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight"
          style={{ color: "#1e3a5f" }}
        >
          AIプロンプト診断
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-xs text-slate-400 mr-1">
                {user.email}
              </span>
              <Link
                href="/mypage"
                className="px-4 py-1.5 rounded text-sm font-semibold text-white transition-colors shadow-sm"
                style={{ backgroundColor: "#1e3a5f" }}
              >
                マイページ
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  ログアウト
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded text-sm font-semibold text-white transition-colors shadow-sm"
              style={{ backgroundColor: "#1e3a5f" }}
            >
              ログイン
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
