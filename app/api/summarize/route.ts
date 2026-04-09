import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Score = "良い" | "普通" | "注意";

type SummarizeResult = {
  summary: string;
  score: Score;
  concern: string;
};

async function summarizeWithClaude(rawLog: string): Promise<SummarizeResult> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `以下は高齢者とAIの電話会話ログです。家族向けに以下の3点を分析してください。

【会話ログ】
${rawLog}

【出力形式】必ずJSON形式のみで返してください。説明文は不要です。
{
  "summary": "会話の要約（100文字以内・です・ます調）",
  "score": "良い または 普通 または 注意 のいずれか1つ",
  "concern": "気になるポイントがあれば記載（なければ「特になし」）"
}

【スコアの基準】
- 良い：元気で体調に問題なし
- 普通：特に問題はないが気になる点がある
- 注意：体調不良・痛み・食欲不振・睡眠障害などがある`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  // JSONのみを抽出（前後に余分なテキストがあっても対応）
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude APIのレスポンスがJSON形式ではありません");

  const result = JSON.parse(match[0]) as SummarizeResult;
  return result;
}

export async function POST(req: NextRequest) {
  let body: { userId: string; rawLog: string; calledAt?: string; callSid?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const { userId, rawLog, calledAt, callSid } = body;

  if (!userId || !rawLog) {
    return NextResponse.json({ error: "userId と rawLog は必須です" }, { status: 400 });
  }

  // ① Claude APIで要約・スコア・気になるポイントを生成
  let result: SummarizeResult;
  try {
    result = await summarizeWithClaude(rawLog);
  } catch (e) {
    console.error("[summarize] Claude API error:", e);
    return NextResponse.json({ error: "要約の生成に失敗しました" }, { status: 500 });
  }

  const { summary, score, concern } = result;
  const calledAtTs = calledAt ?? new Date().toISOString();

  // ② usersテーブルの last_conversation を更新
  const { error: userUpdateError } = await supabase
    .from("users")
    .update({ last_conversation: summary })
    .eq("id", userId);

  if (userUpdateError) {
    console.error("[summarize] users update error:", userUpdateError);
    return NextResponse.json({ error: "ユーザー情報の更新に失敗しました" }, { status: 500 });
  }

  // ③ conversationsテーブルに全履歴を保存
  const { error: insertError } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      summary,
      score,
      concern,
      raw_log: rawLog,
      called_at: calledAtTs,
      ...(callSid ? { call_sid: callSid } : {}),
    });

  if (insertError) {
    console.error("[summarize] conversations insert error:", insertError);
    return NextResponse.json({ error: "会話履歴の保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ summary, score, concern });
}
