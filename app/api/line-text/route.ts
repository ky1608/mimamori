import { NextRequest, NextResponse } from "next/server";

/**
 * 定型外の短文を LINE に送る（同意結果通知など）。
 */
export async function POST(req: NextRequest) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "LINE_CHANNEL_ACCESS_TOKEN が設定されていません" },
      { status: 500 },
    );
  }

  let body: { lineUserId: string; text: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const { lineUserId, text } = body;
  if (!lineUserId || !text) {
    return NextResponse.json(
      { error: "lineUserId と text は必須です" },
      { status: 400 },
    );
  }

  const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text }],
    }),
  });

  if (!lineRes.ok) {
    const detail = await lineRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: "LINE送信に失敗しました", detail },
      { status: lineRes.status },
    );
  }

  return NextResponse.json({ success: true });
}
