import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface BookingEmailData {
  gender: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  phone: string;
  email: string;
  reasons: string[];
  note?: string;
  datetime: Date;
  bookingId: string;
}

const GENDER_LABEL: Record<string, string> = {
  Ms: "Ms.",
  Mr: "Mr.",
  NA: "N/A",
};

function formatDatetime(dt: Date) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dt);
}

export async function sendBookingNotification(data: BookingEmailData) {
  const genderLabel = GENDER_LABEL[data.gender] || data.gender;
  const fullName = `${data.firstName} ${data.lastName}`;
  const datetimeStr = formatDatetime(data.datetime);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Georgia', serif; background: #faf9f7; color: #2c2c2c; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border: 1px solid #e8e3dc; }
    .header { background: #1a1a1a; padding: 32px 40px; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 400; letter-spacing: 0.15em; margin: 0; }
    .header p { color: #9a9a8a; font-size: 12px; letter-spacing: 0.1em; margin: 6px 0 0; text-transform: uppercase; }
    .body { padding: 40px; }
    .section-title { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #9a9a8a; margin: 0 0 16px; }
    .field { margin-bottom: 20px; }
    .label { font-size: 12px; color: #9a9a8a; letter-spacing: 0.08em; margin-bottom: 4px; }
    .value { font-size: 15px; color: #1a1a1a; }
    .divider { border: none; border-top: 1px solid #e8e3dc; margin: 28px 0; }
    .slot-box { background: #f5f2ed; padding: 20px 24px; margin-bottom: 28px; }
    .slot-box .label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
    .slot-box .value { font-size: 20px; font-weight: 400; letter-spacing: 0.05em; margin-top: 6px; }
    .reasons { display: flex; flex-wrap: wrap; gap: 8px; }
    .reason-tag { background: #f0ece5; padding: 5px 12px; font-size: 12px; color: #5a5a4a; }
    .footer { background: #f5f2ed; padding: 20px 40px; }
    .footer p { font-size: 11px; color: #9a9a8a; letter-spacing: 0.05em; margin: 4px 0; }
    .booking-id { font-size: 11px; color: #c0b89a; letter-spacing: 0.08em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ALL IN</h1>
      <p>新預約通知 · New Booking</p>
    </div>
    <div class="body">
      <div class="slot-box">
        <div class="label">預約時間</div>
        <div class="value">${datetimeStr}</div>
      </div>

      <p class="section-title">預約人資訊</p>

      <div class="field">
        <div class="label">姓名</div>
        <div class="value">${genderLabel} ${fullName}</div>
      </div>

      <div class="field">
        <div class="label">電話</div>
        <div class="value">${data.countryCode} ${data.phone}</div>
      </div>

      <div class="field">
        <div class="label">Email</div>
        <div class="value">${data.email}</div>
      </div>

      <hr class="divider">

      <div class="field">
        <div class="label">走進 ALL IN 的原因</div>
        <div style="margin-top: 8px;">
          <div class="reasons">
            ${data.reasons.map((r) => `<span class="reason-tag">${r}</span>`).join("")}
          </div>
        </div>
      </div>

      ${
        data.note
          ? `
      <hr class="divider">
      <div class="field">
        <div class="label">備註</div>
        <div class="value">${data.note}</div>
      </div>
      `
          : ""
      }
    </div>
    <div class="footer">
      <p>大安體驗店 · 台北市大安區和平東路二段175巷56號</p>
      <p class="booking-id">Booking ID: ${data.bookingId}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const resend = getResend();
  return await resend.emails.send({
    from: "ALL IN Booking <booking@all-in.company>",
    to: ["hello@all-in.company"],
    subject: `新預約｜${genderLabel} ${fullName}｜${datetimeStr}`,
    html,
  });
}
