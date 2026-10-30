"use client";
import {useEffect,useMemo,useState} from "react";
import {CalendarDays,ChevronLeft,ChevronRight,Plus,Trash2} from "lucide-react";

type ImportantEvent={id:string;title:string;date:string};
const key="ishtar_important_events";
const pad=(n:number)=>String(n).padStart(2,"0");
const dateKey=(d:Date)=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const uid=()=>Math.random().toString(36).slice(2,10);
const monthNames=["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

export default function ImportantEventsCalendar(){
 const now=new Date();
 const [events,setEvents]=useState<ImportantEvent[]>([]);
 const [ready,setReady]=useState(false);
 const [month,setMonth]=useState(new Date(now.getFullYear(),now.getMonth(),1));
 const [selected,setSelected]=useState(dateKey(now));
 const [formOpen,setFormOpen]=useState(false);
 const [title,setTitle]=useState("");
 const [date,setDate]=useState(dateKey(now));
 useEffect(()=>{try{const raw=localStorage.getItem(key);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))setEvents(parsed.filter(x=>x&&typeof x.title==="string"&&typeof x.date==="string"))}}catch{}setReady(true)},[]);
 useEffect(()=>{if(ready){try{localStorage.setItem(key,JSON.stringify(events))}catch{}}},[events,ready]);
 const year=month.getFullYear(),monthIndex=month.getMonth();
 const daysInMonth=new Date(year,monthIndex+1,0).getDate();
 const offset=(new Date(year,monthIndex,1).getDay()+6)%7;
 const eventDates=new Set(events.map(e=>e.date));
 const selectedEvents=events.filter(e=>e.date===selected).sort((a,b)=>a.title.localeCompare(b.title));
 const cells=useMemo(()=>Array.from({length:offset+daysInMonth},(_,i)=>i<offset?null:i-offset+1),[offset,daysInMonth]);
 const move=(delta:number)=>setMonth(new Date(year,monthIndex+delta,1));
 const addEvent=(e:React.FormEvent)=>{e.preventDefault();if(!title.trim()||!date)return;setEvents(v=>[...v,{id:uid(),title:title.trim(),date}]);setSelected(date);const d=new Date(date+"T12:00:00");setMonth(new Date(d.getFullYear(),d.getMonth(),1));setTitle("");setFormOpen(false)};
 const selectedLabel=(()=>{const [y,m,d]=selected.split("-");return d+"/"+m+"/"+y})();
 return <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><CalendarDays size={20}/></span><div><h3 className="font-bold text-slate-800">Sự kiện & Cột mốc quan trọng</h3><p className="text-xs text-slate-400">Theo dõi ngày thi, sinh nhật và deadline lớn</p></div></div><div className="flex items-center gap-2"><button type="button" aria-label="Tháng trước" onClick={()=>move(-1)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><ChevronLeft size={18}/></button><span className="min-w-[118px] text-center text-sm font-semibold text-slate-700">{monthNames[monthIndex]} {year}</span><button type="button" aria-label="Tháng sau" onClick={()=>move(1)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><ChevronRight size={18}/></button></div></div>
  <div className="grid grid-cols-7 gap-1 text-center">{["T2","T3","T4","T5","T6","T7","CN"].map(d=><div key={d} className="py-2 text-xs font-semibold text-slate-400">{d}</div>)}{cells.map((day,i)=>{if(day===null)return <div key={"blank-"+i}/>;const keyDate=year+"-"+pad(monthIndex+1)+"-"+pad(day);const isToday=keyDate===dateKey(now);const isSelected=keyDate===selected;const hasEvent=eventDates.has(keyDate);return <button key={keyDate} type="button" onClick={()=>setSelected(keyDate)} aria-pressed={isSelected} className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition hover:bg-blue-50"><span className={"grid h-8 w-8 place-items-center rounded-full "+(isToday?"bg-blue-600 font-bold text-white":isSelected?"bg-blue-100 font-bold text-blue-700":"text-slate-700")}>{day}</span><span className={"h-1.5 w-1.5 rounded-full "+(hasEvent?"bg-rose-500":"bg-transparent")}/></button>})}</div>
  <div className="mt-5 border-t border-slate-100 pt-4"><div className="mb-3 flex items-center justify-between gap-2"><div><p className="text-sm font-bold text-slate-800">Sự kiện ngày {selectedLabel}</p><p className="text-xs text-slate-400">{selectedEvents.length} sự kiện</p></div><button type="button" onClick={()=>{setDate(selected);setFormOpen(v=>!v)}} className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"><Plus size={14}/>Thêm sự kiện quan trọng</button></div>
   {formOpen&&<form onSubmit={addEvent} className="mb-4 grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1fr_170px_auto]"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Tên sự kiện quan trọng" maxLength={100} required className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"/><input type="date" value={date} onChange={e=>setDate(e.target.value)} required className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"/><button type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Lưu sự kiện</button></form>}
   {selectedEvents.length?<div className="space-y-2">{selectedEvents.map(event=><div key={event.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3"><span className="h-2 w-2 shrink-0 rounded-full bg-rose-500"/><p className="min-w-0 flex-1 text-sm font-medium text-slate-700">{event.title}</p><button type="button" aria-label={"Xóa "+event.title} onClick={()=>setEvents(v=>v.filter(x=>x.id!==event.id))} className="rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={16}/></button></div>)}</div>:<div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-400">Chưa có sự kiện trong ngày này.</div>}
  </div>
 </section>;
}
