"use client";

import { useState } from "react";
import { Keyboard, Zap, BarChart3 } from "lucide-react";

interface EvaluationResult {
  score: number;
  good_points: string[];
  bad_points: string[];
  improved_prompt: string;
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  const strokeColor =
    score >= 80 ? "#059669" : score >= 60 ? "#d97706" : "#dc2626";
  const label =
    score >= 80 ? "優秀" : score >= 60 ? "良好" : score >= 40 ? "要改善" : "要大幅改善";
  const badgeClass =
    score >= 80
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : score >= 60
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-red-100 text-red-800 border-red-200";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width="160" height="160" className="transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-slate-800">{score}</span>
          <span className="text-sm text-slate-500">/ 100点</span>
        </div>
      </div>
      <span
        className={`px-4 py-1.5 rounded-full text-sm font-bold border ${badgeClass}`}
      >
        {label}
      </span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
    >
      {copied ? (
        <span className="text-emerald-600 font-medium">✓ コピー済み</span>
      ) : (
        <span>コピー</span>
      )}
    </button>
  );
}

function SectionCard({
  title,
  icon,
  headerClass,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  headerClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className={`px-6 py-4 border-b border-slate-100 ${headerClass}`}>
        <h2 className="flex items-center gap-2.5 text-base font-bold">
          {icon}
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reportDate = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "エラーが発生しました");
        return;
      }

      setResult(data);
    } catch {
      setError("ネットワークエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 公式ヘッダー */}
      <header style={{ backgroundColor: "#1e3a5f" }} className="text-white shadow-md">
        <div className="max-w-5xl mx-auto px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div>
            <p
              className="text-xs uppercase tracking-widest font-medium mb-1"
              style={{ color: "#93c5fd" }}
            >
              Prompt Diagnosis
            </p>
            <h1 className="text-xl font-bold leading-tight">
              AIプロンプト診断
              <span
                className="ml-3 font-normal text-base"
                style={{ color: "#93c5fd" }}
              >
                — あなたの指示文、何点？
              </span>
            </h1>
          </div>
          <button
            disabled
            title="この機能は準備中です"
            className="flex items-center gap-2 px-4 py-2.5 rounded border text-sm font-medium cursor-not-allowed shrink-0"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderColor: "rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            レポートをPDFで出力（準備中）
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">
        {/* 使い方ガイド */}
        <div className="mb-10">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6">
            How it works — 3ステップで使える
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="relative bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#e0f2fe" }}
                >
                  <Keyboard className="w-5 h-5" style={{ color: "#0369a1" }} />
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#0369a1" }}
                >
                  Step 1
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1.5">
                  プロンプトを入力
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  普段AIに使っている指示文をそのまま貼り付けるだけ。コピー&ペーストで即スタートできます。
                </p>
              </div>
              <div className="hidden md:block absolute -right-px top-1/2 -translate-y-1/2 w-px h-12 bg-slate-200" />
            </div>

            {/* Step 2 */}
            <div className="relative bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#fef3c7" }}
                >
                  <Zap className="w-5 h-5" style={{ color: "#d97706" }} />
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#d97706" }}
                >
                  Step 2
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1.5">
                  AIが瞬時に分析
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  独自の評価基準に基づき、あなたのプロンプトを100点満点で採点。弱点を即座に特定します。
                </p>
              </div>
              <div className="hidden md:block absolute -right-px top-1/2 -translate-y-1/2 w-px h-12 bg-slate-200" />
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#d1fae5" }}
                >
                  <BarChart3 className="w-5 h-5" style={{ color: "#059669" }} />
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#059669" }}
                >
                  Step 3
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1.5">
                  レポートで改善
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  強みと弱みを把握し、100点の改善版プロンプトをそのままコピーして使えます。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 入力セクション */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-700">
              プロンプトを診断する
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              普段あなたがAIに送っているプロンプトを貼り付けてください。すぐに診断レポートをお届けします。
            </p>
          </div>
          <div className="p-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例: 「メールを書いて」「要約して」など、ChatGPTやClaudeに送るプロンプトをそのまま入力してください..."
              rows={6}
              className="w-full px-4 py-3 rounded border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-slate-800 placeholder-slate-400 text-sm leading-relaxed transition-colors"
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-slate-400">{prompt.length} 文字</span>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-2 px-7 py-2.5 text-white font-semibold rounded text-sm transition-colors shadow-sm disabled:cursor-not-allowed"
                style={{
                  backgroundColor:
                    isLoading || !prompt.trim() ? "#cbd5e1" : "#1e3a5f",
                }}
              >
                {isLoading ? (
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
                    診断中...
                  </>
                ) : (
                  "診断を開始する"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* エラー */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* ローディング */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-14 text-center">
            <div className="flex flex-col items-center gap-4">
              <svg
                className="animate-spin w-10 h-10"
                style={{ color: "#1e3a5f" }}
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
              <p className="text-slate-600 font-medium">診断レポートを生成中...</p>
              <p className="text-slate-400 text-sm">
                AIがプロンプトを詳細に分析しています
              </p>
            </div>
          </div>
        )}

        {/* 診断結果 */}
        {result && !isLoading && (
          <div className="space-y-5">
            {/* レポートメタ情報バナー */}
            <div
              className="text-white rounded-lg px-6 py-4 flex items-center justify-between"
              style={{ backgroundColor: "#1e3a5f" }}
            >
              <div>
                <p
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{ color: "#93c5fd" }}
                >
                  診断完了
                </p>
                <p className="font-bold text-lg">プロンプト診断レポート</p>
              </div>
              <div className="text-right text-sm" style={{ color: "#93c5fd" }}>
                <p>診断日時: {reportDate}</p>
                <p className="text-xs mt-0.5" style={{ color: "#bfdbfe" }}>
                  本レポートはAIによる自動診断結果です
                </p>
              </div>
            </div>

            {/* 総合評価 */}
            <SectionCard
              title="総合評価"
              headerClass="bg-slate-50 text-slate-700"
              icon={
                <svg
                  className="w-5 h-5"
                  style={{ color: "#1e3a5f" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
            >
              <div className="flex flex-col md:flex-row items-center gap-10">
                <ScoreGauge score={result.score} />
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    総合スコア
                  </h3>
                  <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-700"
                      style={{
                        width: `${result.score}%`,
                        backgroundColor:
                          result.score >= 80
                            ? "#059669"
                            : result.score >= 60
                            ? "#d97706"
                            : "#dc2626",
                      }}
                    />
                  </div>
                  <p className="text-sm text-slate-600 leading-7">
                    {result.score >= 80
                      ? "とても上手にAIを使いこなせています！プロンプトの構造・目的・背景情報がしっかり含まれていて、AIの回答品質を最大限に引き出せています。"
                      : result.score >= 60
                      ? "なかなか良いプロンプトです。あと少し指示を明確にしたり背景情報を足したりすると、回答の質がもっと上がりますよ。"
                      : result.score >= 40
                      ? "伸びしろたっぷりのプロンプトです。目的・条件・ほしいアウトプットの形式を書き加えるだけで、グッと良くなります。"
                      : "まずは基本からいきましょう。「具体的改善案」を参考に、少しずつプロンプトのコツをつかんでいきましょう。"}
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* 強みの分析 */}
            <SectionCard
              title="強みの分析"
              headerClass="bg-emerald-50 text-emerald-800"
              icon={
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            >
              {result.good_points.length > 0 ? (
                <ul className="space-y-1">
                  {result.good_points.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-slate-700 text-sm leading-relaxed">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm py-2">
                  特筆すべき強みは確認されませんでした。
                </p>
              )}
            </SectionCard>

            {/* 具体的改善案 */}
            <SectionCard
              title="具体的改善案"
              headerClass="bg-amber-50 text-amber-800"
              icon={
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            >
              {result.bad_points.length > 0 ? (
                <ul className="space-y-1">
                  {result.bad_points.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-slate-700 text-sm leading-relaxed">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm py-2">
                  改善が必要な項目は確認されませんでした。
                </p>
              )}
            </SectionCard>

            {/* 推奨プロンプト */}
            <SectionCard
              title="推奨プロンプト（100点モデル）"
              headerClass="bg-blue-50 text-blue-900"
              icon={
                <svg
                  className="w-5 h-5"
                  style={{ color: "#1e3a5f" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              }
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500">
                  本診断に基づき最適化された改善版プロンプトです
                </p>
                <CopyButton text={result.improved_prompt} />
              </div>
              <div className="bg-slate-50 rounded border border-slate-200 p-4">
                <pre className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed font-sans">
                  {result.improved_prompt}
                </pre>
              </div>
            </SectionCard>

            {/* フッター */}
            <div className="text-center py-5 border-t border-slate-200">
              <p className="text-xs text-slate-400 mb-4">
                本レポートはAIによる自動生成です。あなたのプロンプトスキルアップや自己研鑽にぜひお役立てください。
              </p>
              <button
                onClick={() => {
                  setResult(null);
                  setPrompt("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-slate-400 hover:text-slate-600 text-sm underline transition-colors"
              >
                別のプロンプトを診断する
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
