import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "체단실 랭킹",
  description: "군부대 헬스장 파워리프팅 · 특급전사 · 인바디 랭킹",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-bg text-white min-h-screen">{children}</body>
    </html>
  );
}
