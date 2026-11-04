"use client";
import {useMemo,useState} from "react";
import {CalendarDays,ChevronLeft,ChevronRight,Plus,Trash2} from "lucide-react";
import type {Goal,TabId,PersonalEvent,Task} from "./types";
const pad=(n:number)=>String(n).padStart(2,"0");
const dateKey=(d:Date)=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const uid=()=>Math.random().toString(36).slice(2,10);
const monthNames=["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
type Props={goals?:Goal[];events:PersonalEvent[];tasks:Task[];onEventsChange:(events:PersonalEvent[])=>void;onNavigate?:(tab:TabId)=>void};
export default function ImportantEventsCalendar({goals=[],events,tasks,onEventsChange,onNavigate}:Props){
 const now=new Date();const [month,setMonth]=useState(new Date(now.getFullYear(),now.getMonth(),1));const [selected,setSelected]=useState(dateKey(now));
 const [formOpen,setFormOpen]=useState(false);const [title,setTitle]=useState("");const [date,setDate]=useState(dateKey(now));const [time,setTime]=useState("");
 const year=month.getFullYear(),monthIndex=month.getMonth(),daysInMonth=new Date(year,monthIndex+1,0).getDate(),offset=(new Date(year,monthIndex,1).getDay()+6)%7;
 const cells=useMemo(()=>Array.from({length:offset+daysInMonth},(_,i)=>i<offset?null:i-offset+1),[offset,daysInMonth]);
 const selectedEvents=events.filter(e=>e.date===selected).sort((a,b)=>(a.time||"").localeCompare(b.time||""));;
 const selectedTasks=tasks.filter(t=>t.due===selected);
 const taskUrgent=(t:Task)=>!t.done&&Boolean(t.due)&&new Date(t.due+"T23:59:59").getTime()-Date.now()<=48*60*60*1000;
 const dayCount=selectedEvents.length+selectedTasks.length;
 const add=(e:React.FormEvent)=>{e.preventDefault();if(!title.trim()||!date)return;onEventsChange([...events,{id:uid(),title:title.trim(),date,time:time||undefined,allDay:!time,repeat:"none"}]);setSelected(date);const d=new Date(date+"T12:00:00");setMonth(new Date(d.getFullYear(),d.getMonth(),1));setTitle("");setTime("");setFormOpen(false)};
 const move=(delta:number)=>setMonth(new Date(year,monthIndex+delta,1));
 const goalItems=goals.length?goals:[{id:"sat-template",exam:"SAT",target:"",examDate:"",createdAt:"",scoreMin:400,scoreMax:1600,scores:[]},{id:"ielts-template",exam:"IELTS",target:"",examDate:"",createdAt:"",scoreMin:1,scoreMax:9,scores:[]}];
 return <div className="ishtar-dashboard-panels">
  <section className="ishtar-events-heading"><div><CalendarDays size={22}/><h2>Sự kiện cá nhân</h2></div><button type="button" onClick={()=>{setDate(selected);setFormOpen(v=>!v)}}><Plus size={15}/>Thêm sự kiện</button></section>
  <section className="ishtar-events-list">
   <div className="mb-3"><b className="text-sm">{new Date(selected+"T12:00:00").toLocaleDateString("vi-VN",{weekday:"long",day:"numeric",month:"long"})}</b><p className="text-xs text-stone-400">{dayCount} mục cần chú ý trong ngày</p></div>
   {formOpen&&<form onSubmit={add} className="ishtar-event-form"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Tên sự kiện (sinh nhật, cuộc hẹn...)" required/><input type="date" value={date} onChange={e=>setDate(e.target.value)} required/><input aria-label="Giờ diễn ra" type="time" value={time} onChange={e=>setTime(e.target.value)}/><button type="submit">Lưu</button></form>}
   {selectedTasks.map(task=><button key={task.id} type="button" onClick={()=>onNavigate?.("tasks")} className="ishtar-event-row w-full text-left"><span className={"h-2.5 w-2.5 shrink-0 rounded-full "+(task.done?"bg-emerald-500":taskUrgent(task)?"bg-red-500":"bg-emerald-500")}/><div className="min-w-0 flex-1"><b className={task.done?"line-through opacity-60":""}>{task.title}</b><small>{task.subject} · Hạn nộp</small></div><span className={"ishtar-event-type "+(task.done?"ishtar-event-type--event":taskUrgent(task)?"bg-red-50 text-red-600":"bg-emerald-50 text-emerald-700")}>{task.done?"Đã xong":taskUrgent(task)?"Sắp đến hạn":"Bài tập"}</span></button>)}{selectedEvents.map(item=><div key={item.id} className="ishtar-event-row"><span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"/><div className="min-w-0 flex-1"><b>{item.title}</b><small>{item.allDay||!item.time?"Cả ngày":item.time}</small></div><span className="ishtar-event-type ishtar-event-type--event">Cá nhân</span><button type="button" aria-label={"Xóa "+item.title} onClick={()=>onEventsChange(events.filter(e=>e.id!==item.id))}><Trash2 size={15}/></button></div>)}{!dayCount&&<div className="ishtar-event-empty"><b>Ngày này chưa có sự kiện</b><span>Thêm sự kiện cá nhân hoặc bài tập có hạn nộp để được nhắc nhở.</span></div>}
  </section>
  <div className="ishtar-side-col">
   <section className="ishtar-month-panel"><div className="ishtar-month-heading"><div><CalendarDays size={22}/><h2>{monthNames[monthIndex]}, {year}</h2></div><div><button type="button" aria-label="Tháng trước" onClick={()=>move(-1)}><ChevronLeft size={17}/></button><button type="button" aria-label="Tháng sau" onClick={()=>move(1)}><ChevronRight size={17}/></button></div></div><div className="ishtar-calendar-grid">{["T2","T3","T4","T5","T6","T7","CN"].map((d,i)=><b key={d} className={i>4?"weekend":""}>{d}</b>)}{cells.map((day,i)=>{if(!day)return <span key={"blank-"+i}/>;const value=dateKey(new Date(year,monthIndex,day));const hasEvent=events.some(x=>x.date===value)||tasks.some(x=>x.due===value);const hasUrgentTask=tasks.some(x=>x.due===value&&!x.done&&taskUrgent(x));const weekend=new Date(year,monthIndex,day).getDay()===0||new Date(year,monthIndex,day).getDay()===6;return <button key={value} type="button" onClick={()=>setSelected(value)} className={(selected===value?"selected ":"")+(value===dateKey(now)?"today ":"")+(weekend?"weekend":"")}>{day}{hasEvent&&<i style={{backgroundColor:hasUrgentTask?"#DC2626":"#16A34A"}}/>}</button>})}</div><button type="button" onClick={()=>{setSelected(dateKey(now));setMonth(new Date(now.getFullYear(),now.getMonth(),1))}} className="mt-2 text-xs font-semibold text-amber-700">Hôm nay</button></section>
   <section className="ishtar-goals-panel"><h3>MỤC TIÊU CỦA BẠN</h3>{goalItems.map(goal=><button key={goal.id} type="button" onClick={()=>onNavigate?.("grades")} className="ishtar-goal-card"><b>{goal.exam}</b><span>{goal.examDate?"Ngày thi: "+goal.examDate:"Chưa thiết lập ngày thi"}</span></button>)}</section>
  </div>
 </div>;
}
