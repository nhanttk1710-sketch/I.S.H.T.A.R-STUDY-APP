"use client";
import {useEffect,useMemo,useState} from "react";
import {CalendarDays,ChevronLeft,ChevronRight,Plus,Trash2} from "lucide-react";
import type {Goal,TabId} from "./types";
type ImportantEvent={id:string;title:string;date:string};
const key="ishtar_important_events";
const pad=(n:number)=>String(n).padStart(2,"0");
const dateKey=(d:Date)=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const uid=()=>Math.random().toString(36).slice(2,10);
const monthNames=["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
export default function ImportantEventsCalendar({goals=[],onNavigate}:{goals?:Goal[];onNavigate?:(tab:TabId)=>void}){
 const now=new Date();const [events,setEvents]=useState<ImportantEvent[]>([]);const [ready,setReady]=useState(false);
 const [month,setMonth]=useState(new Date(now.getFullYear(),now.getMonth(),1));const [selected,setSelected]=useState(dateKey(now));
 const [formOpen,setFormOpen]=useState(false);const [title,setTitle]=useState("");const [date,setDate]=useState(dateKey(now));
 useEffect(()=>{try{const raw=localStorage.getItem(key);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))setEvents(parsed.filter(x=>x&&typeof x.title==="string"&&typeof x.date==="string"))}}catch{}setReady(true)},[]);
 useEffect(()=>{if(ready){try{localStorage.setItem(key,JSON.stringify(events))}catch{}}},[events,ready]);
 const year=month.getFullYear(),monthIndex=month.getMonth(),daysInMonth=new Date(year,monthIndex+1,0).getDate(),offset=(new Date(year,monthIndex,1).getDay()+6)%7;
 const eventDates=new Set(events.map(e=>e.date));const cells=useMemo(()=>Array.from({length:offset+daysInMonth},(_,i)=>i<offset?null:i-offset+1),[offset,daysInMonth]);
 const selectedEvents=events.filter(e=>e.date===selected).sort((a,b)=>a.title.localeCompare(b.title));
 const addEvent=(e:React.FormEvent)=>{e.preventDefault();if(!title.trim()||!date)return;setEvents(v=>[...v,{id:uid(),title:title.trim(),date}]);setSelected(date);const d=new Date(date+"T12:00:00");setMonth(new Date(d.getFullYear(),d.getMonth(),1));setTitle("");setFormOpen(false)};
 const move=(delta:number)=>setMonth(new Date(year,monthIndex+delta,1));
 const goalItems=goals.length?goals:[{id:"sat-template",exam:"SAT",target:"",examDate:"",createdAt:"",scoreMin:400,scoreMax:1600,scores:[]},{id:"ielts-template",exam:"IELTS",target:"",examDate:"",createdAt:"",scoreMin:1,scoreMax:9,scores:[]}];
 return <div className="ishtar-dashboard-panels">
  <section className="ishtar-events-heading"><div><CalendarDays size={22}/><h2>Sự kiện & Cột mốc</h2></div><button type="button" onClick={()=>{setDate(selected);setFormOpen(v=>!v)}}><Plus size={15}/>Thêm mốc</button></section>
  <section className="ishtar-events-list">{formOpen&&<form onSubmit={addEvent} className="ishtar-event-form"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Tên sự kiện" required/><input type="date" value={date} onChange={e=>setDate(e.target.value)} required/><button type="submit">Lưu</button></form>}{selectedEvents.length?selectedEvents.map(event=><div key={event.id} className="ishtar-event-row"><div><b>{event.title}</b><small>{selected.split("-").reverse().join("/")}</small></div><button aria-label="Xóa sự kiện" onClick={()=>setEvents(v=>v.filter(x=>x.id!==event.id))}><Trash2 size={15}/></button></div>):<div className="ishtar-event-empty"><b>Chưa có sự kiện</b><span>Thêm lịch thi hoặc deadline của bạn</span></div>}</section>
  <section className="ishtar-goals-panel"><h3>MỤC TIÊU CỦA BẠN</h3>{goalItems.map(goal=><button key={goal.id} type="button" onClick={()=>onNavigate?.("grades")} className="ishtar-goal-card"><b>{goal.exam}</b><span>{goal.examDate?"Ngày thi: "+goal.examDate:"Chưa thiết lập ngày thi"}</span></button>)}</section>
  <section className="ishtar-month-panel"><div className="ishtar-month-heading"><div><CalendarDays size={22}/><h2>{monthNames[monthIndex]}, {year}</h2></div><div><button type="button" aria-label="Tháng trước" onClick={()=>move(-1)}><ChevronLeft size={17}/></button><button type="button" aria-label="Tháng sau" onClick={()=>move(1)}><ChevronRight size={17}/></button></div></div>
   <div className="ishtar-calendar-grid">{["T2","T3","T4","T5","T6","T7","CN"].map((d,i)=><b key={d} className={i>4?"weekend":""}>{d}</b>)}{cells.map((day,i)=>{if(!day)return <span key={"blank-"+i}/>;const value=dateKey(new Date(year,monthIndex,day));const weekend=new Date(year,monthIndex,day).getDay()===0||new Date(year,monthIndex,day).getDay()===6;return <button key={value} type="button" onClick={()=>setSelected(value)} className={(selected===value?"selected ":"")+(value===dateKey(now)?"today ":"")+(eventDates.has(value)?"has-event ":"")+(weekend?"weekend":"")}>{day}{eventDates.has(value)&&<i/>}</button>})}</div>
  </section>
 </div>;
}