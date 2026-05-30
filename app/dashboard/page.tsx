import { createClient } from '@supabase/supabase-js'
import DashboardClient from './DashboardClient'

type Evaluation = {
  id: string
  company_name: string
  department: string | null
  original_prompt: string
  score: number
  created_at: string
}

export const dynamic = 'force-dynamic'

type SearchParams = { company?: string }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { company: rawCompany } = await searchParams
  const company = rawCompany?.trim() || null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let query = supabase
    .from('evaluations')
    .select('*')
    .order('created_at', { ascending: false })

  if (company) {
    query = query.eq('company_name', company)
  }

  const { data, error } = await query

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold">データの取得に失敗しました</p>
          <p className="text-gray-400 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  const evaluations = (data ?? []) as Evaluation[]

  const overallAverage =
    evaluations.length > 0
      ? Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length)
      : 0

  const deptMap = new Map<string, { total: number; count: number }>()
  for (const e of evaluations) {
    const dept = e.department?.trim() || '未設定'
    const cur = deptMap.get(dept) ?? { total: 0, count: 0 }
    deptMap.set(dept, { total: cur.total + e.score, count: cur.count + 1 })
  }

  const deptAverages = Array.from(deptMap.entries())
    .map(([department, { total, count }]) => ({
      department,
      average: Math.round(total / count),
      count,
    }))
    .sort((a, b) => b.average - a.average)

  return (
    <DashboardClient
      overallAverage={overallAverage}
      totalCount={evaluations.length}
      deptAverages={deptAverages}
      recentEvaluations={evaluations.slice(0, 20)}
    />
  )
}
