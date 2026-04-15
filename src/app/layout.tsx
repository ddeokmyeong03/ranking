import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "당직근무 관리",
  description: "육군 간부 당직근무표 변경 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
