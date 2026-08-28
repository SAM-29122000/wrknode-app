import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: params.id } });

  if (!plan || !plan.isActive || plan.ctaType !== "CHECKOUT") {
    return NextResponse.json({ error: "Plan not available." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const region = body?.region === "INTERNATIONAL" ? "INTERNATIONAL" : "INDIA";
  const quotedPrice = region === "INDIA" ? plan.priceINR : plan.priceUSD;

  // Reuse the exact same request/quote/checkout model the dashboard already
  // uses, instead of building a second payment path. This purchase just
  // starts life as a pre-quoted request.
  const request = await prisma.clientRequest.create({
    data: {
      userId: session.user.id,
      message: `Plan purchase: ${plan.name}`,
      status: "QUOTED",
      region,
      quotedPrice,
    },
  });

  const origin = new URL(req.url).origin;
  const currency = region === "INDIA" ? "inr" : "usd";

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: quotedPrice,
          product_data: {
            name: `Wrknode — ${plan.name}`,
            description: plan.tagline,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      requestId: request.id,
      userId: session.user.id,
      planId: plan.id,
    },
    success_url: `${origin}/dashboard?paid=1`,
    cancel_url: `${origin}/dashboard?paid=0`,
  });

  await prisma.clientRequest.update({
    where: { id: request.id },
    data: { stripeCheckoutSessionId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
