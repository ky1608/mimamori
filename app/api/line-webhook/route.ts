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

// LINE の接続確認用 GET リクエストに応答
export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  console.log("[line-webhook] received body:", rawBody);
  console.log("[line-webhook] signature:", signature);

  // TODO: 本番前に署名検証を有効化する
  // if (!verifySignature(rawBody, signature)) {
  //   console.error("[line-webhook] 署名検証失敗");
  //   return NextResponse.json({ error: "署名が不正です" }, { status: 401 });
  // }

  const body = JSON.parse(rawBody);
  const events = body.events ?? [];

  // LINEの接続確認（eventsが空の場合）
  if (events.length === 0) {
    console.log("[line-webhook] 接続確認リクエスト（events空）");
    return NextResponse.json({ ok: true });
  }

  for (const event of events) {
    console.log("[line-webhook] event type:", event.type);

    // テキストメッセージのみ処理
    if (event.type !== "message" || event.message.type !== "text") continue;

    const lineUserId: string = event.source.userId;
    const text: string = event.message.text.trim();

    console.log("[line-webhook] received text:", text, "from:", lineUserId);

    // 6桁の数字かチェック
    if (!/^\d{6}$/.test(text)) {
      console.log("[line-webhook] 6桁コードではないためスキップ");
      continue;
    }

    // 連携コードでユーザーを検索
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("line_link_code", text)
      .single();

    console.log("[line-webhook] user found:", user, "error:", findError);

    if (!user) continue;

    // line_user_id を保存してコードをクリア
    const { error: updateError } = await supabase
      .from("users")
      .update({ line_user_id: lineUserId, line_link_code: null })
      .eq("id", user.id);

    console.log("[line-webhook] update error:", updateError);

    // 連携完了メッセージを返信
    const replyRes = await fetch("https://api.line.me/v2/bot/message/reply", {
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

    console.log("[line-webhook] reply status:", replyRes.status);
  }

  return NextResponse.json({ ok: true });
}
