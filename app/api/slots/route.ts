import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }

  const start = new Date(`${date}T00:00:00+08:00`);
  const end = new Date(`${date}T23:59:59+08:00`);

  const slots = await prisma.timeSlot.findMany({
    where: {
      datetime: { gte: start, lte: end },
      isBooked: false,
    },
    orderBy: { datetime: "asc" },
  });

  return NextResponse.json(slots);
}
