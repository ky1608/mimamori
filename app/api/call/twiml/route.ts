import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WS_SERVER_URL = "wss://mimamori-ws-server-production.up.railway.app";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? "";

  // 前回の会話メモ・同意状態を取得（エラー時は空文字で続行）
  let lastConversation = "";
  let consentFlow = false;
  try {
    const { data: user } = await supabase
      .from("users")
      .select("last_conversation, consent_service")
      .eq("id", userId)
      .single();
    const raw = user?.last_conversation ?? "";
    // 200文字に切り詰め
    lastConversation = raw.length > 200 ? raw.slice(0, 200) : raw;
    consentFlow = user?.consent_service !== true;
  } catch (e) {
    console.error("[twiml] Supabase取得エラー（無視して続行）:", e);
  }

  const streamQs = new URLSearchParams({
    userId,
    consentFlow: consentFlow ? "1" : "0",
  });

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${WS_SERVER_URL}/stream?${streamQs.toString()}">
      <Parameter name="userId" value="${userId}" />
      <Parameter name="consentFlow" value="${consentFlow ? "1" : "0"}" />
      <Parameter name="lastConversation" value="${lastConversation.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}" />
    </Stream>
  </Connect>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
