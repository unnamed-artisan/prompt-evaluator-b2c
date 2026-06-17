"use client";

import { useState } from "react";

export type Evaluation = {
  id: string;
  original_prompt: string;
  score: number;
  created_at: string;
  // 後から追加されたカラム。古いレコードでは null になり得る。
  improved_prompt: string | null;
  feedback: string | null;
};

function scoreBadgeClass(score: number) {
  if (score >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (score >= 60) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

type ParsedFeedback = {
  good_points: string[];
  bad_points: string[];
  // JSON でなかった場合のプレーンテキスト退避先。
  text: string | null;
};

// feedback カラムは JSON（{good_points, bad_points}）で保存される想定だが、
// 過去データや想定外の値にも耐えられるよう安全にパースする。
function parseFeedback(raw: string | null): ParsedFeedback {
  if (!raw) return { good_points: [], bad_points: [], text: null };
  try {
    const o = JSON.parse(raw);
    if (o && typeof o === "object" && ("good_points" in o || "bad_points" in o)) {
      return {
        good_points: Array.isArray(o.good_points) ? o.good_points : [],
        bad_points: Array.isArray(o.bad_points) ? o.bad_points : [],
        text: null,
      };
    }
  } catch {
    // JSON ではない → プレーンテキストとして扱う。
  }
  return { good_points: [], bad_points: [], text: raw };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // クリップボード API が使えない環境向けのフォールバック。
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
      >
        {copied ? (
          <span className="text-emerald-600 font-semibold">✓ コピーしました</span>
        ) : (
          <>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            クリップボードにコピー
          </>
        )}
      </button>

      {/* コピー成功トースト */}
      {copied && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-xl"
        >
          <svg
            className="h-4 w-4 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          添削後プロンプトをコピーしました
        </div>
      )}
    </>
  );
}

export default function HistoryCard({ e }: { e: Evaluation }) {
  const [open, setOpen] = useState(false);
  const feedback = parseFeedback(e.feedback);
  const hasReport =
    !!e.improved_prompt ||
    feedback.good_points.length > 0 ||
    feedback.bad_points.length > 0 ||
    !!feedback.text;

  return (
    <li className="border-b border-slate-100 last:border-0">
      {/* カード本体 */}
      <div className="flex items-start gap-4 px-6 py-4">
        <span
          className={`shrink-0 px-3 py-1 rounded-full text-sm font-bold border ${scoreBadgeClass(
            e.score
          )}`}
        >
          {e.score}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-700 line-clamp-2 break-words">
            {e.original_prompt}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {new Date(e.created_at).toLocaleString("ja-JP")}
          </p>

          {/* アコーディオン開閉トグル */}
          {hasReport && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              {open ? "添削レポートを閉じる" : "添削レポートを表示"}
            </button>
          )}
        </div>
      </div>

      {/* 詳細：添削後プロンプト ＋ フィードバック */}
      {hasReport && open && (
        <div className="space-y-4 bg-slate-50/70 px-6 py-5 border-t border-slate-100">
          {/* 添削後プロンプト */}
          {e.improved_prompt && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900">
                  添削後プロンプト（100点モデル）
                </h3>
                <CopyButton text={e.improved_prompt} />
              </div>
              <div className="rounded border border-slate-200 bg-white p-4">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-700">
                  {e.improved_prompt}
                </pre>
              </div>
            </div>
          )}

          {/* フィードバック */}
          {feedback.text ? (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                フィードバック
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {feedback.text}
              </p>
            </div>
          ) : (
            <>
              {feedback.good_points.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                    強みの分析
                  </h3>
                  <ul className="space-y-1.5">
                    {feedback.good_points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                          {i + 1}
                        </span>
                        <span className="text-sm leading-relaxed text-slate-700">
                          {p}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.bad_points.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                    具体的改善案
                  </h3>
                  <ul className="space-y-1.5">
                    {feedback.bad_points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                          {i + 1}
                        </span>
                        <span className="text-sm leading-relaxed text-slate-700">
                          {p}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}
