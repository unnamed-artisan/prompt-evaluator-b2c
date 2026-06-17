import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * サーバー（Server Component / Route Handler / Server Action）から使う
 * Supabase クライアント。Next.js の Cookie ストアと連携してセッションを管理します。
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component から呼ばれた場合は Cookie を書き込めない。
            // セッションの更新は proxy.ts 側で行われるため、ここでは無視してよい。
          }
        },
      },
    }
  );
}
