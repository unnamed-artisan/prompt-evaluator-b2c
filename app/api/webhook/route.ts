import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  // Stripe の署名検証には「生のリクエストボディ（文字列）」が必要。
  // Next.js App Router の Route Handler では request.text() でそのまま取得できる
  // （request.json() でパースすると署名が一致しなくなるので使わないこと）。
  const body = await request.text();

  // Next.js 16 では headers() は非同期なので await が必要。
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    // constructEventAsync は Node / Edge どちらのランタイムでも動作する。
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // 決済リンクに付与した client_reference_id から、対象の Supabase ユーザー ID を取得。
    const userId = session.client_reference_id;

    if (!userId) {
      console.error("[webhook] checkout.session.completed without client_reference_id");
      return NextResponse.json(
        { error: "Missing client_reference_id" },
        { status: 400 }
      );
    }

    // サービスロールキーで管理者権限の Supabase クライアントを作成する。
    // RLS をバイパスして profiles を更新できるが、このキーはサーバー外に絶対に出さないこと。
    // セッション（Cookie）は不要なので永続化系のオプションは無効化しておく。
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", userId);

    if (error) {
      console.error("[webhook] Failed to update profile:", error);
      // 500 を返すと Stripe が自動でリトライしてくれる。
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    console.log(`[webhook] User ${userId} upgraded to premium`);
  }

  // 受信を確認したことを Stripe に伝える（200）。
  return NextResponse.json({ received: true });
}
