import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://web-henna-nine-23.vercel.app";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function recordingCallbackUrl(userId: string, consentFlow: boolean): string {
  const u = new URL(`${BASE_URL}/api/call/recording`);
  u.searchParams.set("userId", userId);
  u.searchParams.set("consentFlow", consentFlow ? "1" : "0");
  return u.toString();
}

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
    .select("parent_name, parent_phone, conditions, family_info, last_conversation, consent_service")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  // 日本の電話番号を E.164 形式に変換（例: 08012345678 → +818012345678）
  const toE164 = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return "+81" + digits.slice(1);
    if (digits.startsWith("81")) return "+" + digits;
    return "+" + digits;
  };
  const toPhone = toE164(user.parent_phone);

  const needsConsentCall = user.consent_service !== true;
  console.log(
    `[call] 発信開始: ${user.parent_name}（${toPhone}） consentFlow=${needsConsentCall}`,
  );

  try {
    const call = await twilioClient.calls.create({
      to: toPhone,
      from: process.env.TWILIO_PHONE_NUMBER!,
      // 電話がつながったときのTwiML URLにuserIdを渡す
      url: `${BASE_URL}/api/call/twiml?userId=${userId}`,
      // 通話録音（同意取得時は録音URLを保存）
      record: true,
      recordingStatusCallback: recordingCallbackUrl(userId, needsConsentCall),
      recordingStatusCallbackMethod: "POST",
      recordingStatusCallbackEvent: ["completed"],
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
