import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://web-henna-nine-23.vercel.app";

export async function POST(req: NextRequest) {
  let body: { userId: string; email: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const { userId, email } = body;
  if (!userId || !email) {
    return NextResponse.json({ error: "userId と email は必須です" }, { status: 400 });
  }

  // Stripe Checkout Session を作成
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "jpy",
          recurring: { interval: "month" },
          product_data: {
            name: "mimamori スタンダードプラン",
            description: "AIが毎日ご両親に電話して、LINEでお届けします。",
          },
          unit_amount: 3980,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
    },
    success_url: `${BASE_URL}/dashboard?payment=success`,
    cancel_url: `${BASE_URL}/register?payment=cancelled`,
    locale: "ja",
  });

  return NextResponse.json({ url: session.url });
}
