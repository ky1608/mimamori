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

  // ユーザー情報と前回の会話メモを取得
  const { data: user } = await supabase
    .from("users")
    .select("parent_first_name, parent_name, last_conversation")
    .eq("id", userId)
    .single();

  const lastConversation = user?.last_conversation ?? "";

  // userIdとlast_conversationをURLパラメータで渡す
  const streamUrl = `${WS_SERVER_URL}/stream?userId=${encodeURIComponent(userId)}&lastConversation=${encodeURIComponent(lastConversation)}`;

  // Grok Voice API との WebSocket 接続を指示する TwiML
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="userId" value="${userId}" />
      <Parameter name="lastConversation" value="${lastConversation.replace(/"/g, "&quot;")}" />
    </Stream>
  </Connect>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
