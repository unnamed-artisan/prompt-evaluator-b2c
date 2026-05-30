'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type DeptAverage = {
  department: string
  average: number
  count: number
}

type Evaluation = {
  id: string
  company_name: string
  department: string | null
  original_prompt: string
  score: number
  created_at: string
}

type Props = {
  overallAverage: number
  totalCount: number
  deptAverages: DeptAverage[]
  recentEvaluations: Evaluation[]
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score)
  return (
    <span
      style={{
        backgroundColor: color + '1a',
        color,
        border: `1px solid ${color}4d`,
      }}
      className="inline-block px-2.5 py-0.5 rounded-full text-sm font-bold"
    >
      {score}
    </span>
  )
}

function ScoreLabel({ score }: { score: number }) {
  if (score >= 80) return '優秀'
  if (score >= 60) return '標準的'
  return '要改善'
}

export default function DashboardClient({
  overallAverage,
  totalCount,
  deptAverages,
  recentEvaluations,
}: Props) {
  const reportDate = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#1e3a5f' }} className="shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">
                AIリテラシー診断 - 法人向けレポート
              </h1>
              <p className="text-xs" style={{ color: '#93c5fd' }}>
                Human Resources &amp; Admin Dashboard
              </p>
            </div>
          </div>
          <div className="text-sm" style={{ color: '#93c5fd' }}>
            {reportDate} 時点
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Overall average — large display */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              会社全体の平均スコア
            </p>
            <div
              className="text-8xl font-extrabold leading-none mb-2"
              style={{ color: scoreColor(overallAverage) }}
            >
              {totalCount === 0 ? '—' : overallAverage}
            </div>
            <p className="text-sm text-gray-400 mb-3">/ 100点満点</p>
            {totalCount > 0 && (
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: scoreColor(overallAverage) + '1a',
                  color: scoreColor(overallAverage),
                }}
              >
                <ScoreLabel score={overallAverage} />
              </span>
            )}
          </div>

          {/* Total count */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              総診断回数
            </p>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-extrabold text-gray-800">{totalCount}</span>
              <span className="text-lg text-gray-400 mb-1">件</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">累計データ数</p>
          </div>

          {/* Department count */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              参加部署数
            </p>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-extrabold text-gray-800">{deptAverages.length}</span>
              <span className="text-lg text-gray-400 mb-1">部署</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">診断実施済み</p>
          </div>
        </div>

        {/* Department bar chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
              部署別 平均スコア
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              各部署のAIリテラシーレベルの比較
            </p>
          </div>

          {deptAverages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">データがありません</p>
            </div>
          ) : (
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptAverages}
                  margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      backgroundColor: '#1e3a5f',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    labelStyle={{ color: '#93c5fd', fontSize: '11px', marginBottom: '2px' }}
                    itemStyle={{ color: 'white', fontSize: '13px' }}
                    formatter={(value) => [`${value}点`, '平均スコア']}
                  />
                  <Bar dataKey="average" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {deptAverages.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={scoreColor(entry.average)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent evaluations table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
              最近の診断結果
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              直近 {recentEvaluations.length} 件
            </p>
          </div>

          {recentEvaluations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-gray-300">
              <p className="text-sm">データがありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['日時', '会社名', '部署', 'プロンプト（抜粋）', 'スコア'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider py-2 pr-4 last:text-right last:pr-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentEvaluations.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-50 transition-colors"
                      style={{ borderBottom: '1px solid #f8fafc' }}
                    >
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(e.created_at).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-800 whitespace-nowrap">
                        {e.company_name}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                        {e.department || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 max-w-xs">
                        <span className="block truncate" title={e.original_prompt}>
                          {e.original_prompt}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <ScoreBadge score={e.score} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          AIリテラシー診断システム &copy; {new Date().getFullYear()} — 法人向け管理画面
        </p>
      </main>
    </div>
  )
}
