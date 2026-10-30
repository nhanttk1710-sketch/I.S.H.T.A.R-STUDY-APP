import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
const nunito=Nunito({subsets:["latin","vietnamese"],weight:["400","500","600","700","800"],variable:"--font-nunito",display:"swap"});
export const metadata:Metadata={title:"I.S.H.T.A.R — Đồng hành cùng việc học",description:"Không gian học tập cá nhân nhẹ nhàng."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body className={nunito.className}>{children}</body></html>}