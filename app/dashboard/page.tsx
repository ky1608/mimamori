"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  parent_name: string;
  parent_age: number;
  call_time: string;
  last_conversation: string | null;
  line_user_id: string | null;
};

type Report = {
  id: string;
  date: string;
  score: "good" | "normal" | "caution";
  summary: string;
  call_time: string;
};

// ダミーレポート（reports テーブル実装前のプレースホルダー）
const dummyReports: Report[] = [
  {
    id: "1",
    date: "2026-04-04",
    score: "good",
    summary: "今日はとても元気そうでした。朝ごはんもしっかり食べたとのことで、足の調子も良いとおっしゃっていました。",
    call_time: "08:02",
  },
  {
    id: "2",
    date: "2026-04-03",
    score: "normal",
    summary: "昨夜は少し眠れなかったようです。体調自体は問題ないとのことでしたが、疲れ気味とのこと。",
    call_time: "08:05",
  },
  {
    id: "3",
    date: "2026-04-02",
    score: "good",
    summary: "天気が良くて散歩に行ったとのこと。気分も良さそうで、お孫さんの話を楽しそうにされていました。",
    call_time: "08:01",
  },
  {
    id: "4",
    date: "2026-04-01",
    score: "caution",
    summary: "頭が少し重いとおっしゃっていました。熱はないようですが、水分をあまり取れていないとのことです。",
    call_time: "08:03",
  },
  {
    id: "5",
    date: "2026-03-31",
    score: "good",
    summary: "元気そうでした。昨日作ったという煮物の話をしてくれました。食欲もあり、よく眠れているとのこと。",
    call_time: "08:00",
  },
];

const scoreBadge = (score: Report["score"]) => {
  switch (score) {
    case "good":
      return (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
          ● 良い
        </span>
      );
    case "normal":
      return (
        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
          ● 普通
        </span>
      );
    case "caution":
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
          ● 注意
        </span>
      );
  }
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日（${"日月火水木金土"[d.getDay()]}）`;
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get("payment") === "success";
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.replace("/register");
        return;
      }
      const { data } = await supabase
        .from("users")
        .select("id, parent_name, parent_age, call_time, last_conversation, line_user_id")
        .eq("id", authUser.id)
        .single();

      if (!data) {
        router.replace("/register");
        return;
      }
      setUser(data);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const handleLineLink = async () => {
    if (!user) return;
    setLinkLoading(true);
    const res = await fetch("/api/line-link-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    setLinkCode(data.code);
    setLinkLoading(false);

    // 連携完了をポーリング（30秒間、3秒おき）
    const interval = setInterval(async () => {
      const { data: updated } = await supabase
        .from("users")
        .select("line_user_id")
        .eq("id", user.id)
        .single();
      if (updated?.line_user_id) {
        setUser((prev) => prev ? { ...prev, line_user_id: updated.line_user_id } : prev);
        setLinkCode(null);
        clearInterval(interval);
      }
    }, 3000);
    setTimeout(() => clearInterval(interval), 30000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  const today = dummyReports[0];
  const past = dummyReports.slice(1);

  return (
    <div className="min-h-screen bg-[#FFFDF9] font-sans">

      {/* 1. ヘッダー */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-orange-500">mimamori</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-6">

        {/* 決済完了バナー */}
        {paymentSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold text-green-800 text-sm">ご登録ありがとうございます！</p>
              <p className="text-green-600 text-xs mt-0.5">決済が完了しました。翌朝から見守り電話がスタートします。</p>
            </div>
          </div>
        )}

        {/* 2. 今日のレポートカード */}
        <section>
          <p className="text-xs text-gray-400 font-medium mb-3 tracking-widest uppercase">Today's Report</p>
          <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {user?.parent_name}さんの今日の様子
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">電話時刻：{today.call_time}</p>
              </div>
              {scoreBadge(today.score)}
            </div>
            <div className="bg-orange-50 rounded-2xl p-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {user?.last_conversation ?? today.summary}
              </p>
            </div>
          </div>
        </section>

        {/* 3. 過去のレポート一覧 */}
        <section>
          <p className="text-xs text-gray-400 font-medium mb-3 tracking-widest uppercase">Recent Reports</p>
          <div className="space-y-3">
            {past.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-orange-100 px-5 py-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {formatDate(report.date)}
                  </span>
                  {scoreBadge(report.score)}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {report.summary}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. 親の情報サマリー */}
        <section>
          <p className="text-xs text-gray-400 font-medium mb-3 tracking-widest uppercase">Parent Info</p>
          <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl flex-shrink-0">
                👴
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{user?.parent_name}</p>
                <p className="text-sm text-gray-400">{user?.parent_age} 歳</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-3 border-t border-orange-50">
                <span className="text-gray-400">次回の電話</span>
                <span className="font-medium text-gray-800">
                  明日 午前 {user?.call_time}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-t border-orange-50">
                <span className="text-gray-400">今月の電話回数</span>
                <span className="font-medium text-gray-800">4 回</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t border-orange-50">
                <span className="text-gray-400">直近の体調傾向</span>
                <span className="font-medium text-green-600">おおむね良好</span>
              </div>
            </div>
          </div>
        </section>

        {/* LINE連携セクション */}
        <section>
          <p className="text-xs text-gray-400 font-medium mb-3 tracking-widest uppercase">LINE連携</p>
          <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6">
            {user?.line_user_id ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-bold text-gray-800 text-sm">LINE連携済み</p>
                  <p className="text-xs text-gray-400 mt-0.5">毎日の報告がLINEに届きます</p>
                </div>
              </div>
            ) : linkCode ? (
              <div>
                <p className="font-bold text-gray-800 mb-1">LINEで以下のコードを送ってください</p>
                <p className="text-xs text-gray-400 mb-4">
                  ① mimamori公式アカウントを友達追加<br />
                  ② トークにこの6桁のコードを送信
                </p>
                <div className="bg-orange-50 rounded-2xl p-5 text-center mb-4 border border-orange-100">
                  <p className="text-4xl font-bold tracking-[0.3em] text-orange-500">{linkCode}</p>
                </div>
                <p className="text-xs text-gray-400 text-center">コード送信後、自動で連携が完了します（最大30秒）</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  LINEと連携すると、毎日の通話後に親の様子が自動で届きます。
                </p>
                <button
                  onClick={handleLineLink}
                  disabled={linkLoading}
                  className="w-full bg-[#06C755] hover:bg-[#05b34d] text-white font-bold py-4 rounded-2xl transition disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <span className="text-lg">💬</span>
                  {linkLoading ? "コード発行中..." : "LINEと連携する"}
                </button>
              </div>
            )}
          </div>
        </section>

        <p className="text-center text-xs text-gray-300 pb-4">
          © 2026 mimamori
        </p>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
