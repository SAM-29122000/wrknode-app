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

  const currency = request.region === "INDIA" ? "INR" : "USD";

  const order = await createRazorpayOrder({
    amount: request.quotedPrice,
    currency,
    receipt: request.id,
    notes: { requestId: request.id, userId: session.user.id },
  });

  await prisma.clientRequest.update({
    where: { id: request.id },
    data: { razorpayOrderId: order.id },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: request.quotedPrice,
    currency,
    keyId: getRazorpayKeyId(),
    description: request.message.slice(0, 200),
    prefillEmail: session.user.email ?? undefined,
  });
}
