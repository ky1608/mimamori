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
    .select("parent_first_name, parent_name")
    .eq("id", userId)
    .single();

  // parent_first_name が登録済みならそちらを優先、なければ parent_name から推定
  const firstName = user?.parent_first_name
    ?? (user?.parent_name?.includes(" ")
        ? user.parent_name.split(" ").slice(1).join(" ").trim()
        : user?.parent_name)
    ?? "お客様";

  const systemPrompt = [
    `あなたは高齢者の話し相手です。`,
    `電話がつながったら必ず最初に`,
    `「おはようございます、${firstName}さん。今日のお体の具合はいかがですか？」`,
    `と話しかけてください。`,
    `温かく、ゆっくり、はっきり話してください。`,
  ].join("\n");

  // Grok Voice API との WebSocket 接続を指示する TwiML
  // userIdをURLとcustomParameters両方で渡す（Twilioの挙動に依らず確実に取得するため）
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${WS_SERVER_URL}/stream?userId=${encodeURIComponent(userId)}">
      <Parameter name="userId" value="${userId}" />
    </Stream>
  </Connect>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
