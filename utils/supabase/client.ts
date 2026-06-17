import { createBrowserClient } from "@supabase/ssr";

/**
 * ブラウザ（Client Component）から使う Supabase クライアント。
 * Cookie ベースのセッションを自動で読み書きします。
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
