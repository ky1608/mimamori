import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// LINE Webhook の署名検証
function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET!;
  const hash = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "署名が不正です" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const events = body.events ?? [];

  for (const event of events) {
    // テキストメッセージのみ処理
    if (event.type !== "message" || event.message.type !== "text") continue;

    const lineUserId: string = event.source.userId;
    const text: string = event.message.text.trim();

    // 6桁の数字かチェック
    if (!/^\d{6}$/.test(text)) continue;

    // 連携コードでユーザーを検索
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("line_link_code", text)
      .single();

    if (!user) continue;

    // line_user_id を保存してコードをクリア
    await supabase
      .from("users")
      .update({ line_user_id: lineUserId, line_link_code: null })
      .eq("id", user.id);

    // 連携完了メッセージを返信
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: "✅ LINE連携が完了しました！\n\nこれから毎日、ご両親の様子をここでお届けします。",
          },
        ],
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
