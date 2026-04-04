import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://web-henna-nine-23.vercel.app";

export async function POST(req: NextRequest) {
  let body: { userId: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const { userId } = body;
  if (!userId) {
    return NextResponse.json({ error: "userId は必須です" }, { status: 400 });
  }

  // ユーザー情報を取得
  const { data: user, error } = await supabase
    .from("users")
    .select("parent_name, parent_phone, conditions, family_info, last_conversation")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  console.log(`[call] 発信開始: ${user.parent_name}（${user.parent_phone}）`);

  try {
    const call = await twilioClient.calls.create({
      to: user.parent_phone,
      from: process.env.TWILIO_PHONE_NUMBER!,
      // 電話がつながったときのTwiML URLにuserIdを渡す
      url: `${BASE_URL}/api/call/twiml?userId=${userId}`,
      // 通話終了時のステータスコールバック
      statusCallback: `${BASE_URL}/api/call/status`,
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["completed", "no-answer", "busy", "failed"],
    });

    console.log(`[call] Twilio SID: ${call.sid}`);
    return NextResponse.json({ ok: true, callSid: call.sid });
  } catch (e) {
    console.error("[call] Twilio発信エラー:", e);
    return NextResponse.json({ error: "発信に失敗しました" }, { status: 500 });
  }
}
