"use client";

import Image from "next/image";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlarmClock, ArrowDownRight, ArrowUpRight, BookOpen, CalendarDays, Check, CheckCircle2,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, Flame, GraduationCap, LayoutDashboard,
  ListTodo, LogOut, MessageCircle, Minus, Pause, Play, Plus, RotateCcw, Send, Sparkles,
  Star, Target, Timer, Trash2, Trophy, X, FileText, Languages, ChartNoAxesCombined, Menu
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button, Card, Field, SectionHeading, SelectField } from "@/components/ui";
import { formatDate } from "@/lib/utils";

type Task = { id: number; title: string; subject: string; due: string; done: boolean; priority: "Cao" | "Vừa" | "Thấp" };
type Resource = { id: number; title: string; subject: string; url: string; note: string };
type Score = { id: number; term: string; gpa: number };
type MockTest = { id: number; date: string; score: number };
type Page = "Tổng quan" | "Thời khóa biểu" | "Bài tập & Deadline" | "Điểm số & GPA" | "Pomodoro" | "Tài liệu" | "Ngôn ngữ" | "Flashcard";

const navigation = [
  { label: "Tổng quan" as Page, icon: LayoutDashboard },
  { label: "Thời khóa biểu" as Page, icon: CalendarDays },
  { label: "Bài tập & Deadline" as Page, icon: ListTodo },
  { label: "Điểm số & GPA" as Page, icon: ChartNoAxesCombined },
  { label: "Pomodoro" as Page, icon: Timer },
  { label: "Tài liệu" as Page, icon: BookOpen },
  { label: "Ngôn ngữ" as Page, icon: Languages },
  { label: "Flashcard" as Page, icon: GraduationCap }
];

const initialTasks: Task[] = [
  { id: 1, title: "Ôn tập phương trình mũ và logarit", subject: "Toán", due: "2026-10-30", done: false, priority: "Cao" },
  { id: 2, title: "Viết bài IELTS Writing Task 2", subject: "IELTS", due: "2026-11-01", done: false, priority: "Vừa" },
  { id: 3, title: "Hoàn thành bài tập nhiệt động lực học", subject: "Vật lý", due: "2026-11-03", done: true, priority: "Vừa" },
  { id: 4, title: "Ôn 20 từ vựng mới", subject: "Tiếng Anh", due: "2026-10-29", done: false, priority: "Thấp" }
];
const vocabulary = [
  ["Allocate", "Phân bổ thời gian, nguồn lực"], ["Consistent", "Đều đặn, nhất quán"], ["Resilient", "Có khả năng phục hồi"], ["Substantial", "Đáng kể, lớn"], ["Mitigate", "Làm giảm nhẹ"], ["Sustainable", "Bền vững"], ["Compelling", "Thuyết phục"], ["Enhance", "Nâng cao, cải thiện"], ["Drawback", "Điểm bất lợi"], ["Inevitable", "Không thể tránh khỏi"], ["Acquire", "Tiếp thu, đạt được"], ["Implement", "Thực hiện, triển khai"], ["Significant", "Quan trọng, đáng kể"], ["Prioritize", "Ưu tiên"], ["Contribute", "Đóng góp"], ["Evaluate", "Đánh giá"], ["Outcome", "Kết quả"], ["Approach", "Cách tiếp cận"], ["Evidence", "Bằng chứng"], ["Maintain", "Duy trì"], ["Overcome", "Vượt qua"], ["Efficient", "Hiệu quả"], ["Commitment", "Sự cam kết"], ["Concentrate", "Tập trung"], ["Deadline", "Hạn chót"]
];

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
function StatCard({ label, value, detail, icon: Icon, tint = "blue" }: { label: string; value: string; detail: string; icon: React.ElementType; tint?: string }) {
  return <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-800">{value}</p><p className="mt-2 text-xs text-slate-400">{detail}</p></div><div className={`rounded-2xl p-3 ${tint === "purple" ? "bg-violet-50 text-violet-500" : tint === "green" ? "bg-emerald-50 text-emerald-500" : tint === "orange" ? "bg-orange-50 text-orange-500" : "bg-blue-50 text-blue-500"}`}><Icon size={20}/></div></div></Card>;
}
function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-500"><Sparkles size={20}/></div><p className="font-semibold text-slate-700">{title}</p><p className="mt-1 text-sm text-slate-400">{body}</p></div>;
}

