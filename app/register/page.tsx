"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type FormData = {
  // STEP1
  email: string;
  password: string;
  passwordConfirm: string;
  // STEP2
  parentLastName: string;
  parentFirstName: string;
  parentAge: string;
  parentPhone: string;
  conditions: string;
  familyInfo: string;
  // STEP3
  callTime: string;
  callFrequency: string;
  serviceStartOption: string;
  serviceStartDate: string;
  // STEP4
  consentService: boolean;
  consentDataShare: boolean;
};

const initialData: FormData = {
  email: "",
  password: "",
  passwordConfirm: "",
  parentLastName: "",
  parentFirstName: "",
  parentAge: "",
  parentPhone: "",
  conditions: "",
  familyInfo: "",
  callTime: "08:00",
  callFrequency: "daily",
  serviceStartOption: "tomorrow",
  serviceStartDate: "",
  consentService: false,
  consentDataShare: false,
};

const callTimeOptions = [
  { value: "07:00", label: "7:00" },
  { value: "07:30", label: "7:30" },
  { value: "08:00", label: "8:00" },
  { value: "08:30", label: "8:30" },
  { value: "09:00", label: "9:00" },
  { value: "09:30", label: "9:30" },
  { value: "10:00", label: "10:00" },
];

const callFrequencyOptions = [
  { value: "daily", label: "毎日" },
  { value: "weekdays", label: "平日のみ（月〜金）" },
  { value: "every2days", label: "2日に1回" },
  { value: "3days", label: "週3回（月・水・金）" },
];

