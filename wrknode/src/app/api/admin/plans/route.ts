import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const tagline = typeof body?.tagline === "string" ? body.tagline.trim() : "";
  const priceINR = Number(body?.priceINR);
  const priceUSD = Number(body?.priceUSD);
  const features = Array.isArray(body?.features) ? body.features.filter((f: unknown) => typeof f === "string") : [];
  const ctaType = ["CHECKOUT", "SIGNUP", "CONTACT"].includes(body?.ctaType) ? body.ctaType : "CHECKOUT";
  const isPopular = Boolean(body?.isPopular);
  const isActive = body?.isActive !== false;
  const sortOrder = Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0;

  if (!name || !tagline || !Number.isFinite(priceINR) || !Number.isFinite(priceUSD)) {
    return NextResponse.json({ error: "Name, tagline, and both prices are required." }, { status: 400 });
  }

  const plan = await prisma.plan.create({
    data: { name, tagline, priceINR, priceUSD, features, ctaType, isPopular, isActive, sortOrder },
  });

  return NextResponse.json({ ok: true, plan });
}
