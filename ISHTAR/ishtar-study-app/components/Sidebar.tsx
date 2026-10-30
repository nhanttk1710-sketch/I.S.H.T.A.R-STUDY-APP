"use client";
import { LayoutDashboard, CalendarDays, ClipboardList, ChartNoAxesColumnIncreasing, Timer, FolderOpen, Languages, Layers, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { TabId } from "./types";
const items:{id:TabId;label:string;icon:typeof LayoutDashboard}[]=[
 {id:"overview",label:"Tổng quan",icon:LayoutDashboard},{id:"schedule",label:"Thời khóa biểu",icon:CalendarDays},{id:"tasks",label:"Bài tập & Deadline",icon:ClipboardList},{id:"grades",label:"Điểm số & GPA",icon:ChartNoAxesColumnIncreasing},{id:"pomodoro",label:"Pomodoro",icon:Timer},{id:"resources",label:"Tài liệu",icon:FolderOpen},{id:"language",label:"Ngôn ngữ",icon:Languages},{id:"flashcards",label:"Flashcard",icon:Layers}
];
export default function Sidebar({active,onChange,collapsed,onToggle}:{active:TabId;onChange:(id:TabId)=>void;collapsed:boolean;onToggle:()=>void}){
 return <aside className={`hidden lg:flex h-screen sticky top-0 flex-col border-r border-slate-100 bg-white px-4 py-6 transition-all ${collapsed?"w-[88px]":"w-[260px]"}`}>
 <div className="flex items-center gap-3 px-2 mb-10"><img src="https://i.postimg.cc/m2P9pLvh/ishtar.png" alt="I.S.H.T.A.R" className="h-9 w-9 rounded-full border border-blue-100 object-cover"/>{!collapsed&&<div><div className="font-extrabold tracking-[.16em] text-slate-800">I.S.H.T.A.R</div><div className="text-[10px] tracking-widest text-slate-400">STUDY COMPANION</div></div>}</div>
 <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{!collapsed&&"Không gian học tập"}</div>
 <nav className="flex-1 space-y-1">{items.map(({id,label,icon:Icon})=><button key={id} onClick={()=>onChange(id)} title={collapsed?label:undefined} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-all ${active===id?"bg-blue-50 text-blue-700 shadow-sm":"text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Icon size={19}/>{!collapsed&&label}</button>)}</nav>
 <button onClick={onToggle} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-slate-50">{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/ >}{!collapsed&&"Thu gọn thanh bên"}</button>
 <div className="mt-3 rounded-2xl bg-blue-50 p-4">{!collapsed&&<><div className="text-xs font-semibold text-blue-800">Một chút mỗi ngày ✦</div><p className="mt-1 text-[11px] leading-relaxed text-blue-600">Nỗ lực nhỏ hôm nay tạo nên thay đổi lớn ngày mai.</p></>}</div>
 </aside>
}