const steps = ["アカウント作成", "親の情報", "設定", "確認・完了"];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const set = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const toggle = (key: "consentService" | "consentDataShare") => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateStep4 = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.consentService) e.consentService = "サービス利用規約への同意が必要です";
    setErrors(e as Partial<FormData>);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e: Partial<FormData> = {};
    if (!form.email) e.email = "メールアドレスを入力してください";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "正しいメールアドレスを入力してください";
    if (!form.password) e.password = "パスワードを入力してください";
    else if (form.password.length < 8) e.password = "8文字以上で入力してください";
    if (!form.passwordConfirm) e.passwordConfirm = "パスワードを再入力してください";
    else if (form.password !== form.passwordConfirm) e.passwordConfirm = "パスワードが一致しません";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Partial<FormData> = {};
    if (!form.parentLastName) e.parentLastName = "苗字を入力してください";
    if (!form.parentFirstName) e.parentFirstName = "名前を入力してください";
    if (!form.parentAge) e.parentAge = "年齢を入力してください";
    else if (isNaN(Number(form.parentAge)) || Number(form.parentAge) < 1) e.parentAge = "正しい年齢を入力してください";
    if (!form.parentPhone) e.parentPhone = "電話番号を入力してください";
    else if (!/^[0-9\-+]+$/.test(form.parentPhone)) e.parentPhone = "正しい電話番号を入力してください";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!validateStep4()) return;
    setLoading(true);
    setAuthError("");

    // 1. Supabase Auth にサインアップ
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError) {
      setAuthError(
        signUpError.message === "User already registered"
          ? "このメールアドレスはすでに登録されています"
          : signUpError.message
      );
      setLoading(false);
      return;
    }

    const user = data.user;
    if (!user) {
      setAuthError("アカウントの作成に失敗しました。もう一度お試しください。");
      setLoading(false);
      return;
    }

    // サービス開始日を計算
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateMap: Record<string, Date> = {
      tomorrow: new Date(today.getTime() + 1 * 86400000),
      "3days":  new Date(today.getTime() + 3 * 86400000),
      "1week":  new Date(today.getTime() + 7 * 86400000),
    };
    const serviceStartDate =
      form.serviceStartOption === "custom" && form.serviceStartDate
        ? new Date(form.serviceStartDate)
        : startDateMap[form.serviceStartOption] ?? startDateMap["tomorrow"];

    // 2. users テーブルに保存
    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      email: form.email,
      parent_name: `${form.parentLastName} ${form.parentFirstName}`.trim(),
      parent_last_name: form.parentLastName,
      parent_first_name: form.parentFirstName,
      parent_age: Number(form.parentAge),
      parent_phone: form.parentPhone,
      conditions: form.conditions || null,
      family_info: form.familyInfo || null,
      call_time: form.callTime,
      call_frequency: form.callFrequency,
      consent_service: form.consentService,
      consent_data_share: form.consentDataShare,
      consent_recorded_at: new Date().toISOString(),
      service_start_date: serviceStartDate.toISOString(),
      status: "inactive",
    });

    setLoading(false);
    if (insertError) {
      setAuthError("登録中にエラーが発生しました: " + insertError.message);
      return;
    }

    // Stripe Checkout セッションを作成して遷移
    const stripeRes = await fetch("/api/stripe/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, email: form.email }),
    });

    const stripeData = await stripeRes.json();
    if (!stripeRes.ok || !stripeData.url) {
      setAuthError("決済画面の準備に失敗しました。もう一度お試しください。");
      setLoading(false);
      return;
    }

    window.location.href = stripeData.url;
  };

  const back = () => setStep((s) => s - 1);

  const callTimeLabel = callTimeOptions.find((o) => o.value === form.callTime)?.label ?? form.callTime;
  const callFreqLabel = callFrequencyOptions.find((o) => o.value === form.callFrequency)?.label ?? form.callFrequency;

  const startOptionLabels: Record<string, string> = {
    tomorrow: "明日から",
    "3days":  "3日後から",
    "1week":  "1週間後から",
    custom:   form.serviceStartDate ? `${form.serviceStartDate}から` : "日付を指定（未選択）",
  };
  const serviceStartLabel = startOptionLabels[form.serviceStartOption] ?? "未設定";

  return (
    <div className="min-h-screen bg-[#FFFDF9] font-sans">
      {/* ヘッダー */}
      <header className="border-b border-orange-100 bg-white">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-orange-500">mimamori</a>
          <span className="text-sm text-gray-400">登録手続き</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-12">
        {/* ステップインジケーター */}
        <div className="flex items-center justify-between mb-12">
          {steps.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div key={n} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                      ${done ? "bg-orange-400 text-white" : active ? "bg-orange-400 text-white ring-4 ring-orange-100" : "bg-gray-200 text-gray-400"}`}
                  >
                    {done ? "✓" : n}
                  </div>
                  <span className={`text-xs whitespace-nowrap ${active ? "text-orange-500 font-medium" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-5 mx-1 ${done ? "bg-orange-300" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* STEP1 */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">アカウントを作成する</h1>
            <p className="text-gray-400 text-sm mb-8">ご自身（ご家族側）のメールアドレスで登録してください。</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  メールアドレス <span className="text-orange-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="example@email.com"
                  className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition
                    ${errors.email ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  パスワード <span className="text-orange-400">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="8文字以上"
                  className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition
                    ${errors.password ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  パスワード（確認） <span className="text-orange-400">*</span>
                </label>
                <input
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(e) => set("passwordConfirm", e.target.value)}
                  placeholder="もう一度入力してください"
                  className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition
                    ${errors.passwordConfirm ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.passwordConfirm && <p className="text-red-400 text-xs mt-1">{errors.passwordConfirm}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP2 */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">親の情報を入力する</h1>
            <p className="text-gray-400 text-sm mb-8">電話をかけるご両親の情報を入力してください。</p>
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    苗字 <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.parentLastName}
                    onChange={(e) => set("parentLastName", e.target.value)}
                    placeholder="例：田中"
                    className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition
                      ${errors.parentLastName ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.parentLastName && <p className="text-red-400 text-xs mt-1">{errors.parentLastName}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    名前 <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.parentFirstName}
                    onChange={(e) => set("parentFirstName", e.target.value)}
                    placeholder="例：花子"
                    className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition
                      ${errors.parentFirstName ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.parentFirstName && <p className="text-red-400 text-xs mt-1">{errors.parentFirstName}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  年齢 <span className="text-orange-400">*</span>
                </label>
                <input
                  type="number"
                  value={form.parentAge}
                  onChange={(e) => set("parentAge", e.target.value)}
                  placeholder="例：78"
                  min={1}
                  max={120}
                  className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition
                    ${errors.parentAge ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.parentAge && <p className="text-red-400 text-xs mt-1">{errors.parentAge}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  電話番号 <span className="text-orange-400">*</span>
                </label>
                <input
                  type="tel"
                  value={form.parentPhone}
                  onChange={(e) => set("parentPhone", e.target.value)}
                  placeholder="例：090-1234-5678"
                  className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition
                    ${errors.parentPhone ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.parentPhone && <p className="text-red-400 text-xs mt-1">{errors.parentPhone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  持病・気になること
                  <span className="text-gray-400 font-normal ml-1">（任意）</span>
                </label>
                <textarea
                  value={form.conditions}
                  onChange={(e) => set("conditions", e.target.value)}
                  placeholder="例：高血圧の薬を飲んでいる。最近膝が痛いと言っていた。"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  家族情報・孫の名前など
                  <span className="text-gray-400 font-normal ml-1">（任意）</span>
                </label>
                <textarea
                  value={form.familyInfo}
                  onChange={(e) => set("familyInfo", e.target.value)}
                  placeholder="例：孫の名前は「さくら」と「けんた」。息子（私）は東京在住。"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition resize-none"
                />
                <p className="text-gray-400 text-xs mt-1">AIが会話の中で自然に使います。</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP3 */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">電話の設定をする</h1>
            <p className="text-gray-400 text-sm mb-8">いつ、どのくらいの頻度で電話するか設定します。</p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  電話をかける時間帯 <span className="text-orange-400">*</span>
                </label>
                <select
                  value={form.callTime}
                  onChange={(e) => set("callTime", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition bg-white"
                >
                  {callTimeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      午前 {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-gray-400 text-xs mt-1">起床後の落ち着いた時間帯がおすすめです。</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  電話の頻度 <span className="text-orange-400">*</span>
                </label>
                <div className="space-y-3">
                  {callFrequencyOptions.map((o) => (
                    <label
                      key={o.value}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition
                        ${form.callFrequency === o.value ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-200"}`}
                    >
                      <input
                        type="radio"
                        name="callFrequency"
                        value={o.value}
                        checked={form.callFrequency === o.value}
                        onChange={(e) => set("callFrequency", e.target.value)}
                        className="accent-orange-400"
                      />
                      <span className="text-sm text-gray-700">{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  サービス開始日 <span className="text-orange-400">*</span>
                </label>
                <div className="space-y-3">
                  {[
                    { value: "tomorrow", label: "明日から" },
                    { value: "3days",    label: "3日後から" },
                    { value: "1week",    label: "1週間後から" },
                    { value: "custom",   label: "日付を指定する" },
                  ].map((o) => (
                    <label
                      key={o.value}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition
                        ${form.serviceStartOption === o.value ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-200"}`}
                    >
                      <input
                        type="radio"
                        name="serviceStartOption"
                        value={o.value}
                        checked={form.serviceStartOption === o.value}
                        onChange={(e) => set("serviceStartOption", e.target.value)}
                        className="accent-orange-400"
                      />
                      <span className="text-sm text-gray-700">{o.label}</span>
                    </label>
                  ))}
                </div>
                {form.serviceStartOption === "custom" && (
                  <input
                    type="date"
                    value={form.serviceStartDate}
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    onChange={(e) => set("serviceStartDate", e.target.value)}
                    className="mt-3 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-300 transition"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP4 確認 */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">内容を確認する</h1>
            <p className="text-gray-400 text-sm mb-8">以下の内容で登録します。よろしければ「登録する」を押してください。</p>

            <div className="space-y-4">
              <div className="bg-white border border-orange-100 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-orange-400 mb-4 uppercase tracking-widest">アカウント</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-400">メールアドレス</dt>
                    <dd className="text-gray-800 font-medium">{form.email}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white border border-orange-100 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-orange-400 mb-4 uppercase tracking-widest">親の情報</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-400">名前</dt>
                    <dd className="text-gray-800 font-medium">{form.parentLastName} {form.parentFirstName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">年齢</dt>
                    <dd className="text-gray-800 font-medium">{form.parentAge} 歳</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">電話番号</dt>
                    <dd className="text-gray-800 font-medium">{form.parentPhone}</dd>
                  </div>
                  {form.conditions && (
                    <div className="flex flex-col gap-1 pt-1">
                      <dt className="text-gray-400">持病・気になること</dt>
                      <dd className="text-gray-700 text-xs leading-relaxed">{form.conditions}</dd>
                    </div>
                  )}
                  {form.familyInfo && (
                    <div className="flex flex-col gap-1 pt-1">
                      <dt className="text-gray-400">家族情報</dt>
                      <dd className="text-gray-700 text-xs leading-relaxed">{form.familyInfo}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="bg-white border border-orange-100 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-orange-400 mb-4 uppercase tracking-widest">電話設定</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-400">電話時間</dt>
                    <dd className="text-gray-800 font-medium">午前 {callTimeLabel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">頻度</dt>
                    <dd className="text-gray-800 font-medium">{callFreqLabel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">サービス開始日</dt>
                    <dd className="text-gray-800 font-medium">{serviceStartLabel}</dd>
                  </div>
                </dl>
              </div>

              {/* 同意チェックボックス */}
              <div className="space-y-3 pt-2">
                <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition
                  ${form.consentService ? "border-orange-400 bg-orange-50" : errors.consentService ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-orange-200"}`}>
                  <input
                    type="checkbox"
                    checked={form.consentService}
                    onChange={() => toggle("consentService")}
                    className="mt-0.5 accent-orange-400"
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    <a href="/terms" className="text-orange-400 underline" target="_blank">サービス利用規約</a>
                    および
                    <a href="/privacy" className="text-orange-400 underline" target="_blank">プライバシーポリシー</a>
                    に同意する <span className="text-orange-400 font-bold">*</span>
                  </span>
                </label>
                {errors.consentService && (
                  <p className="text-red-400 text-xs px-1">{errors.consentService}</p>
                )}

                <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition
                  ${form.consentDataShare ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-200"}`}>
                  <input
                    type="checkbox"
                    checked={form.consentDataShare}
                    onChange={() => toggle("consentDataShare")}
                    className="mt-0.5 accent-orange-400"
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    会話データの統計的な品質改善への利用に同意する
                    <span className="text-gray-400 text-xs ml-1">（任意）</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 完了画面 */}
        {step === 5 && (
          <div className="text-center py-10">
            <div className="text-5xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">登録が完了しました</h1>
            <p className="text-gray-500 leading-relaxed mb-8">
              翌朝から、{form.parentLastName} {form.parentFirstName}さんへの電話がスタートします。<br />
              結果はLINEでお届けします。
            </p>
            <a
              href="/"
              className="inline-block bg-orange-400 hover:bg-orange-500 text-white font-bold px-10 py-4 rounded-full transition"
            >
              トップページへ
            </a>
          </div>
        )}

        {/* エラーメッセージ */}
        {authError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {authError}
          </div>
        )}

        {/* ナビゲーションボタン */}
        {step < 5 && (
          <div className={`flex mt-10 gap-3 ${step > 1 ? "justify-between" : "justify-end"}`}>
            {step > 1 && (
              <button
                onClick={back}
                disabled={loading}
                className="px-6 py-3 rounded-full border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition disabled:opacity-40"
              >
                ← 戻る
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={next}
                disabled={loading}
                className="px-8 py-3 bg-orange-400 hover:bg-orange-500 text-white font-bold rounded-full text-sm transition shadow-sm disabled:opacity-40"
              >
                {loading ? "処理中..." : "次へ →"}
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading}
                className="px-8 py-3 bg-orange-400 hover:bg-orange-500 text-white font-bold rounded-full text-sm transition shadow-sm disabled:opacity-40"
              >
                {loading ? "登録中..." : "登録する"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
