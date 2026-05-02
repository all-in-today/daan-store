import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

async function checkAuth() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(req: NextRequest) {
  const authErr = await checkAuth();
  if (authErr) return authErr;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  const where = month
    ? {
        datetime: {
          gte: new Date(`${month}-01T00:00:00+08:00`),
          lt: new Date(
            new Date(`${month}-01T00:00:00+08:00`).setMonth(
              new Date(`${month}-01T00:00:00+08:00`).getMonth() + 1
            )
          ),
        },
      }
    : {};

  const slots = await prisma.timeSlot.findMany({
    where,
    include: { booking: true },
    orderBy: { datetime: "asc" },
  });

  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  const authErr = await checkAuth();
  if (authErr) return authErr;

  const { datetimes } = await req.json();
  if (!Array.isArray(datetimes) || !datetimes.length) {
    return NextResponse.json({ error: "datetimes array required" }, { status: 400 });
  }

  const created = await prisma.timeSlot.createMany({
    data: datetimes.map((dt: string) => ({ datetime: new Date(dt) })),
    skipDuplicates: true,
  });

  return NextResponse.json({ count: created.count }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const authErr = await checkAuth();
  if (authErr) return authErr;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const slot = await prisma.timeSlot.findUnique({ where: { id } });
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (slot.isBooked) return NextResponse.json({ error: "Cannot delete booked slot" }, { status: 409 });

  await prisma.timeSlot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
