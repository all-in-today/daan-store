import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALL IN · 大安體驗店預約",
  description: "預約 ALL IN 大安體驗店 90 分鐘品牌體驗",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full">
      <body className="min-h-full bg-[#faf9f7] text-[#1a1a1a] antialiased">
        {children}
      </body>
    </html>
  );
}
