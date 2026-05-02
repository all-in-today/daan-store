import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const where = month
    ? {
        slot: {
          datetime: {
            gte: new Date(`${month}-01T00:00:00+08:00`),
            lt: new Date(
              new Date(`${month}-01T00:00:00+08:00`).setMonth(
                new Date(`${month}-01T00:00:00+08:00`).getMonth() + 1
              )
            ),
          },
        },
      }
    : {};

  const bookings = await prisma.booking.findMany({
    where,
    include: { slot: true },
    orderBy: { slot: { datetime: "asc" } },
  });

  return NextResponse.json(bookings);
}
