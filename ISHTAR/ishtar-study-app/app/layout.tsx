import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
const quicksand=Quicksand({subsets:["latin","vietnamese"],weight:["400","500","600","700","800"],variable:"--font-quicksand",display:"swap"});
export const metadata:Metadata={title:"I.S.H.T.A.R — Đồng hành cùng việc học",description:"Không gian học tập cá nhân nhẹ nhàng."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body className={quicksand.className}>{children}</body></html>}