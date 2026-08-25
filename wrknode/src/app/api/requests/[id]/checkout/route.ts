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

  const request = await prisma.clientRequest.findUnique({
    where: { id: params.id },
  });

  if (!request || request.userId !== session.user.id) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (request.status !== "QUOTED" || request.quotedPrice == null) {
    return NextResponse.json(
      { error: "This request doesn't have a quote to pay yet." },
      { status: 400 }
    );
  }

  if (request.paidAt) {
    return NextResponse.json({ error: "This request is already paid." }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const currency = request.region === "INDIA" ? "inr" : "usd";

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: request.quotedPrice,
          product_data: {
            name: "Wrknode automation build",
            description: request.message.slice(0, 200),
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      requestId: request.id,
      userId: session.user.id,
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
