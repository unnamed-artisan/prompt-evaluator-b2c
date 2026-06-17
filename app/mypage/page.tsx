import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import HistoryCard, { type Evaluation } from "@/app/components/HistoryCard";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // プレミアム会員かどうかを profiles テーブルから取得する。
  // 行が無い／取得失敗の場合は無料会員（false）として扱う。
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .maybeSingle();

  const isPremium = profile?.is_premium === true;

  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const evaluations = (data ?? []) as Evaluation[];
  const average =
    evaluations.length > 0
      ? Math.round(
          evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">マイページ</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              診断回数
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              {evaluations.length}
              <span className="ml-1 text-base font-normal text-slate-400">
                回
              </span>
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              平均スコア
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              {average}
              <span className="ml-1 text-base font-normal text-slate-400">
                / 100
              </span>
            </p>
          </div>
        </div>

        {/* 履歴：
            - 取得自体は無料／プレミアム問わず全件行う（上の data 取得を参照）。
            - プレミアム会員は全件をクリアに表示。
            - 無料会員は最新1件のみクリア表示し、それ以降はぼかし＋CTAでチラ見せする。 */}
        {error ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-700">診断履歴</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-red-600">
                履歴の取得に失敗しました：{error.message}
              </p>
            </div>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-700">診断履歴</h2>
            </div>
            <div className="p-10 text-center">
              <p className="text-sm text-slate-400">
                まだ診断履歴がありません。トップページからプロンプトを診断してみましょう。
              </p>
            </div>
          </div>
        ) : isPremium ? (
          /* ===== プレミアム会員：全件クリアに表示 ===== */
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-700">診断履歴</h2>
            </div>
            <ul>
              {evaluations.map((e) => (
                <HistoryCard key={e.id} e={e} />
              ))}
            </ul>
          </div>
        ) : (
          /* ===== 無料会員：最新1件はクリア、それ以降はチラ見せ（Teaser） ===== */
          <div className="space-y-4">
            {/* 最新の1件はプレミアムと全く同じ見た目でクリアに表示 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-700">診断履歴</h2>
                <span className="text-xs text-slate-400">
                  最新の1件を表示中
                </span>
              </div>
              <ul>
                <HistoryCard e={evaluations[0]} />
              </ul>
            </div>

            {/* 2件目以降：カードは実際にレンダリングしつつ、ぼかして読めなくする。
                その上に CTA を absolute で覆いかぶせ、奥にデータがあることを匂わせる。 */}
            <div className="relative min-h-[640px] overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              {/* 奥にある（ぼやけた）履歴。aria-hidden でスクリーンリーダーからは隠す。 */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 select-none overflow-hidden bg-white opacity-50 blur-sm"
              >
                <ul>
                  {evaluations.length > 1 ? (
                    evaluations.slice(1).map((e) => <HistoryCard key={e.id} e={e} />)
                  ) : (
                    // 履歴がまだ最新1件しか無い場合は、雰囲気を出すためのダミー行を並べる。
                    [0, 1, 2].map((i) => (
                      <li
                        key={`ghost-${i}`}
                        className="flex items-start gap-4 px-6 py-4 border-b border-slate-100 last:border-0"
                      >
                        <span className="shrink-0 px-3 py-1 rounded-full text-sm font-bold border bg-slate-100 text-slate-500 border-slate-200">
                          ??
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-600">
                            ████████████████████████████
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            ████████ ・ ████████
                          </p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* グラデーションのフェード：下に行くほど白く溶け、奥行きと「続きがある」感を演出 */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent"
              />

              {/* CTA オーバーレイ：内容が隠れないよう overflow-y-auto + パディングで確保する */}
              <div className="absolute inset-0 z-10 flex items-center justify-center overflow-y-auto p-4">
                <div className="relative my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-amber-100 px-8 py-10 text-center shadow-xl">
                  {/* 装飾：右上の淡い円 */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-200/40 blur-2xl"
                  />
                  <div className="relative">
                    {/* アイコン */}
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/30">
                      <svg
                        className="h-7 w-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>

                    <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-700">
                      Premium
                    </span>

                    <h2 className="mt-4 text-xl font-bold text-slate-800 sm:text-2xl">
                      プレミアムプランで過去の履歴をすべて解放
                    </h2>

                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                      残り
                      <span className="font-bold text-amber-700">
                        {Math.max(evaluations.length - 1, 0)}件
                      </span>
                      の診断履歴がこの先に眠っています。月額500円で、これまでに採点・添削したすべてのプロンプト履歴がいつでも見返せるようになります。
                    </p>

                    {/* 価格 */}
                    <div className="mt-5 flex items-end justify-center gap-1">
                      <span className="text-3xl font-extrabold text-slate-800">
                        ¥500
                      </span>
                      <span className="mb-1 text-sm text-slate-400">/ 月</span>
                    </div>

                    {/* CTA：Stripe Payment Link。末尾に client_reference_id を付与して、
                        誰が決済したのかを Webhook 側で特定できるようにする。
                        TODO: 本番のStripe決済リンクに差し替える（現在はダミー） */}
                    <a
                      href={`https://buy.stripe.com/test_dummy?client_reference_id=${user.id}`}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-transform hover:scale-[1.02] hover:from-amber-600 hover:to-amber-700"
                    >
                      プレミアムプランに登録する（Stripeへ）
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </a>

                    <p className="mt-3 text-xs text-slate-400">
                      いつでも解約できます
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
