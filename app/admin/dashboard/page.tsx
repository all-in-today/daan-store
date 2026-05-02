"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Slot {
  id: string;
  datetime: string;
  isBooked: boolean;
  booking?: {
    id: string;
    gender: string;
    firstName: string;
    lastName: string;
    phone: string;
    countryCode: string;
    email: string;
    reasons: string[];
    note?: string;
  } | null;
}

const GENDER_LABEL: Record<string, string> = { Ms: "Ms.", Mr: "Mr.", NA: "N/A" };

function toYMD(d: Date) {
  const tpe = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  return `${tpe.getFullYear()}-${String(tpe.getMonth() + 1).padStart(2, "0")}-${String(tpe.getDate()).padStart(2, "0")}`;
}

function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDatetime(dt: string) {
  return new Date(dt).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"slots" | "bookings">("slots");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addTime, setAddTime] = useState("10:00");
  const [loading, setLoading] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    const res = await fetch(`/api/admin/slots?month=${currentMonth}`, { credentials: "include" });
    if (res.status === 401) { router.push("/admin"); return; }
    const data = await res.json();
    setSlots(data);
  }, [currentMonth, router]);

  const loadBookings = useCallback(async () => {
    const res = await fetch(`/api/admin/bookings?month=${currentMonth}`, { credentials: "include" });
    if (res.status === 401) { router.push("/admin"); return; }
    const data = await res.json();
    setBookings(data);
  }, [currentMonth, router]);

  useEffect(() => { loadSlots(); loadBookings(); }, [loadSlots, loadBookings]);

  const calendarDays = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month - 1, d));
    return days;
  };

  const slotsForDate = (ymd: string) => slots.filter((s) => toYMD(new Date(s.datetime)) === ymd);
  const selectedDateSlots = selectedDate ? slotsForDate(selectedDate) : [];

  const handleAddSlot = async () => {
    if (!selectedDate || !addTime) return;
    setLoading(true);
    const datetime = new Date(`${selectedDate}T${addTime}:00+08:00`).toISOString();
    await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ datetimes: [datetime] }),
      credentials: "include",
    });
    await loadSlots();
    setLoading(false);
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("確認刪除此時段？")) return;
    await fetch("/api/admin/slots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      credentials: "include",
    });
    await loadSlots();
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  const monthLabel = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("zh-TW", { year: "numeric", month: "long" });
  };

  const prevMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 2);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const nextMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="bg-[#1a1a1a] px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-white text-sm tracking-widest">ALL IN</span>
          <span className="text-[#6a6a5a] text-xs ml-3 tracking-wider">後台管理</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-[#9a9a8a] hover:text-white tracking-widest uppercase transition-colors"
        >
          登出
        </button>
      </header>

      {/* Tab Nav */}
      <div className="bg-white border-b border-[#e8e3dc] flex">
        {(["slots", "bookings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-xs tracking-widest uppercase border-b-2 transition-colors ${
              tab === t ? "border-[#1a1a1a] text-[#1a1a1a]" : "border-transparent text-[#9a9a8a]"
            }`}
          >
            {t === "slots" ? "時段管理" : "預約紀錄"}
          </button>
        ))}
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Slots Management */}
        {tab === "slots" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendar */}
            <div className="bg-white border border-[#e8e3dc] p-5">
              <div className="flex items-center justify-between mb-5">
                <button onClick={prevMonth} className="text-[#9a9a8a] hover:text-[#1a1a1a] text-lg px-2">‹</button>
                <span className="text-sm tracking-widest">{monthLabel()}</span>
                <button onClick={nextMonth} className="text-[#9a9a8a] hover:text-[#1a1a1a] text-lg px-2">›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                  <div key={d} className="text-center text-xs text-[#9a9a8a] py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays().map((d, i) => {
                  if (!d) return <div key={i} />;
                  const ymd = toYMD(d);
                  const daySlots = slotsForDate(ymd);
                  const isSelected = selectedDate === ymd;
                  const hasSlots = daySlots.length > 0;
                  const hasBooked = daySlots.some((s) => s.isBooked);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(ymd)}
                      className={`aspect-square flex flex-col items-center justify-center text-xs transition-colors relative
                        ${isSelected ? "bg-[#1a1a1a] text-white" : "hover:bg-[#f5f2ed] text-[#1a1a1a]"}
                      `}
                    >
                      <span>{d.getDate()}</span>
                      {hasSlots && !isSelected && (
                        <span className={`w-1 h-1 rounded-full mt-0.5 ${hasBooked ? "bg-[#c8884a]" : "bg-[#9a9a8a]"}`} />
                      )}
                      {hasSlots && isSelected && (
                        <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 text-xs text-[#9a9a8a]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#9a9a8a] inline-block" /> 有時段</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#c8884a] inline-block" /> 有預約</span>
              </div>
            </div>

            {/* Slot editor */}
            <div className="bg-white border border-[#e8e3dc] p-5">
              {!selectedDate ? (
                <p className="text-[#9a9a8a] text-sm py-8 text-center">點選左側日期以管理時段</p>
              ) : (
                <>
                  <p className="text-xs text-[#9a9a8a] tracking-widest uppercase mb-1">選定日期</p>
                  <p className="text-sm mb-5">
                    {new Date(`${selectedDate}T12:00:00+08:00`).toLocaleDateString("zh-TW", {
                      timeZone: "Asia/Taipei", year: "numeric", month: "long", day: "numeric", weekday: "short",
                    })}
                  </p>

                  {/* Add slot */}
                  <div className="flex gap-2 mb-5">
                    <input
                      type="time"
                      value={addTime}
                      onChange={(e) => setAddTime(e.target.value)}
                      className="border border-[#e8e3dc] px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
                    />
                    <button
                      onClick={handleAddSlot}
                      disabled={loading}
                      className="px-4 py-2 bg-[#1a1a1a] text-white text-xs tracking-widest uppercase hover:bg-[#333] disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      新增時段
                    </button>
                  </div>

                  {/* Existing slots */}
                  {selectedDateSlots.length === 0 ? (
                    <p className="text-[#9a9a8a] text-xs py-4 text-center">此日期尚無時段</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateSlots.map((s) => (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between px-3 py-2 border text-sm ${
                            s.isBooked ? "border-[#c8884a] bg-[#fdf5ec]" : "border-[#e8e3dc]"
                          }`}
                        >
                          <span className="font-mono">{formatTime(s.datetime)}</span>
                          {s.isBooked ? (
                            <span className="text-xs text-[#c8884a] tracking-wider">已預約</span>
                          ) : (
                            <button
                              onClick={() => handleDeleteSlot(s.id)}
                              className="text-xs text-[#9a9a8a] hover:text-red-500 tracking-wider transition-colors"
                            >
                              刪除
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Bookings */}
        {tab === "bookings" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="text-[#9a9a8a] hover:text-[#1a1a1a] text-lg px-1">‹</button>
                <span className="text-sm tracking-widest">{monthLabel()}</span>
                <button onClick={nextMonth} className="text-[#9a9a8a] hover:text-[#1a1a1a] text-lg px-1">›</button>
              </div>
              <span className="text-xs text-[#9a9a8a]">共 {bookings.length} 筆</span>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white border border-[#e8e3dc] p-10 text-center text-[#9a9a8a] text-sm">
                本月尚無預約
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => {
                  const bk = b.booking;
                  if (!bk) return null;
                  const isExpanded = expandedBooking === b.id;
                  return (
                    <div key={b.id} className="bg-white border border-[#e8e3dc]">
                      <button
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#faf9f7] transition-colors"
                        onClick={() => setExpandedBooking(isExpanded ? null : b.id)}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-[#9a9a8a] w-32">{formatDatetime(b.datetime)}</span>
                          <span className="text-sm">
                            {GENDER_LABEL[bk.gender] || bk.gender} {bk.firstName} {bk.lastName}
                          </span>
                        </div>
                        <span className="text-[#9a9a8a] text-xs">{isExpanded ? "▲" : "▼"}</span>
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-4 border-t border-[#f0ece5] pt-4 space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-[#9a9a8a] tracking-widest uppercase mb-1">電話</p>
                              <p>{bk.countryCode} {bk.phone}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#9a9a8a] tracking-widest uppercase mb-1">Email</p>
                              <p>{bk.email || "—"}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-[#9a9a8a] tracking-widest uppercase mb-1">走進 ALL IN 的原因</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {bk.reasons.map((r) => (
                                <span key={r} className="bg-[#f0ece5] text-xs px-2 py-1">{r}</span>
                              ))}
                            </div>
                          </div>
                          {bk.note && (
                            <div>
                              <p className="text-xs text-[#9a9a8a] tracking-widest uppercase mb-1">備註</p>
                              <p className="text-sm">{bk.note}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
