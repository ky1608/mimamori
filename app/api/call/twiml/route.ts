import { NextRequest, NextResponse } from "next/server";

const WS_SERVER_URL = "wss://mimamori-ws-server-production.up.railway.app";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? "";

  // TODO: last_conversationの取得・渡す処理は一時的にコメントアウト
  // const { data: user } = await supabase.from("users").select("last_conversation").eq("id", userId).single();
  // const lastConversation = user?.last_conversation ?? "";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${WS_SERVER_URL}/stream?userId=${encodeURIComponent(userId)}" />
  </Connect>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
