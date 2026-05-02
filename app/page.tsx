"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const REASONS = [
  "我已經是 ALL IN 的訂閱/方案會員了！",
  "我曾經買過產品，想再更認識品牌",
  "因為品牌理念而來",
  "因為產品內容而來",
  "親友推薦",
  "社群平台分享",
];

type Step = "date" | "time" | "form";

interface Slot {
  id: string;
  datetime: string;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

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

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("date");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    gender: "Ms",
    firstName: "",
    lastName: "",
    countryCode: "+886",
    phone: "",
    email: "",
    reasons: [] as string[],
    note: "",
  });

  const loadAvailableDates = useCallback(async (month: string) => {
    const res = await fetch(`/api/slots/available-dates?month=${month}`);
    const data = await res.json();
    setAvailableDates(data);
  }, []);

  useEffect(() => {
    loadAvailableDates(currentMonth);
  }, [currentMonth, loadAvailableDates]);

  useEffect(() => {
    if (!selectedDate) return;
    fetch(`/api/slots?date=${selectedDate}`)
      .then((r) => r.json())
      .then(setSlots);
  }, [selectedDate]);

  const calendarDays = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month - 1, d));
    return days;
  };

  const toggleReason = (r: string) => {
    setForm((f) => ({
      ...f,
      reasons: f.reasons.includes(r) ? f.reasons.filter((x) => x !== r) : [...f.reasons, r],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    if (!form.reasons.length) {
      alert("請選擇至少一個原因");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slotId: selectedSlot.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/booking/${data.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "預約失敗，請稍後再試");
      setSubmitting(false);
    }
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

  const today = toYMD(new Date());

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <header className="bg-[#1a1a1a] py-8 px-6 text-center">
        <p className="text-[#9a9a8a] text-xs tracking-[0.2em] uppercase mb-2">ALL IN</p>
        <h1 className="text-white text-xl font-light tracking-[0.1em]">大安體驗店預約</h1>
        <p className="text-[#6a6a5a] text-xs mt-2 tracking-widest">台北市大安區和平東路二段175巷56號</p>
      </header>

      {/* Steps indicator */}
      <div className="flex justify-center gap-0 bg-white border-b border-[#e8e3dc]">
        {(["date", "time", "form"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`px-6 py-3 text-xs tracking-widest uppercase border-b-2 transition-colors ${
              step === s
                ? "border-[#1a1a1a] text-[#1a1a1a]"
                : "border-transparent text-[#9a9a8a]"
            }`}
          >
            {i + 1}. {s === "date" ? "選擇日期" : s === "time" ? "選擇時段" : "填寫資料"}
          </div>
        ))}
      </div>

      <main className="max-w-lg mx-auto px-4 py-10">

        {/* STEP 1: Date picker */}
        {step === "date" && (
          <div className="bg-white border border-[#e8e3dc] p-6">
            <div className="flex items-center justify-between mb-6">
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
                const isPast = ymd < today;
                const isAvail = availableDates.includes(ymd);
                const isSelected = selectedDate === ymd;
                return (
                  <button
                    key={i}
                    disabled={!isAvail || isPast}
                    onClick={() => setSelectedDate(ymd)}
                    className={`aspect-square flex items-center justify-center text-sm transition-colors
                      ${isSelected ? "bg-[#1a1a1a] text-white" : ""}
                      ${isAvail && !isPast && !isSelected ? "bg-[#f0ece5] text-[#1a1a1a] hover:bg-[#e8e0d4] cursor-pointer" : ""}
                      ${(!isAvail || isPast) && !isSelected ? "text-[#d0cdc7] cursor-not-allowed" : ""}
                    `}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-5 text-xs text-[#9a9a8a]">
              <span className="inline-block w-4 h-4 bg-[#f0ece5]" /> 可預約
            </div>
            <div className="mt-6">
              <button
                disabled={!selectedDate}
                onClick={() => { setStep("time"); setSelectedSlot(null); }}
                className="w-full py-3 bg-[#1a1a1a] text-white text-xs tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#333] transition-colors"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Time slot */}
        {step === "time" && (
          <div className="bg-white border border-[#e8e3dc] p-6">
            <button onClick={() => setStep("date")} className="text-xs text-[#9a9a8a] tracking-widest uppercase mb-5 flex items-center gap-1 hover:text-[#1a1a1a]">
              ‹ 返回
            </button>
            <p className="text-xs tracking-widest text-[#9a9a8a] uppercase mb-1">選擇時段</p>
            <p className="text-base mb-6">
              {selectedDate
                ? formatDate(new Date(`${selectedDate}T12:00:00+08:00`))
                : ""}
            </p>
            {slots.length === 0 ? (
              <p className="text-[#9a9a8a] text-sm py-8 text-center">此日期暫無可用時段</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSlot(s)}
                    className={`py-3 border text-sm tracking-wider transition-colors
                      ${selectedSlot?.id === s.id
                        ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                        : "border-[#e8e3dc] text-[#1a1a1a] hover:border-[#1a1a1a]"
                      }`}
                  >
                    {formatTime(s.datetime)}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-6">
              <button
                disabled={!selectedSlot}
                onClick={() => setStep("form")}
                className="w-full py-3 bg-[#1a1a1a] text-white text-xs tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#333] transition-colors"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Contact form */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="bg-white border border-[#e8e3dc] p-6">
            <button type="button" onClick={() => setStep("time")} className="text-xs text-[#9a9a8a] tracking-widest uppercase mb-5 flex items-center gap-1 hover:text-[#1a1a1a]">
              ‹ 返回
            </button>

            {/* Booking summary */}
            <div className="bg-[#f5f2ed] p-4 mb-7 text-sm">
              <p className="text-xs text-[#9a9a8a] tracking-widest uppercase mb-1">預約時段</p>
              <p className="text-base">
                {selectedDate ? formatDate(new Date(`${selectedDate}T12:00:00+08:00`)) : ""}
                {selectedSlot ? ` · ${formatTime(selectedSlot.datetime)}` : ""}
              </p>
            </div>

            <p className="text-xs tracking-widest text-[#9a9a8a] uppercase mb-5">Contact Information</p>

            {/* Gender */}
            <div className="flex gap-5 mb-5">
              {["Ms", "Mr", "NA"].map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={() => setForm((f) => ({ ...f, gender: g }))}
                    className="accent-[#c8884a]"
                  />
                  {g === "NA" ? "N/A" : g + "."}
                </label>
              ))}
            </div>

            {/* Name */}
            <div className="text-xs text-[#1a1a1a] mb-1">
              Name <span className="text-[#c8884a]">*</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <input
                required
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="border border-[#e8e3dc] px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
              />
              <input
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="border border-[#e8e3dc] px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
              />
            </div>

            {/* Phone */}
            <div className="text-xs text-[#1a1a1a] mb-1">
              Mobile Phone Number <span className="text-[#c8884a]">*</span>
            </div>
            <div className="flex gap-2 mb-5">
              <input
                value={form.countryCode}
                onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value }))}
                className="border border-[#e8e3dc] px-3 py-2 text-sm w-20 focus:outline-none focus:border-[#1a1a1a] bg-white"
              />
              <input
                required
                placeholder="手機號碼"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="border border-[#e8e3dc] px-3 py-2 text-sm flex-1 focus:outline-none focus:border-[#1a1a1a] bg-white"
              />
            </div>

            {/* Email */}
            <div className="text-xs text-[#1a1a1a] mb-1">Email</div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="border border-[#e8e3dc] px-3 py-2 text-sm w-full mb-6 focus:outline-none focus:border-[#1a1a1a] bg-white"
            />

            {/* Reasons */}
            <div className="text-sm mb-3">
              我們很好奇，這次是什麼讓你走進 ALL IN？<span className="text-[#c8884a]">*</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleReason(r)}
                  className={`border px-3 py-2 text-xs text-left transition-colors
                    ${form.reasons.includes(r)
                      ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                      : "border-[#e8e3dc] text-[#1a1a1a] hover:border-[#9a9a8a]"
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Note */}
            <div className="text-xs text-[#1a1a1a] mb-1">Note</div>
            <textarea
              rows={4}
              placeholder="Got any special requests? Leave it here!"
              maxLength={400}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="border border-[#e8e3dc] px-3 py-2 text-sm w-full mb-1 focus:outline-none focus:border-[#1a1a1a] bg-white resize-none"
            />
            <div className="text-right text-xs text-[#9a9a8a] mb-6">({form.note.length}/400)</div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#1a1a1a] text-white text-xs tracking-widest uppercase disabled:opacity-50 hover:bg-[#333] transition-colors"
            >
              {submitting ? "送出中…" : "確認預約"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
