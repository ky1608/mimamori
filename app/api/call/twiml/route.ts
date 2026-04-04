import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WS_SERVER_URL = process.env.WS_SERVER_URL ?? "wss://your-ws-server.railway.app";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? "";

  // ユーザー情報を取得してsystem promptを構築
  const { data: user } = await supabase
    .from("users")
    .select("parent_name, conditions, family_info, last_conversation")
    .eq("id", userId)
    .single();

  const parentName     = user?.parent_name     ?? "お客様";
  const conditions     = user?.conditions      ?? "特になし";
  const familyInfo     = user?.family_info     ?? "特になし";
  const lastConversation = user?.last_conversation ?? "初回のお電話です";

  const systemPrompt = [
    `あなたは${parentName}さんの話し相手です。`,
    `毎朝電話して体調を確認する、温かく親しみやすいアシスタントです。`,
    ``,
    `【${parentName}さんについて】`,
    `・持病・気になること：${conditions}`,
    `・家族情報：${familyInfo}`,
    `・前回の会話：${lastConversation}`,
    ``,
    `【会話のルール】`,
    `・最初に「おはようございます、${parentName}さん。今日のご様子はいかがですか？」と挨拶する`,
    `・体調・睡眠・食欲・痛みを自然な会話の中で確認する`,
    `・前回の話題を踏まえて自然につなげる`,
    `・5〜8分程度で終わらせる`,
    `・日本語のみで話す`,
  ].join("\n");

  // Grok Voice API との WebSocket 接続を指示する TwiML
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${WS_SERVER_URL}/stream">
      <Parameter name="userId" value="${userId}" />
      <Parameter name="systemPrompt" value="${encodeURIComponent(systemPrompt)}" />
    </Stream>
  </Connect>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
