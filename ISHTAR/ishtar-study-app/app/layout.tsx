import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "I.S.H.T.A.R — Đồng hành cùng việc học",
  description: "Không gian học tập cá nhân nhẹ nhàng, giúp bạn tiến bộ mỗi ngày."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}