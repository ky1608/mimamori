import { NextRequest, NextResponse } from "next/server";

type Score = "good" | "normal" | "caution";

type RequestBody = {
  lineUserId: string;   // 送信先のLINEユーザーID
  parentName: string;
  score: Score;
  summary: string;
  callTime: string;     // "08:02" など
};

const SCORE_LABEL: Record<Score, string> = {
  good:    "✅ 良い",
  normal:  "🟡 普通",
  caution: "⚠️ 注意",
};

function buildMessage(body: RequestBody): string {
  const { parentName, score, summary, callTime } = body;
  return [
    `【mimamori】${parentName}さんの今日の様子をお届けします`,
    ``,
    `📞 電話時刻：${callTime}`,
    `💊 体調スコア：${SCORE_LABEL[score]}`,
    ``,
    `📝 会話の要約`,
    summary,
    ``,
    `─────────────────`,
    `詳細はダッシュボードでご確認ください。`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "LINE_CHANNEL_ACCESS_TOKEN が設定されていません" },
      { status: 500 }
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const { lineUserId, parentName, score, summary, callTime } = body;

  if (!lineUserId || !parentName || !score || !summary || !callTime) {
    return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
  }

  if (!["good", "normal", "caution"].includes(score)) {
    return NextResponse.json({ error: "score は good / normal / caution のいずれかです" }, { status: 400 });
  }

  const message = buildMessage(body);

  const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    }),
  });

  if (!lineRes.ok) {
    const error = await lineRes.json();
    return NextResponse.json(
      { error: "LINE送信に失敗しました", detail: error },
      { status: lineRes.status }
    );
  }

  return NextResponse.json({ success: true });
}
