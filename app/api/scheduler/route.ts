import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type User = {
  id: string;
  parent_name: string;
  parent_phone: string;
  call_time: string;   // "08:00" 形式
  call_frequency: string;
};

// call_time（"08:00"）と現在時刻が±15分以内かチェック
function isCallTime(callTime: string, nowJst: Date): boolean {
  const [h, m] = callTime.split(":").map(Number);
  const scheduled = new Date(nowJst);
  scheduled.setHours(h, m, 0, 0);

  const diffMs = Math.abs(nowJst.getTime() - scheduled.getTime());
  const diffMin = diffMs / 1000 / 60;

  return diffMin <= 5; // cronが5分おきなので±5分以内でマッチ
}

// 曜日フィルタ
function shouldCallToday(frequency: string, nowJst: Date): boolean {
  const day = nowJst.getDay(); // 0=日, 1=月, ..., 6=土

  switch (frequency) {
    case "daily":
      return true;
    case "weekdays":
      return day >= 1 && day <= 5;
    case "every2days":
      // エポック日数が偶数の日のみ
      return Math.floor(nowJst.getTime() / 86400000) % 2 === 0;
    case "3days":
      return day === 1 || day === 3 || day === 5; // 月・水・金
    default:
      return true;
  }
}

// 発信時刻をランダムに±15分ずらした遅延（ms）を返す
function callDelayMs(): number {
  const jitterMin = Math.floor(Math.random() * 31) - 15; // -15〜+15
  return jitterMin * 60 * 1000;
}

async function placeCall(user: User): Promise<void> {
  // TODO: Twilio × Grok Voice API で実際の発信処理に差し替える
  console.log(`[scheduler] 📞 発信: ${user.parent_name}（${user.parent_phone}）`);

  // 将来の実装例:
  // await fetch("/api/call/initiate", {
  //   method: "POST",
  //   body: JSON.stringify({ userId: user.id, phone: user.parent_phone }),
  // });
}

export async function GET(req: NextRequest) {
  // CRON_SECRET による認証
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[scheduler] 認証失敗");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 日本時間を取得（VercelはUTC）
  const nowUtc = new Date();
  const nowJst = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);

  console.log(`[scheduler] 実行開始 JST: ${nowJst.toISOString()}`);

  // status='active' のユーザーを全件取得
  const { data: users, error } = await supabase
    .from("users")
    .select("id, parent_name, parent_phone, call_time, call_frequency")
    .eq("status", "active");

  if (error) {
    console.error("[scheduler] Supabase取得エラー:", error);
    return NextResponse.json({ error: "DB取得失敗" }, { status: 500 });
  }

  const targets: string[] = [];
  const skipped: string[] = [];

  for (const user of users as User[]) {
    // 今日発信する曜日かチェック
    if (!shouldCallToday(user.call_frequency, nowJst)) {
      skipped.push(user.parent_name);
      continue;
    }

    // 発信時刻と現在時刻が一致するかチェック
    if (!isCallTime(user.call_time, nowJst)) {
      skipped.push(user.parent_name);
      continue;
    }

    // ±15分のランダム遅延をかけて発信
    const delay = callDelayMs();
    if (delay > 0) {
      setTimeout(() => placeCall(user), delay);
      console.log(`[scheduler] ${user.parent_name}: ${Math.round(delay / 60000)}分後に発信予約`);
    } else {
      await placeCall(user);
    }

    targets.push(user.parent_name);
  }

  console.log(`[scheduler] 発信対象: ${targets.length}件 / スキップ: ${skipped.length}件`);

  return NextResponse.json({
    ok: true,
    time_jst: nowJst.toISOString(),
    called: targets,
    skipped_count: skipped.length,
  });
}
