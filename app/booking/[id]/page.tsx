import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

const GENDER_LABEL: Record<string, string> = { Ms: "Ms.", Mr: "Mr.", NA: "N/A" };

function formatDatetime(dt: Date) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dt);
}

export default async function BookingConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { slot: true },
  });
  if (!booking) notFound();

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="bg-[#1a1a1a] py-8 px-6 text-center">
        <p className="text-[#9a9a8a] text-xs tracking-[0.2em] uppercase mb-2">ALL IN</p>
        <h1 className="text-white text-xl font-light tracking-[0.1em]">大安體驗店預約</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white border border-[#e8e3dc] p-8 text-center">
          <div className="w-12 h-12 bg-[#f0ece5] flex items-center justify-center mx-auto mb-5 text-2xl">
            ✓
          </div>
          <p className="text-xs tracking-widest text-[#9a9a8a] uppercase mb-2">預約確認</p>
          <h2 className="text-lg font-light tracking-wide mb-6">期待與你相見</h2>

          <div className="bg-[#f5f2ed] p-5 mb-6 text-left">
            <p className="text-xs text-[#9a9a8a] tracking-widest uppercase mb-1">預約時段</p>
            <p className="text-base">{formatDatetime(booking.slot.datetime)}</p>
          </div>

          <div className="text-left space-y-3 text-sm">
            <div>
              <span className="text-xs text-[#9a9a8a] tracking-widest uppercase block mb-1">姓名</span>
              <span>{GENDER_LABEL[booking.gender] || booking.gender} {booking.firstName} {booking.lastName}</span>
            </div>
            <div>
              <span className="text-xs text-[#9a9a8a] tracking-widest uppercase block mb-1">電話</span>
              <span>{booking.countryCode} {booking.phone}</span>
            </div>
            {booking.email && (
              <div>
                <span className="text-xs text-[#9a9a8a] tracking-widest uppercase block mb-1">Email</span>
                <span>{booking.email}</span>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-[#e8e3dc]">
            <p className="text-xs text-[#9a9a8a] mb-1">地址</p>
            <p className="text-sm">台北市大安區和平東路二段175巷56號</p>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-block text-xs tracking-widest uppercase text-[#9a9a8a] hover:text-[#1a1a1a] transition-colors"
            >
              返回首頁
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
