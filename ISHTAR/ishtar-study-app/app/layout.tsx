import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700", "800"], variable: "--font-plus-jakarta", display: "swap" });
export const metadata: Metadata = { title: "I.S.H.T.A.R — Đồng hành cùng việc học", description: "Không gian học tập cá nhân nhẹ nhàng." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
 return <html lang="vi"><body className={plusJakartaSans.variable}>{children}</body></html>;
}
