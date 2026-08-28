import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  if (session.user.role !== "ADMIN") return { error: NextResponse.json({ error: "Not authorized." }, { status: 403 }) };
  return { session };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.tagline === "string") data.tagline = body.tagline.trim();
  if (Number.isFinite(Number(body.priceINR))) data.priceINR = Number(body.priceINR);
  if (Number.isFinite(Number(body.priceUSD))) data.priceUSD = Number(body.priceUSD);
  if (Array.isArray(body.features)) {
    data.features = body.features.filter((f: unknown) => typeof f === "string");
  }
  if (["CHECKOUT", "SIGNUP", "CONTACT"].includes(body.ctaType)) data.ctaType = body.ctaType;
  if (typeof body.isPopular === "boolean") data.isPopular = body.isPopular;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (Number.isFinite(Number(body.sortOrder))) data.sortOrder = Number(body.sortOrder);

  const plan = await prisma.plan.update({ where: { id: params.id }, data });

  return NextResponse.json({ ok: true, plan });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  await prisma.plan.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
