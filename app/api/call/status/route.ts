import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://web-henna-nine-23.vercel.app";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const callStatus  = formData.get("CallStatus")  as string;
  const callSid     = formData.get("CallSid")      as string;
  const to          = formData.get("To")            as string; // 発信先番号
  const duration    = formData.get("CallDuration")  as string;

  console.log(`[call/status] SID=${callSid} status=${callStatus} duration=${duration}s to=${to}`);

  // 通話完了以外（不在・話中・失敗）は通知だけ
  if (callStatus !== "completed") {
    // 電話番号からユーザーを検索
    const { data: user } = await supabase
      .from("users")
      .select("id, parent_name, line_user_id")
      .eq("parent_phone", to)
      .single();

    if (user?.line_user_id) {
      const statusLabel: Record<string, string> = {
        "no-answer": "📵 電話に出ませんでした",
        "busy":      "📵 話し中でした",
        "failed":    "❌ 発信に失敗しました",
      };
      const message = `【mimamori】${user.parent_name}さんへの電話：${statusLabel[callStatus] ?? callStatus}`;

      await fetch(`${BASE_URL}/api/line-notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId: user.line_user_id,
          parentName: user.parent_name,
          score: "caution",
          summary: statusLabel[callStatus] ?? callStatus,
          callTime: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }),
        }),
      });

      console.log(`[call/status] 不在通知送信: ${user.parent_name}`);
    }

    return NextResponse.json({ ok: true });
  }

  // 通話完了：要約・LINE通知はws-serverが担当するためここではスキップ
  console.log(`[call/status] 通話完了 SID=${callSid} duration=${duration}s（要約はws-serverが処理）`);
  return NextResponse.json({ ok: true });
}
