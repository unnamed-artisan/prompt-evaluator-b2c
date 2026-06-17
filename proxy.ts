import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 の Proxy（旧 Middleware）。
 * リクエストごとに Supabase のセッション Cookie を読み直し、必要に応じて
 * トークンを更新してレスポンスに書き戻します。これがないと Server Component 側で
 * セッションが切れたままになることがあります。
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() を呼ぶことでトークンの有効期限を検証・更新する。
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // 静的アセットや画像最適化のリクエストでは実行しない。
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
