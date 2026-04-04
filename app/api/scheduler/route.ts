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

// call_time（"08:00"）まで何ミリ秒後かを返す（過去の場合は0）
function msUntilCallTime(callTime: string, nowJst: Date): number {
  const [h, m] = callTime.split(":").map(Number);
  const scheduled = new Date(nowJst);
  scheduled.setHours(h, m, 0, 0);

  const diff = scheduled.getTime() - nowJst.getTime();
  return Math.max(diff, 0);
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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://web-henna-nine-23.vercel.app";

async function placeCall(user: User): Promise<void> {
  console.log(`[scheduler] 📞 発信: ${user.parent_name}（${user.parent_phone}）`);

  const res = await fetch(`${BASE_URL}/api/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error(`[scheduler] 発信失敗 ${user.parent_name}:`, err);
  }
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

    // call_time までの待機時間 + ±15分のランダムジッター
    const baseDelay = msUntilCallTime(user.call_time, nowJst);
    const jitter = callDelayMs();
    const totalDelay = Math.max(baseDelay + jitter, 0);

    setTimeout(() => placeCall(user), totalDelay);
    console.log(`[scheduler] ${user.parent_name}: ${Math.round(totalDelay / 60000)}分後に発信予約（call_time: ${user.call_time}）`);

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
