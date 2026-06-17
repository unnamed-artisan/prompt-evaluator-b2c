"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
} | undefined;

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  redirect("/mypage");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  if (password.length < 6) {
    return { error: "パスワードは6文字以上で設定してください。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // メール確認が有効な場合、セッションはまだ確立されない。
  if (!data.session) {
    return {
      message:
        "確認メールを送信しました。メール内のリンクから登録を完了してください。",
    };
  }

  redirect("/mypage");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
