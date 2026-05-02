import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBookingNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gender, firstName, lastName, countryCode, phone, email, reasons, note, slotId } = body;

    if (!gender || !firstName || !lastName || !phone || !email || !slotId || !reasons?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slot = await prisma.timeSlot.findUnique({ where: { id: slotId } });
    if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    if (slot.isBooked) return NextResponse.json({ error: "Slot already booked" }, { status: 409 });

    const booking = await prisma.$transaction(async (tx) => {
      await tx.timeSlot.update({ where: { id: slotId }, data: { isBooked: true } });
      return tx.booking.create({
        data: {
          gender, firstName, lastName,
          countryCode: countryCode || "+886",
          phone, email, reasons, note,
          slotId,
        },
        include: { slot: true },
      });
    });

    await sendBookingNotification({
      gender: booking.gender,
      firstName: booking.firstName,
      lastName: booking.lastName,
      countryCode: booking.countryCode,
      phone: booking.phone,
      email: booking.email,
      reasons: booking.reasons,
      note: booking.note ?? undefined,
      datetime: booking.slot.datetime,
      bookingId: booking.id,
    });

    return NextResponse.json({ id: booking.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
