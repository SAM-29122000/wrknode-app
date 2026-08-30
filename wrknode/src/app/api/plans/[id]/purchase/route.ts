import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/razorpay";

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
  const currency = region === "INDIA" ? "INR" : "USD";

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

  const order = await createRazorpayOrder({
    amount: quotedPrice,
    currency,
    receipt: request.id,
    notes: { requestId: request.id, userId: session.user.id, planId: plan.id },
  });

  await prisma.clientRequest.update({
    where: { id: request.id },
    data: { razorpayOrderId: order.id },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: quotedPrice,
    currency,
    keyId: getRazorpayKeyId(),
    description: `Wrknode — ${plan.name}`,
    prefillEmail: session.user.email ?? undefined,
  });
}