export default function IshtarApp() {
  const [page, setPage] = useState<Page>("Tổng quan");
  const [loggedIn, setLoggedIn] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subjects, setSubjects] = useState<string[]>(["Toán", "Tiếng Anh", "Vật lý"]);
  const [dailyHours, setDailyHours] = useState("3");
  const [examDate, setExamDate] = useState("2026-12-15");
  const [examGoal, setExamGoal] = useState("Tốt nghiệp THPT");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [resources, setResources] = useState<Resource[]>([
    { id: 1, title: "Tổng hợp công thức Toán 12", subject: "Toán", url: "https://", note: "Ôn nhanh trước khi làm bài tập." },
    { id: 2, title: "IELTS Writing Task 2", subject: "IELTS", url: "https://ielts.org", note: "Tham khảo cấu trúc bài luận." }
  ]);
  const [scores, setScores] = useState<Score[]>([{ id: 1, term: "HK1", gpa: 7.6 }, { id: 2, term: "HK2", gpa: 8.0 }, { id: 3, term: "HK3", gpa: 8.3 }]);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceSubject, setResourceSubject] = useState("Toán");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceNote, setResourceNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState("Toán");
  const [taskDue, setTaskDue] = useState("2026-11-02");
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("Vừa");
  const [newTerm, setNewTerm] = useState("");
  const [newGpa, setNewGpa] = useState("8.5");
  const [cert, setCert] = useState("IELTS");
  const [testDate, setTestDate] = useState("2027-04-15");
  const [targetScore, setTargetScore] = useState("7.0");
  const [mockTests, setMockTests] = useState<MockTest[]>([{ id: 1, date: "2026-09-01", score: 5.5 }, { id: 2, date: "2026-10-01", score: 6 }, { id: 3, date: "2026-10-20", score: 6.5 }]);
  const [mockScore, setMockScore] = useState("6.5");
  const [mockDate, setMockDate] = useState("2026-10-29");
  const [flashIndex, setFlashIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [testDeck, setTestDeck] = useState<string[][] | null>(null);
  const [testIndex, setTestIndex] = useState(0);
  const [knownCount, setKnownCount] = useState(0);
  const [streak, setStreak] = useState(4);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "ishtar" | "user"; text: string }[]>([]);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<"Học" | "Nghỉ">("Học");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [cycle, setCycle] = useState(1);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoggedIn(readStorage("ishtar-logged-in", false));
    setOnboarded(readStorage("ishtar-onboarded", false));
    setSubjects(readStorage("ishtar-subjects", ["Toán", "Tiếng Anh", "Vật lý"]));
    setTasks(readStorage("ishtar-tasks", initialTasks));
    setResources(readStorage("ishtar-resources", [
      { id: 1, title: "Tổng hợp công thức Toán 12", subject: "Toán", url: "https://", note: "Ôn nhanh trước khi làm bài tập." },
      { id: 2, title: "IELTS Writing Task 2", subject: "IELTS", url: "https://ielts.org", note: "Tham khảo cấu trúc bài luận." }
    ]));
    setScores(readStorage("ishtar-scores", [{ id: 1, term: "HK1", gpa: 7.6 }, { id: 2, term: "HK2", gpa: 8.0 }, { id: 3, term: "HK3", gpa: 8.3 }]));
    setStreak(readStorage("ishtar-streak", 4));
  }, []);
  useEffect(() => { localStorage.setItem("ishtar-logged-in", JSON.stringify(loggedIn)); }, [loggedIn]);
  useEffect(() => { localStorage.setItem("ishtar-onboarded", JSON.stringify(onboarded)); }, [onboarded]);
  useEffect(() => { localStorage.setItem("ishtar-subjects", JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem("ishtar-tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("ishtar-resources", JSON.stringify(resources)); }, [resources]);
  useEffect(() => { localStorage.setItem("ishtar-scores", JSON.stringify(scores)); }, [scores]);
  useEffect(() => { localStorage.setItem("ishtar-streak", JSON.stringify(streak)); }, [streak]);
  useEffect(() => {
    if (!pomodoroRunning) return;
    const timer = setInterval(() => setSecondsLeft(s => {
      if (s > 1) return s - 1;
      if (pomodoroMode === "Học") {
        playBell(); setPomodoroMode("Nghỉ"); setToast("Tuyệt lắm! Đến lúc nghỉ ngơi 5 phút rồi."); return 5 * 60;
      }
      playBell();
      if (cycle >= 4) { setPomodoroRunning(false); setPomodoroMode("Học"); setCycle(1); setToast("Bạn đã hoàn thành 4 chu kỳ Pomodoro. Giỏi lắm!"); return 25 * 60; }
      setCycle(c => c + 1); setPomodoroMode("Học"); setToast(`Bắt đầu chu kỳ học thứ ${cycle + 1} nhé!`); return 25 * 60;
    }), 1000);
    return () => clearInterval(timer);
  }, [pomodoroRunning, pomodoroMode, cycle]);
  useEffect(() => {
    if (!toast) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [toast]);

  const completed = tasks.filter(t => t.done).length;
  const pending = tasks.filter(t => !t.done);
  const gpa = scores.length ? scores.reduce((sum, item) => sum + item.gpa, 0) / scores.length : 0;
  const urgentTasks = pending.filter(t => {
    const days = (new Date(`${t.due}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000;
    return days >= 0 && days <= 2;
  });
  const timerLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  function playBell() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
      oscillator.type = "sine"; oscillator.frequency.value = 880; gain.gain.value = 0.12;
      oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start();
      setTimeout(() => { oscillator.stop(); ctx.close(); }, 350);
    } catch { /* Trình duyệt không hỗ trợ âm thanh: vẫn tiếp tục chu kỳ. */ }
  }
  function login(e: React.FormEvent) { e.preventDefault(); setLoggedIn(true); setToast("Đăng nhập giả lập thành công. Chào mừng bạn trở lại!"); }
  function finishOnboarding() { setOnboarded(true); setToast("Đã lưu mục tiêu học tập của bạn."); setPage("Tổng quan"); }
  function notifyEmail(message: string) { setToast(`${message} (Mô phỏng — chưa gửi email thật)`); }
  function addTask(e: React.FormEvent) {
    e.preventDefault(); if (!taskTitle.trim()) return;
    setTasks(current => [{ id: Date.now(), title: taskTitle.trim(), subject: taskSubject, due: taskDue, done: false, priority: taskPriority }, ...current]);
    setTaskTitle(""); setToast("Đã thêm công việc vào danh sách của bạn.");
  }
  function addResource(e: React.FormEvent) {
    e.preventDefault(); if (!resourceTitle.trim()) return;
    setResources(current => [{ id: Date.now(), title: resourceTitle.trim(), subject: resourceSubject, url: resourceUrl || "#", note: resourceNote }, ...current]);
    setResourceTitle(""); setResourceUrl(""); setResourceNote(""); setToast("Đã lưu tài liệu mới.");
  }
  function addScore(e: React.FormEvent) {
    e.preventDefault(); if (!newTerm.trim()) return;
    setScores(current => [...current, { id: Date.now(), term: newTerm.trim(), gpa: Math.min(10, Math.max(0, Number(newGpa))) }]);
    setNewTerm(""); setToast("Đã cập nhật điểm số.");
  }
  function startFlashTest() {
    const shuffled = [...vocabulary].sort(() => Math.random() - .5).slice(0, 20);
    setTestDeck(shuffled); setTestIndex(0); setKnownCount(0); setFlipped(false); setToast("Bộ kiểm tra hôm nay đã sẵn sàng!");
  }
  function nextFlash(known: boolean) {
    setKnownCount(n => n + (known ? 1 : 0)); setFlipped(false);
    if (testDeck && testIndex >= testDeck.length - 1) {
      setToast(`Hoàn thành bài kiểm tra! Bạn nhớ ${knownCount + (known ? 1 : 0)}/${testDeck.length} từ.`);
      setTestDeck(null); setStreak(s => s + 1); return;
    }
    setTestIndex(i => i + 1);
  }
  function sendChat(textOverride?: string) {
    const message = (textOverride ?? chatInput).trim(); if (!message) return;
    setChatMessages(m => [...m, { role: "user", text: message }]); setChatInput("");
    const reply = /pomodoro|tập trung|deadline/i.test(message)
      ? "Hừm, ta đã chuẩn bị sẵn Pomodoro rồi đấy. Chọn mục Pomodoro bên trái và bắt đầu đi, đừng để ta phải nhắc lần hai!"
      : /flashcard|từ vựng|streak/i.test(message)
      ? "Muốn giỏi từ vựng thì phải ôn đều. Mở Flashcard, làm bài kiểm tra 20 từ hôm nay đi. Ta tin là ngươi làm được… một chút thôi đấy!"
      : "Được rồi, chia việc lớn thành một bước nhỏ trước đã. Chọn một việc quan trọng nhất, tập trung 25 phút rồi quay lại báo cáo với ta. Không phải ta lo cho ngươi đâu!";
    setTimeout(() => setChatMessages(m => [...m, { role: "ishtar", text: reply }]), 350);
  }

  if (!loggedIn) return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10"><div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-soft md:grid-cols-2"><div className="relative hidden min-h-[570px] bg-blue-50 md:block"><Image src="/isthar-avatar.png" alt="Minh họa Ishtar" fill className="object-cover object-top" priority/><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/75 to-transparent p-8 pt-24 text-white"><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-100">I.S.H.T.A.R</p><h1 className="mt-2 text-3xl font-bold">Mỗi ngày một chút, tiến xa hơn.</h1><p className="mt-3 text-sm text-white/80">Một góc nhỏ để bạn sắp xếp việc học và chăm sóc mục tiêu của mình.</p></div></div><div className="flex flex-col justify-center p-8 sm:p-12"><div className="mb-8 flex items-center gap-3"><Image src="/isthar-avatar.png" alt="Ishtar" width={44} height={44} className="rounded-full border border-blue-100 object-cover"/><div><p className="font-bold tracking-wide">I.S.H.T.A.R</p><p className="text-xs text-slate-400">Đồng hành cùng việc học</p></div></div><p className="text-sm font-semibold text-blue-500">Chào mừng bạn trở lại</p><h2 className="mt-2 text-3xl font-bold text-slate-800">Bắt đầu nhẹ nhàng nhé.</h2><p className="mt-3 text-sm leading-6 text-slate-500">Đăng nhập để mở không gian học tập của riêng bạn.</p><form onSubmit={login} className="mt-8 space-y-5"><Field label="Địa chỉ email" type="email" placeholder="ban@example.com" value={email} onChange={e => setEmail(e.target.value)} required/><Field label="Mật khẩu" type="password" placeholder="Nhập mật khẩu bất kỳ" value={password} onChange={e => setPassword(e.target.value)} required/><Button type="submit" className="w-full py-3">Đăng nhập <ChevronRight size={17}/></Button></form><p className="mt-5 text-center text-xs leading-5 text-slate-400">Đây là bản trải nghiệm giao diện. Thông tin chỉ được lưu trên trình duyệt của bạn.</p></div></div>{toast && <Toast message={toast} onClose={() => setToast("")}/>}</main>;

  if (!onboarded) return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10"><Card className="w-full max-w-2xl p-6 sm:p-10"><div className="mb-8 flex items-center gap-3"><Image src="/isthar-avatar.png" alt="Ishtar" width={46} height={46} className="rounded-full border border-blue-100 object-cover"/><div><p className="font-bold">I.S.H.T.A.R</p><p className="text-xs text-slate-400">Thiết lập góc học tập của bạn</p></div></div><div className="mb-8 flex gap-2">{["Môn học", "Thời lượng", "Deadline", "Mục tiêu"].map((label, i) => <div key={label} className="flex-1"><div className={`mb-2 h-1.5 rounded-full ${i <= step ? "bg-blue-500" : "bg-slate-100"}`}/><p className={`text-xs ${i === step ? "font-bold text-blue-600" : "text-slate-400"}`}>{label}</p></div>)}</div><p className="text-xs font-bold uppercase tracking-widest text-blue-500">Bước {step + 1}/4</p>{step === 0 && <div className="mt-3"><h1 className="text-2xl font-bold">Bạn muốn tập trung vào môn nào?</h1><p className="mt-2 text-sm text-slate-500">Chọn tất cả môn học bạn đang theo đuổi.</p><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{["Toán", "Vật lý", "Hóa học", "Tiếng Anh", "IELTS", "Tin học", "SAT", "Ngữ văn"].map(s => <button key={s} onClick={() => setSubjects(old => old.includes(s) ? old.filter(x => x !== s) : [...old, s])} className={`rounded-2xl border p-4 text-sm font-semibold transition ${subjects.includes(s) ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-blue-100"}`}>{subjects.includes(s) && <Check size={14} className="mr-1 inline"/>}{s}</button>)}</div></div>}{step === 1 && <div className="mt-3"><h1 className="text-2xl font-bold">Mỗi ngày bạn muốn học bao lâu?</h1><p className="mt-2 text-sm text-slate-500">Chọn mức vừa sức để dễ duy trì lâu dài.</p><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{["1", "2", "3", "4"].map(n => <button key={n} onClick={() => setDailyHours(n)} className={`rounded-2xl border p-5 ${dailyHours === n ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-100"}`}><span className="text-2xl font-bold">{n}</span><span className="mt-1 block text-xs">giờ/ngày</span></button>)}</div></div>}{step === 2 && <div className="mt-3 space-y-5"><h1 className="text-2xl font-bold">Deadline quan trọng tiếp theo?</h1><p className="text-sm text-slate-500">Chọn một mốc để chúng ta cùng lên kế hoạch.</p><Field label="Ngày cần hoàn thành" type="date" value={examDate} onChange={e => setExamDate(e.target.value)}/><Field label="Tên bài thi hoặc công việc" value={examGoal} onChange={e => setExamGoal(e.target.value)} placeholder="Ví dụ: Kiểm tra giữa kỳ Toán"/></div>}{step === 3 && <div className="mt-3 space-y-5"><h1 className="text-2xl font-bold">Mục tiêu nào đang chờ bạn?</h1><p className="text-sm text-slate-500">Mục tiêu rõ ràng giúp mỗi buổi học có ý nghĩa hơn.</p><SelectField label="Kỳ thi mục tiêu" value={examGoal} onChange={e => setExamGoal(e.target.value)}><option>Tốt nghiệp THPT</option><option>IELTS</option><option>SAT</option><option>Thi học kỳ</option><option>Thi đánh giá năng lực</option><option>Khác</option></SelectField><div className="rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-800"><Sparkles size={16} className="mr-2 inline"/>Bạn đã sẵn sàng dành khoảng {dailyHours} giờ mỗi ngày cho {subjects.length} môn học. Không cần hoàn hảo, chỉ cần bắt đầu.</div></div>}<div className="mt-10 flex justify-between"><Button variant="ghost" onClick={() => step === 0 ? (setLoggedIn(false)) : setStep(s => s - 1)}>{step === 0 ? "Đăng xuất" : <><ChevronLeft size={16}/> Quay lại</>}</Button><Button onClick={() => step < 3 ? setStep(s => s + 1) : finishOnboarding()}>{step === 3 ? "Hoàn thành" : "Tiếp tục"} <ChevronRight size={16}/></Button></div></Card>{toast && <Toast message={toast} onClose={() => setToast("")}/>}</main>;

  return <div className="min-h-screen bg-slate-50/70">
    {mobileNav && <button aria-label="Đóng menu" onClick={() => setMobileNav(false)} className="fixed inset-0 z-40 bg-slate-900/20 md:hidden"/>}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-100 bg-white px-4 py-5 transition-transform md:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="mb-9 flex items-center gap-3 px-2"><Image src="/isthar-avatar.png" alt="Ishtar" width={36} height={36} className="rounded-full border border-blue-100 object-cover"/><div><p className="text-sm font-extrabold tracking-[.08em] text-slate-800">I.S.H.T.A.R</p><p className="text-[10px] text-slate-400">Học tập theo cách của bạn</p></div><button className="ml-auto md:hidden" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Không gian học tập</p>
      <nav className="space-y-1">{navigation.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setPage(label); setMobileNav(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${page === label ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Icon size={18} strokeWidth={page === label ? 2.3 : 1.8}/>{label}{page === label && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500"/>}</button>)}</nav>
      <div className="mt-auto rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 p-4"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm"><Star size={18}/></div><p className="text-sm font-bold text-slate-700">Tiến bộ nhỏ mỗi ngày</p><p className="mt-1 text-xs leading-5 text-slate-500">Bạn không cần chạy nhanh hơn ai cả, chỉ cần không bỏ cuộc với chính mình.</p><div className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-600"><Flame size={15}/> {streak} ngày liên tục</div></div>
      <button onClick={() => { setLoggedIn(false); setOnboarded(false); }} className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-700"><LogOut size={17}/> Đăng xuất</button>
    </aside>
    <main className="min-h-screen md:pl-[260px]">
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-100/80 bg-slate-50/90 px-5 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3"><button onClick={() => setMobileNav(true)} className="rounded-xl p-2 text-slate-500 hover:bg-white md:hidden"><Menu size={20}/></button><div><p className="text-xs text-slate-400">Thứ Năm, 29 tháng 10, 2026</p><p className="font-semibold text-slate-700">{page}</p></div></div><div className="flex items-center gap-3"><div className="hidden rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-500 sm:block"><Clock3 size={14} className="mr-2 inline text-blue-500"/> Hôm nay, từng bước một</div><Image src="/isthar-avatar.png" alt="Ảnh đại diện" width={38} height={38} className="rounded-full border border-blue-100 object-cover"/></div>
      </header>
      <div className="mx-auto max-w-[1440px] p-5 sm:p-8">
        {page === "Tổng quan" && <Dashboard tasks={tasks} scores={scores} completed={completed} pending={pending} urgentTasks={urgentTasks} gpa={gpa} setPage={setPage} toggleTask={(id: number) => setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x))}/>}
        {page === "Thời khóa biểu" && <Schedule subjects={subjects} />}
        {page === "Bài tập & Deadline" && <TasksPage tasks={tasks} title={taskTitle} setTitle={setTaskTitle} subject={taskSubject} setSubject={setTaskSubject} due={taskDue} setDue={setTaskDue} priority={taskPriority} setPriority={setTaskPriority} addTask={addTask} toggleTask={id => setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x))} deleteTask={id => setTasks(t => t.filter(x => x.id !== id))} notifyEmail={() => notifyEmail("Đã gửi email nhắc deadline về Gmail của bạn")}/>}
        {page === "Điểm số & GPA" && <Grades scores={scores} gpa={gpa} term={newTerm} setTerm={setNewTerm} score={newGpa} setScore={setNewGpa} addScore={addScore} deleteScore={id => setScores(s => s.filter(x => x.id !== id))}/>}
        {page === "Pomodoro" && <Pomodoro mode={pomodoroMode} timer={timerLabel} cycle={cycle} running={pomodoroRunning} start={() => setPomodoroRunning(true)} pause={() => setPomodoroRunning(false)} reset={() => { setPomodoroRunning(false); setPomodoroMode("Học"); setSecondsLeft(25 * 60); setCycle(1); setToast("Đồng hồ đã được đặt lại."); }}/>}
        {page === "Tài liệu" && <Resources resources={resources} title={resourceTitle} setTitle={setResourceTitle} subject={resourceSubject} setSubject={setResourceSubject} url={resourceUrl} setUrl={setResourceUrl} note={resourceNote} setNote={setResourceNote} add={addResource} remove={id => setResources(r => r.filter(x => x.id !== id))}/>}
        {page === "Ngôn ngữ" && <LanguagesPage cert={cert} setCert={setCert} date={testDate} setDate={setTestDate} target={targetScore} setTarget={setTargetScore} tests={mockTests} score={mockScore} setScore={setMockScore} mockDate={mockDate} setMockDate={setMockDate} addTest={() => { setMockTests(t => [...t, { id: Date.now(), date: mockDate, score: Number(mockScore) }]); setToast("Đã thêm kết quả thi thử."); }}/>}
        {page === "Flashcard" && <Flashcards index={flashIndex} setIndex={setFlashIndex} flipped={flipped} setFlipped={setFlipped} deck={testDeck} testIndex={testIndex} known={knownCount} streak={streak} startTest={startFlashTest} next={nextFlash} notifyMissed={() => notifyEmail("Đã gửi email cảnh báo mất streak về Gmail của bạn")}/>}
      </div>
    </main>
    <button onClick={() => setChatOpen(true)} aria-label="Mở trợ lý Ishtar" className="fixed bottom-6 right-6 z-40 grid h-[62px] w-[62px] place-items-center rounded-full border-2 border-white bg-blue-100 shadow-[0_0_0_5px_rgba(96,165,250,.13),0_8px_28px_rgba(59,130,246,.25)] transition hover:scale-105"><Image src="/isthar-avatar.png" alt="Trợ lý Ishtar" width={58} height={58} className="rounded-full object-cover"/></button>
    {chatOpen && <ChatPanel close={() => setChatOpen(false)} input={chatInput} setInput={setChatInput} messages={chatMessages} send={sendChat} page={page} setPage={setPage}/>}
    {toast && <Toast message={toast} onClose={() => setToast("")}/>}
  </div>;
}

function Dashboard({ tasks, scores, completed, pending, urgentTasks, gpa, setPage, toggleTask }: any) {
  const chartData = [{ day: "T2", hours: 1.5 }, { day: "T3", hours: 2.2 }, { day: "T4", hours: 1.8 }, { day: "T5", hours: 3 }, { day: "T6", hours: 2.5 }, { day: "T7", hours: 3.4 }, { day: "CN", hours: 2 }];
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  return <><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-blue-500">Góc nhỏ của bạn ✦</p><h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Chào bạn! Hôm nay chúng ta cùng cố gắng một chút nhé ✦</h1><p className="mt-2 text-sm text-slate-500">Không cần làm tất cả ngay hôm nay. Chỉ cần bắt đầu từ một điều nhỏ.</p></div><Button onClick={() => setPage("Bài tập & Deadline")}><Plus size={16}/> Thêm công việc</Button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Bài tập đã hoàn thành" value={`${completed}/${tasks.length}`} detail={`${percent}% tổng số công việc`} icon={CheckCircle2} tint="green"/><StatCard label="Việc đang chờ" value={`${pending.length}`} detail="Từng bước giải quyết nhé" icon={ListTodo}/><StatCard label="GPA trung bình" value={gpa.toFixed(2)} detail="Trên thang điểm 10" icon={Trophy} tint="purple"/><StatCard label="Chuỗi ngày học" value="4 ngày" detail="Cứ đều đặn là được!" icon={Flame} tint="orange"/></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]"><Card className="p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold text-slate-800">Nhịp học trong tuần</h3><p className="mt-1 text-xs text-slate-400">Thời gian học ước tính mỗi ngày</p></div><span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600">Tuần này</span></div><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} barSize={24}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }}/><Tooltip cursor={{ fill: "#eff6ff" }}/><Bar dataKey="hours" name="Giờ học" fill="#7cc4f4" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div></Card>
      <Card className="p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold text-slate-800">Deadline cần chú ý</h3><p className="mt-1 text-xs text-slate-400">Những việc sắp đến hạn</p></div><button onClick={() => setPage("Bài tập & Deadline")} className="text-xs font-semibold text-blue-600">Xem tất cả</button></div>{urgentTasks.length ? <div className="space-y-3">{urgentTasks.slice(0, 4).map((t: Task) => <div key={t.id} className="flex items-start gap-3 rounded-2xl bg-rose-50/70 p-3"><div className="mt-0.5 rounded-lg bg-white p-2 text-rose-500"><AlarmClock size={16}/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-700">{t.title}</p><p className="mt-1 text-xs text-slate-400">{t.subject} · {formatDate(t.due)}</p></div><span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-600">{t.priority}</span></div>)}</div> : <EmptyState title="Bạn đang khá thong thả!" body="Chưa có deadline nào trong 2 ngày tới."/>}</Card></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-2"><Card className="p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold text-slate-800">Việc tiếp theo</h3><p className="mt-1 text-xs text-slate-400">Đánh dấu khi bạn hoàn thành</p></div><ListTodo className="text-blue-500" size={19}/></div><div className="space-y-2">{pending.slice(0, 4).map((t: Task) => <button key={t.id} onClick={() => toggleTask(t.id)} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"><span className="h-5 w-5 rounded-md border border-slate-200 bg-white"/><span className="min-w-0 flex-1 truncate text-sm text-slate-600">{t.title}</span><span className="text-xs text-slate-400">{formatDate(t.due)}</span></button>)}{pending.length === 0 && <EmptyState title="Mọi việc đã xong!" body="Tuyệt vời, bạn có thể nghỉ ngơi một chút."/>}</div></Card><Card className="flex items-center gap-5 bg-gradient-to-br from-blue-50/70 to-white p-6"><div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white text-blue-500 shadow-sm sm:flex"><Target size={34}/></div><div><p className="text-xs font-bold uppercase tracking-widest text-blue-500">Nhắc nhở dịu dàng</p><h3 className="mt-2 text-lg font-bold text-slate-800">Tiến bộ không cần hoàn hảo.</h3><p className="mt-2 text-sm leading-6 text-slate-500">Một phiên học tập trung 25 phút cũng là một chiến thắng. Hãy cho bản thân cơ hội bắt đầu nhé.</p><button onClick={() => setPage("Pomodoro")} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">Bắt đầu Pomodoro <ArrowUpRight size={16}/></button></div></Card></div>
  </>;
}

function TasksPage({ tasks, title, setTitle, subject, setSubject, due, setDue, priority, setPriority, addTask, toggleTask, deleteTask, notifyEmail }: any) {
  const [filter, setFilter] = useState("Tất cả");
  const filtered = tasks.filter((t: Task) => filter === "Tất cả" || (filter === "Đã xong" ? t.done : !t.done));
  return <><SectionHeading title="Bài tập & Deadline" description="Ghi lại những điều cần làm để đầu óc được thảnh thơi hơn."/><Card className="mb-5 p-5"><form onSubmit={addTask} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><div className="xl:col-span-2"><Field label="Tên công việc" placeholder="Ví dụ: Ôn tập chương 2" value={title} onChange={e => setTitle(e.target.value)} required/></div><SelectField label="Môn học" value={subject} onChange={e => setSubject(e.target.value)}>{["Toán", "Vật lý", "Hóa học", "Tiếng Anh", "IELTS", "SAT", "Tin học", "Khác"].map(s => <option key={s}>{s}</option>)}</SelectField><Field label="Ngày đến hạn" type="date" value={due} onChange={e => setDue(e.target.value)} required/><SelectField label="Mức ưu tiên" value={priority} onChange={e => setPriority(e.target.value)}><option>Cao</option><option>Vừa</option><option>Thấp</option></SelectField><div className="md:col-span-2 xl:col-span-5"><Button type="submit"><Plus size={16}/> Thêm công việc</Button></div></form></Card><Card className="p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold text-slate-800">Danh sách của bạn <span className="ml-1 text-sm font-normal text-slate-400">({filtered.length})</span></h3><div className="flex gap-1 rounded-xl bg-slate-50 p-1">{["Tất cả", "Đang làm", "Đã xong"].map(f => <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${filter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}>{f}</button>)}</div></div><div className="space-y-3">{filtered.map((t: Task) => <div key={t.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${t.done ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100"}`}><button aria-label="Đánh dấu hoàn thành" onClick={() => toggleTask(t.id)} className={`grid h-6 w-6 place-items-center rounded-lg border ${t.done ? "border-emerald-400 bg-emerald-400 text-white" : "border-slate-200 bg-white text-transparent"}`}><Check size={14}/></button><div className="min-w-[180px] flex-1"><p className={`text-sm font-semibold ${t.done ? "text-slate-400 line-through" : "text-slate-700"}`}>{t.title}</p><p className="mt-1 text-xs text-slate-400">{t.subject} · Hạn {formatDate(t.due)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${t.priority === "Cao" ? "bg-rose-50 text-rose-600" : t.priority === "Vừa" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>{t.priority}</span><button onClick={() => notifyEmail()} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Mô phỏng email nhắc nhở"><AlarmClock size={17}/></button><button onClick={() => deleteTask(t.id)} className="rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={16}/></button></div>)}{filtered.length === 0 && <EmptyState title="Danh sách đang trống" body="Thêm một việc nhỏ để bắt đầu nhé."/>}</div></Card></>;
}

function Schedule({ subjects }: { subjects: string[] }) {
  const days = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
  const slots = [{ time: "07:30", title: "Ôn bài trên lớp", subject: subjects[0] || "Toán", color: "bg-blue-50 border-blue-100 text-blue-700" }, { time: "15:00", title: "Buổi học tập trung", subject: subjects[1] || "Tiếng Anh", color: "bg-violet-50 border-violet-100 text-violet-700" }, { time: "19:30", title: "Ôn tập và làm bài", subject: subjects[2] || "Vật lý", color: "bg-emerald-50 border-emerald-100 text-emerald-700" }];
  return <><SectionHeading title="Thời khóa biểu" description="Một lịch trình vừa sức để bạn luôn biết mình cần làm gì tiếp theo."/><div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><StatCard label="Buổi học mỗi ngày" value="3 buổi" detail="Sáng · Chiều · Tối" icon={CalendarDays}/><StatCard label="Mục tiêu hôm nay" value="3 giờ" detail="Chia nhỏ để dễ tập trung" icon={Clock3} tint="purple"/></div><Card className="overflow-hidden p-4 sm:p-6"><div className="mb-5 flex items-center justify-between"><h3 className="font-bold">Lịch tuần của bạn</h3><span className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600">Tuần hiện tại</span></div><div className="grid grid-cols-7 gap-2">{days.map((d, i) => <div key={d} className={`rounded-xl py-3 text-center text-xs font-semibold ${i === 3 ? "bg-blue-500 text-white" : "bg-slate-50 text-slate-500"}`}><span className="hidden sm:block">{d}</span><span className="sm:hidden">{["T2","T3","T4","T5","T6","T7","CN"][i]}</span><span className="mt-1 block text-lg">{26 + i}</span></div>)}</div><div className="mt-6 space-y-4">{slots.map((slot, i) => <div key={slot.time} className="grid grid-cols-[65px_1fr] gap-4"><div className="pt-4 text-xs font-semibold text-slate-400">{slot.time}</div><div className={`rounded-2xl border p-4 ${slot.color}`}><div className="flex items-center justify-between gap-2"><div><p className="text-sm font-bold">{slot.title}</p><p className="mt-1 text-xs opacity-70">{slot.subject} · {i === 0 ? "45 phút" : i === 1 ? "60 phút" : "75 phút"}</p></div><Clock3 size={17}/></div></div></div>)}</div><p className="mt-5 text-xs text-slate-400">Lịch mẫu có thể tùy chỉnh theo thời gian biểu thực tế của bạn.</p></Card></>;
}

function Grades({ scores, gpa, term, setTerm, score, setScore, addScore, deleteScore }: any) {
  return <><SectionHeading title="Điểm số & GPA" description="Theo dõi hành trình tiến bộ của bạn qua từng đợt học."/><div className="mb-5 grid gap-4 sm:grid-cols-3"><StatCard label="GPA trung bình" value={gpa.toFixed(2)} detail="Thang điểm 10" icon={Trophy} tint="purple"/><StatCard label="Đợt đã ghi nhận" value={`${scores.length}`} detail="Các mốc điểm đã lưu" icon={BookOpen}/><StatCard label="Mục tiêu gợi ý" value="8.5+" detail="Tiến từng bước nhỏ" icon={Target} tint="green"/></div><div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]"><Card className="p-5 sm:p-6"><h3 className="font-bold">Xu hướng GPA</h3><p className="mt-1 text-xs text-slate-400">Biểu đồ thay đổi điểm trung bình theo đợt</p><div className="mt-5 h-[290px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={scores}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7"/><XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }}/><YAxis domain={[0,10]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }}/><Tooltip/><Line dataKey="gpa" name="GPA" stroke="#60a5fa" strokeWidth={3} dot={{ fill: "#60a5fa", r: 5 }}/></LineChart></ResponsiveContainer></div></Card><Card className="p-5 sm:p-6"><h3 className="font-bold">Thêm kết quả</h3><p className="mt-1 text-xs text-slate-400">Nhập điểm trung bình của một học kỳ hoặc đợt thi.</p><form onSubmit={addScore} className="mt-5 space-y-4"><Field label="Tên đợt / học kỳ" value={term} onChange={e => setTerm(e.target.value)} placeholder="Ví dụ: HK2 lớp 12" required/><Field label="Điểm trung bình (0–10)" type="number" min="0" max="10" step="0.1" value={score} onChange={e => setScore(e.target.value)} required/><Button type="submit" className="w-full"><Plus size={16}/> Lưu điểm số</Button></form><div className="mt-6 space-y-2">{scores.map((s: Score) => <div key={s.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-blue-500"><GraduationCap size={17}/></div><span className="flex-1 text-sm font-medium text-slate-600">{s.term}</span><span className="font-bold text-slate-800">{s.gpa.toFixed(1)}</span><button onClick={() => deleteScore(s.id)} className="text-slate-300 hover:text-rose-500"><X size={15}/></button></div>)}</div></Card></div></>;
}

function Pomodoro({ mode, timer, cycle, running, start, pause, reset }: any) {
  const total = mode === "Học" ? 25 * 60 : 5 * 60;
  const [minutes, seconds] = timer.split(":").map(Number);
  const left = minutes * 60 + seconds;
  const progress = Math.max(0, Math.min(100, (1 - left / total) * 100));
  return <><SectionHeading title="Pomodoro" description="Tập trung trong khoảng thời gian ngắn, sau đó cho đầu óc nghỉ ngơi."/><div className="mx-auto max-w-3xl"><Card className="overflow-hidden p-6 sm:p-10"><div className="rounded-[2rem] bg-gradient-to-br from-blue-50 via-white to-sky-50 px-4 py-10 text-center"><div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-semibold text-blue-600"><span className={`h-2 w-2 rounded-full ${running ? "animate-pulse bg-emerald-400" : "bg-slate-300"}`}/>{mode === "Học" ? "Thời gian tập trung" : "Nghỉ ngơi một chút"}</div><div className="relative mx-auto grid h-64 w-64 place-items-center rounded-full" style={{ background: `conic-gradient(#60a5fa ${progress}%, #e8f2fb ${progress}% 100%)` }}><div className="grid h-[224px] w-[224px] place-items-center rounded-full bg-white shadow-inner"><div><p className="text-6xl font-light tracking-tight text-slate-800 tabular-nums">{timer}</p><p className="mt-3 text-sm text-slate-400">Chu kỳ {cycle}/4</p></div></div></div><div className="mt-8 flex flex-wrap justify-center gap-3">{!running ? <Button onClick={start} className="min-w-32"><Play size={17} fill="currentColor"/> Bắt đầu</Button> : <Button onClick={pause} variant="secondary" className="min-w-32"><Pause size={17} fill="currentColor"/> Tạm dừng</Button>}<Button onClick={reset} variant="ghost"><RotateCcw size={16}/> Đặt lại</Button></div></div><div className="mt-6 grid grid-cols-4 gap-3">{[1,2,3,4].map(n => <div key={n} className={`rounded-2xl p-3 text-center ${n < cycle ? "bg-emerald-50 text-emerald-600" : n === cycle ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"}`}><div className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-bold">{n < cycle ? <Check size={15}/> : n}</div><p className="text-[11px] font-semibold">{n} {n === 1 ? "lượt" : "lượt"}</p></div>)}</div><p className="mt-5 text-center text-xs leading-5 text-slate-400">Một chu kỳ gồm 25 phút học và 5 phút nghỉ. Hoàn thành 4 chu kỳ để kết thúc phiên.</p></Card></div></>;
}

function Resources({ resources, title, setTitle, subject, setSubject, url, setUrl, note, setNote, add, remove }: any) {
  return <><SectionHeading title="Tài liệu học tập" description="Gom những đường dẫn hữu ích vào một nơi để dễ tìm lại khi cần."/><Card className="mb-5 p-5"><form onSubmit={add} className="grid gap-4 md:grid-cols-2"><Field label="Tên tài liệu" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Bộ đề IELTS" required/><SelectField label="Môn học" value={subject} onChange={e => setSubject(e.target.value)}>{["Toán","Vật lý","Hóa học","Tiếng Anh","IELTS","SAT","Tin học","Khác"].map(s => <option key={s}>{s}</option>)}</SelectField><Field label="Đường dẫn" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."/><Field label="Ghi chú" value={note} onChange={e => setNote(e.target.value)} placeholder="Điều cần nhớ về tài liệu này"/><div className="md:col-span-2"><Button type="submit"><Plus size={16}/> Lưu tài liệu</Button></div></form></Card><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{resources.map((r: Resource) => <Card key={r.id} className="p-5"><div className="mb-4 flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-500"><FileText size={21}/></div><button onClick={() => remove(r.id)} className="rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={16}/></button></div><span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">{r.subject}</span><h3 className="mt-3 font-bold text-slate-800">{r.title}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{r.note || "Chưa có ghi chú."}</p><a href={r.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">Mở tài liệu <ArrowUpRight size={15}/></a></Card>)}{resources.length === 0 && <EmptyState title="Chưa có tài liệu" body="Lưu đường dẫn đầu tiên để bắt đầu bộ sưu tập."/>}</div></>;
}

function LanguagesPage({ cert, setCert, date, setDate, target, setTarget, tests, score, setScore, mockDate, setMockDate, addTest }: any) {
  const maxScore = cert === "IELTS" ? 9 : 1600;
  const chart = tests.map((t: MockTest, i: number) => ({ ...t, label: `Lần ${i + 1}` }));
  return <><SectionHeading title="Lộ trình ngôn ngữ" description="Chia mục tiêu lớn thành những cột mốc nhỏ, có thể theo dõi được."/><div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]"><Card className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-500"><Languages size={21}/></div><div><h3 className="font-bold">Mục tiêu chứng chỉ</h3><p className="text-xs text-slate-400">Điều chỉnh theo kế hoạch của bạn</p></div></div><div className="space-y-4"><SelectField label="Chứng chỉ mục tiêu" value={cert} onChange={e => { setCert(e.target.value); setTarget(e.target.value === "IELTS" ? "7.0" : "1500"); }}><option>IELTS</option><option>SAT</option></SelectField><Field label={cert === "IELTS" ? "Điểm mục tiêu (0–9)" : "Điểm mục tiêu (400–1600)"} type="number" min={cert === "IELTS" ? 0 : 400} max={maxScore} step={cert === "IELTS" ? 0.5 : 10} value={target} onChange={e => setTarget(e.target.value)}/><Field label="Ngày thi dự kiến" type="date" value={date} onChange={e => setDate(e.target.value)}/></div><div className="mt-5 rounded-2xl bg-blue-50 p-4"><p className="text-xs font-semibold text-blue-600">Mục tiêu của bạn</p><p className="mt-1 text-2xl font-bold text-slate-800">{cert} {target}</p><p className="mt-1 text-xs text-slate-500">Ngày thi: {formatDate(date)}</p></div><div className="mt-5 space-y-3">{[{week:"Tuần 1–2", title:"Củng cố nền tảng", desc:"Ôn ngữ pháp, từ vựng và dạng bài cốt lõi."},{week:"Tuần 3–4", title:"Luyện kỹ năng", desc:"Chia đều thời gian cho từng kỹ năng."},{week:"Mỗi cuối tuần", title:"Thi thử và xem lại lỗi", desc:"Ghi điểm, phân tích lỗi sai, điều chỉnh lịch."}].map(x => <div key={x.week} className="flex gap-3"><div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-400"/><div><p className="text-xs font-bold text-blue-600">{x.week}</p><p className="mt-1 text-sm font-semibold text-slate-700">{x.title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{x.desc}</p></div></div>)}</div></Card><div className="space-y-5"><Card className="p-5 sm:p-6"><h3 className="font-bold">Tiến bộ qua các lần thi thử</h3><p className="mt-1 text-xs text-slate-400">Ghi nhận điểm số để nhìn thấy sự thay đổi</p><div className="mt-4 h-[250px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }}/><YAxis domain={[0, maxScore]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }}/><Tooltip/><Line dataKey="score" name="Điểm thi thử" stroke="#8b9df6" strokeWidth={3} dot={{ r: 5 }}/></LineChart></ResponsiveContainer></div></Card><Card className="p-5 sm:p-6"><h3 className="font-bold">Thêm điểm thi thử</h3><form onSubmit={e => { e.preventDefault(); addTest(); }} className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Ngày thi thử" type="date" value={mockDate} onChange={e => setMockDate(e.target.value)} required/><Field label="Điểm số" type="number" min="0" max={maxScore} step={cert === "IELTS" ? "0.5" : "10"} value={score} onChange={e => setScore(e.target.value)} required/><div className="sm:col-span-2"><Button type="submit"><Plus size={16}/> Thêm kết quả</Button></div></form></Card></div></div></>;
}

function Flashcards({ index, setIndex, flipped, setFlipped, deck, testIndex, known, streak, startTest, next, notifyMissed }: any) {
  const card = deck ? deck[testIndex] : vocabulary[index % vocabulary.length];
  const [customFront, setCustomFront] = useState(""); const [customBack, setCustomBack] = useState("");
  return <><SectionHeading title="Flashcard từ vựng" description="Học một ít mỗi ngày sẽ giúp bạn nhớ lâu hơn. Hãy thử tự nhớ nghĩa trước khi lật thẻ."/><div className="mb-5 grid gap-4 sm:grid-cols-3"><StatCard label="Chuỗi ngày học" value={`${streak} ngày`} detail="Giữ nhịp học đều đặn nhé" icon={Flame} tint="orange"/><StatCard label="Từ trong kho mẫu" value={`${vocabulary.length} từ`} detail="Từ vựng tiếng Anh học thuật" icon={BookOpen}/><StatCard label="Bài kiểm tra hôm nay" value={deck ? `${testIndex + 1}/20` : "Chưa làm"} detail="Bốc ngẫu nhiên 20 từ" icon={Target} tint="purple"/></div><div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><Card className="p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">{deck ? `Kiểm tra hôm nay · ${testIndex + 1}/20` : "Thẻ học của bạn"}</span><button onClick={() => setFlipped(false)} className="text-xs text-slate-400 hover:text-blue-600">Ẩn nghĩa</button></div><button onClick={() => setFlipped(v => !v)} className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-8 text-center transition hover:border-blue-200"><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-400">{flipped ? "Nghĩa của từ" : "Bạn nhớ nghĩa không?"}</p><h2 className="mt-5 text-3xl font-bold text-slate-800">{flipped ? card[1] : card[0]}</h2><p className="mt-5 text-sm text-slate-400">{flipped ? "Bấm để xem lại mặt trước" : "Bấm vào thẻ để lật mặt sau"}</p></button>{deck ? <div className="mt-5 flex gap-3"><Button variant="secondary" className="flex-1" onClick={() => next(false)}><X size={16}/> Chưa nhớ</Button><Button className="flex-1" onClick={() => next(true)}><Check size={16}/> Đã nhớ</Button></div> : <div className="mt-5 flex items-center justify-between"><Button variant="ghost" onClick={() => { setIndex((index + vocabulary.length - 1) % vocabulary.length); setFlipped(false); }}><ChevronLeft size={17}/> Trước</Button><span className="text-xs text-slate-400">{index + 1}/{vocabulary.length}</span><Button variant="ghost" onClick={() => { setIndex((index + 1) % vocabulary.length); setFlipped(false); }}>Tiếp <ChevronRight size={17}/></Button></div>}<Button onClick={startTest} className="mt-4 w-full"><Sparkles size={16}/> Test hôm nay · 20 từ ngẫu nhiên</Button></Card><div className="space-y-5"><Card className="bg-gradient-to-br from-orange-50 to-white p-6"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm"><Flame size={25}/></div><div><p className="text-sm font-semibold text-slate-500">Chuỗi học liên tục</p><p className="text-2xl font-bold text-slate-800">{streak} ngày <span className="text-base">🔥</span></p></div></div><p className="mt-4 text-sm leading-6 text-slate-500">Chỉ cần vài phút mỗi ngày cũng có thể tạo nên khác biệt. Đừng quên quay lại ôn bài nhé!</p><button onClick={notifyMissed} className="mt-4 text-xs font-semibold text-orange-600">Mô phỏng cảnh báo mất chuỗi học</button></Card><Card className="p-5"><h3 className="font-bold">Mẹo học từ vựng</h3><div className="mt-4 space-y-4">{[{n:"01",t:"Đoán trước khi lật",d:"Cố nhớ nghĩa trong đầu rồi mới xem đáp án."},{n:"02",t:"Đặt câu của riêng bạn",d:"Liên hệ từ mới với một tình huống quen thuộc."},{n:"03",t:"Ôn lại sau một ngày",d:"Những từ khó nhớ nên xuất hiện thường xuyên hơn."}].map(x => <div key={x.n} className="flex gap-3"><span className="text-xs font-bold text-blue-500">{x.n}</span><div><p className="text-sm font-semibold text-slate-700">{x.t}</p><p className="mt-1 text-xs leading-5 text-slate-400">{x.d}</p></div></div>)}</div></Card><Card className="p-5"><h3 className="font-bold">Thêm thẻ riêng</h3><p className="mt-1 text-xs text-slate-400">Bản mẫu này lưu thẻ mới trong phiên hiện tại.</p><form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); if (customFront.trim() && customBack.trim()) { vocabulary.push([customFront.trim(), customBack.trim()]); setCustomFront(""); setCustomBack(""); } }}><input value={customFront} onChange={e => setCustomFront(e.target.value)} placeholder="Từ hoặc cụm từ" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-300" required/><input value={customBack} onChange={e => setCustomBack(e.target.value)} placeholder="Nghĩa / định nghĩa" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-300" required/><Button type="submit" variant="secondary" className="w-full"><Plus size={15}/> Thêm thẻ</Button></form></Card></div></div></>;
}

function ChatPanel({ close, input, setInput, messages, send, page, setPage }: any) {
  return <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/20 backdrop-blur-[2px]" onClick={close}><section onClick={e => e.stopPropagation()} className="flex h-full w-full max-w-[410px] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300"><div className="flex items-center gap-3 border-b border-slate-100 p-5"><div className="relative"><Image src="/isthar-avatar.png" alt="Ishtar" width={46} height={46} className="rounded-full border border-blue-100 object-cover"/><span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400"/></div><div className="flex-1"><h3 className="font-bold text-slate-800">Trợ lý Ishtar</h3><p className="text-xs text-blue-500">Đang ở đây để hỗ trợ bạn</p></div><button onClick={close} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50"><X size={18}/></button></div><div className="flex-1 space-y-4 overflow-y-auto p-5 soft-scrollbar"><div className="flex gap-2"><Image src="/isthar-avatar.png" alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover"/><div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-blue-50 p-3.5 text-sm leading-6 text-slate-700">Cần gì thì nói mau, ta không có rảnh cả ngày đâu đấy!</div></div><button onClick={() => { send("Hôm nay chưa học 20 từ Flashcard"); setPage("Flashcard"); }} className="w-full rounded-2xl border border-amber-100 bg-amber-50 p-3 text-left text-xs leading-5 text-amber-800">⚠️ Này, hôm nay chưa học 20 từ Flashcard đâu đấy! Không mau học đi thì mất streak ráng chịu!</button><button onClick={() => { send("Deadline Toán sắp đến, giúp tôi tập trung"); setPage("Pomodoro"); }} className="w-full rounded-2xl border border-blue-100 bg-blue-50 p-3 text-left text-xs leading-5 text-blue-800">💡 Deadline Toán sắp đến rồi kìa. Ta mở Pomodoro cho rồi đấy, lo mà tập trung vào!</button>{messages.map((m: any, i: number) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>{m.role === "ishtar" && <Image src="/isthar-avatar.png" alt="" width={26} height={26} className="mr-2 h-7 w-7 rounded-full object-cover"/>}<div className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-6 ${m.role === "user" ? "rounded-tr-sm bg-blue-500 text-white" : "rounded-tl-sm bg-slate-100 text-slate-700"}`}>{m.text}</div></div>)}</div><form onSubmit={e => { e.preventDefault(); send(); }} className="border-t border-slate-100 p-4"><div className="flex items-center gap-2 rounded-2xl border border-slate-200 p-2 focus-within:border-blue-300"><input value={input} onChange={e => setInput(e.target.value)} placeholder="Nhắn gì đó cho Ishtar..." className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" /><button aria-label="Gửi tin nhắn" className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500 text-white hover:bg-blue-600"><Send size={16}/></button></div><p className="mt-2 text-center text-[10px] text-slate-400">Trợ lý mô phỏng — phản hồi được tạo theo mẫu có sẵn.</p></form></section></div>;
}
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return <div role="status" className="fixed bottom-5 left-1/2 z-[100] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-xl"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><CheckCircle2 size={17}/></div><span>{message}</span><button onClick={onClose} className="ml-1 text-slate-400 hover:text-slate-700"><X size={15}/></button></div>;
}