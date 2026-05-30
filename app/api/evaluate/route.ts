import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `あなたはAIプロンプトの専門家です。
ユーザーが入力したプロンプトを評価し、必ず以下のJSONフォーマットのみで返してください。
他のテキストは一切含めず、JSONだけを返してください。

{
  "score": <0から100の整数>,
  "good_points": ["良かった点1", "良かった点2", ...],
  "bad_points": ["改善点1", "改善点2", ...],
  "improved_prompt": "100点満点の改善版プロンプト"
}

採点基準:
- 明確さ・具体性 (25点): 指示が明確で具体的か
- 文脈・背景情報 (25点): 必要な文脈や制約が含まれているか
- 出力形式の指定 (25点): 期待する出力形式やスタイルが指定されているか
- 完結性・適切さ (25点): プロンプトとして完結しており適切か

Do not include any markdown formatting like \`\`\`json or \`\`\`. Output ONLY the raw JSON object.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, company_name, department } = body;

    console.log("[evaluate] Received request:", {
      company_name,
      department,
      promptLength: typeof prompt === "string" ? prompt.length : null,
    });

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json(
        { error: "プロンプトを入力してください" },
        { status: 400 }
      );
    }

    if (!company_name || typeof company_name !== "string" || company_name.trim() === "") {
      return NextResponse.json(
        { error: "会社名を入力してください" },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `以下のプロンプトを採点してください:\n\n${prompt}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const rawText = content.text;
    console.log("=== RAW AI RESPONSE ===", rawText);

    let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = cleanText.match(/\{[\s\S]*\}/);
    if (match) {
      cleanText = match[0];
    }

    let result: { score: number; good_points: string[]; bad_points: string[]; improved_prompt: string };
    try {
      result = JSON.parse(cleanText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON", raw: rawText }, { status: 500 });
    }

    if (
      typeof result.score !== "number" ||
      !Array.isArray(result.good_points) ||
      !Array.isArray(result.bad_points) ||
      typeof result.improved_prompt !== "string"
    ) {
      throw new Error("Invalid response structure");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const insertData = {
      id: crypto.randomUUID(),
      company_name: company_name.trim(),
      department: (department as string | undefined)?.trim() || null,
      original_prompt: prompt.trim(),
      score: result.score,
      created_at: new Date().toISOString(),
    };

    console.log("[evaluate] Inserting to Supabase:", insertData);

    const { error: supabaseError } = await supabase
      .from("evaluations")
      .insert(insertData);

    if (supabaseError) {
      console.error("[evaluate] Supabase insert error:", supabaseError);
      throw new Error(supabaseError.message);
    }

    console.log("[evaluate] Supabase insert successful");

    // ── 5件到達チェック ──────────────────────────────────────────
    const { count, error: countError } = await supabase
      .from("evaluations")
      .select("*", { count: "exact", head: true })
      .eq("company_name", insertData.company_name);

    if (countError) {
      console.error("[evaluate] Count query error:", countError);
    } else if (count === 5) {
      // TODO: ここにメール自動送信処理を追加する
      const dashboardUrl = `http://localhost:3000/dashboard?company=${encodeURIComponent(insertData.company_name)}`;
      console.log("=".repeat(60));
      console.log(`🎉 ALERT: ${insertData.company_name} の診断が5件に達しました！専用ダッシュボードURL: ${dashboardUrl}`);
      console.log("=".repeat(60));
    }
    // ────────────────────────────────────────────────────────────

    return NextResponse.json(result);
  } catch (error) {
    console.error("[evaluate] Error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "採点中にエラーが発生しました。もう一度お試しください。",
      },
      { status: 500 }
    );
  }
}
