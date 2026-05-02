import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  if (!month) {
    return NextResponse.json({ error: "month required" }, { status: 400 });
  }

  const start = new Date(`${month}-01T00:00:00+08:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const slots = await prisma.timeSlot.findMany({
    where: {
      datetime: { gte: start, lt: end },
      isBooked: false,
    },
    select: { datetime: true },
  });

  const dates = [
    ...new Set(
      slots.map((s) => {
        const d = new Date(s.datetime);
        const tpe = new Date(
          d.toLocaleString("en-US", { timeZone: "Asia/Taipei" })
        );
        return `${tpe.getFullYear()}-${String(tpe.getMonth() + 1).padStart(2, "0")}-${String(tpe.getDate()).padStart(2, "0")}`;
      })
    ),
  ];

  return NextResponse.json(dates);
}
