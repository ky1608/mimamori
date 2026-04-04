import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (e) {
      console.error("[stripe-webhook] 署名検証失敗:", e);
      return NextResponse.json({ error: "署名が不正です" }, { status: 400 });
    }
  } else {
    // 開発中はwebhookSecretなしでもパース
    event = JSON.parse(rawBody) as Stripe.Event;
  }

  console.log("[stripe-webhook] event type:", event.type);

  // 支払い完了イベント
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const customerId = session.customer as string;

    if (!userId) {
      console.error("[stripe-webhook] userId が metadata にありません");
      return NextResponse.json({ error: "userId not found" }, { status: 400 });
    }

    const { error } = await supabase
      .from("users")
      .update({
        status: "active",
        stripe_customer_id: customerId,
      })
      .eq("id", userId);

    if (error) {
      console.error("[stripe-webhook] users update error:", error);
      return NextResponse.json({ error: "DB更新失敗" }, { status: 500 });
    }

    console.log("[stripe-webhook] ユーザーをactiveに更新:", userId);
  }

  // サブスクリプションキャンセル
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    await supabase
      .from("users")
      .update({ status: "inactive" })
      .eq("stripe_customer_id", customerId);

    console.log("[stripe-webhook] サブスクリプションキャンセル:", customerId);
  }

  return NextResponse.json({ ok: true });
}
