"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      return;
    }

    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-[#FFFDF9] font-sans flex flex-col">

      {/* ヘッダー */}
      <header className="px-6 py-5">
        <a href="/" className="text-xl font-bold text-orange-500">mimamori</a>
      </header>

      {/* フォーム */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">ログイン</h1>
            <p className="text-sm text-gray-400">ご登録のメールアドレスでログインしてください</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition bg-white"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-4 rounded-full transition shadow-sm disabled:opacity-40"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-gray-400">
              アカウントをお持ちでない方は
              <a href="/register" className="text-orange-400 font-medium ml-1 hover:underline">
                新規登録
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* フッター */}
      <footer className="px-6 py-5 text-center">
        <p className="text-xs text-gray-300">© 2026 mimamori</p>
      </footer>

    </div>
  );
}
