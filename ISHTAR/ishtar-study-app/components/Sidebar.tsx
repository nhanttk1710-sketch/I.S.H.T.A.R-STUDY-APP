"use client";
import React from "react";
import {LayoutGrid,CalendarDays,SquareCheck,ChartNoAxesColumnIncreasing,Timer,Folder,Languages,Layers,Headphones,Settings,PanelLeftClose,PanelLeftOpen,Sparkles} from "lucide-react";
import type {TabId} from "./types";
interface SidebarProps{active:TabId;onChange:(tab:TabId)=>void;collapsed?:boolean;onToggle?:()=>void;logoImageUrl?:string}
const items:{id:TabId;label:string;icon:React.ElementType}[]=[
{id:"overview",label:"Tổng quan",icon:LayoutGrid},
{id:"schedule",label:"Thời khóa biểu",icon:CalendarDays},
{id:"tasks",label:"Bài tập & Deadline",icon:SquareCheck},
{id:"grades",label:"Điểm số & GPA",icon:ChartNoAxesColumnIncreasing},
{id:"pomodoro",label:"Pomodoro",icon:Timer},
{id:"resources",label:"Tài liệu",icon:Folder},
{id:"language",label:"Ngôn ngữ",icon:Languages},
{id:"flashcards",label:"Flashcard",icon:Layers},
{id:"settings",label:"Cài đặt",icon:Settings},
];
export const Sidebar:React.FC<SidebarProps>=({active,onChange,collapsed=false,onToggle,logoImageUrl="/ishtar-emblem.png"})=><aside className={`ishtar-sidebar ${collapsed?"ishtar-sidebar--collapsed":""}`}>
 <div className="ishtar-sidebar__brand"><div className="ishtar-brand__emblem"><img src={logoImageUrl} alt="I.S.H.T.A.R"/></div>{!collapsed&&<div className="ishtar-brand__text"><b>I.S.H.T.A.R</b><p>It Shall Help Toward Academic Readiness</p></div>}</div>
 {!collapsed&&<div className="ishtar-sidebar__section"><span>KHÔNG GIAN HỌC TẬP</span><i/> <b>✦</b></div>}
 <nav className="ishtar-sidebar__nav">{items.map(({id,label,icon:Icon})=>{const selected=active===id;return <button key={id} type="button" onClick={()=>onChange(id)} title={collapsed?label:undefined} aria-current={selected?"page":undefined} className={selected?"ishtar-sidebar__item is-active":"ishtar-sidebar__item"}><Icon size={21} strokeWidth={1.8}/>{!collapsed&&<span>{label}</span>}{!collapsed&&selected&&<Sparkles className="ishtar-sidebar__sparkle" size={14}/>}</button>})}</nav>
 <button type="button" onClick={onToggle} className="ishtar-sidebar__collapse" title={collapsed?"Mở rộng thanh bên":"Thu gọn thanh bên"}>{collapsed?<PanelLeftOpen size={17}/>:<><PanelLeftClose size={17}/><span>Thu gọn thanh bên</span></>}</button>
</aside>;
export default Sidebar;
