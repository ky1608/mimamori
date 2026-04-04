import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// サーバーサイドのSupabaseクライアント（サービスロールキーがあれば理想だがここはanonキーで対応）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId が必要です" }, { status: 400 });
  }

  const code = generateCode();

  const { error } = await supabase
    .from("users")
    .update({ line_link_code: code })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ code });
}
