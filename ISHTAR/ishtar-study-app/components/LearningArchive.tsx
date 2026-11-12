"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, BookOpen, CheckCircle2, Clock3, Flame, GraduationCap, RefreshCw } from "lucide-react";
import { getLearningEventLabel, readLearningArchive, type LearningEvent } from "./learningArchive";

function eventDescription(event: LearningEvent) {
  const p = event.payload;
  switch (event.type) {
    case "task_created":
    case "task_completed":
      return String(p.title || "Nhiệm vụ");
    case "pomodoro_completed":
      return `${Number(p.durationMinutes) || 25} phút tập trung${p.subject ? ` · ${String(p.subject)}` : ""}`;
    case "vocabulary_added":
    case "vocabulary_mastered":
    case "vocabulary_review":
      return String(p.term || "Từ vựng");
    case "flashcard_round_completed":
      return `Vòng ${Number(p.round) || 1} · ${Number(p.score) || 0}/${Number(p.total) || 0} câu đúng`;
    case "grade_recorded":
      return `${String(p.subject || "Môn học")} · ${String(p.score ?? "")}`;
    case "goal_score_recorded":
      return `${String(p.exam || "Mục tiêu")} · ${String(p.score ?? "")} điểm`;
    default:
      return "Hoạt động học tập";
  }
}

function eventIcon(type: LearningEvent["type"]) {
  if (type.includes("task")) return CheckCircle2;
  if (type === "pomodoro_completed") return Clock3;
  if (type.includes("vocabulary") || type.includes("flashcard")) return BookOpen;
  if (type.includes("score") || type === "grade_recorded") return GraduationCap;
  return Flame;
}

export default function LearningArchive() {
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [filter, setFilter] = useState("all");

  const refresh = () => setEvents(readLearningArchive());
  useEffect(() => {
    refresh();
    window.addEventListener("ishtar:archive-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("ishtar:archive-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const filtered = useMemo(
    () => filter === "all" ? events : events.filter((event) => event.type.startsWith(filter)),
    [events, filter],
  );
  const counts = useMemo(() => ({
    tasks: events.filter((event) => event.type.startsWith("task_")).length,
    focus: events.filter((event) => event.type === "pomodoro_completed").length,
    words: events.filter((event) => event.type.startsWith("vocabulary_") || event.type.startsWith("flashcard_")).length,
    scores: events.filter((event) => event.type.includes("score") || event.type === "grade_recorded").length,
  }), [events]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700"><Archive size={23}/></span>
          <div><h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">Learning Archive</h1><p className="mt-1 text-sm text-stone-400">Nhật ký các cột mốc học tập được ghi nhận theo thời gian.</p></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><CheckCircle2 className="text-emerald-600"/><p className="mt-2 text-xs text-slate-500">Nhiệm vụ</p><b className="text-2xl">{counts.tasks}</b></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><Clock3 className="text-blue-600"/><p className="mt-2 text-xs text-slate-500">Phiên tập trung</p><b className="text-2xl">{counts.focus}</b></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><BookOpen className="text-violet-600"/><p className="mt-2 text-xs text-slate-500">Từ vựng & Flashcard</p><b className="text-2xl">{counts.words}</b></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><GraduationCap className="text-amber-600"/><p className="mt-2 text-xs text-slate-500">Điểm số</p><b className="text-2xl">{counts.scores}</b></div>
      </div>
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold text-slate-800">Lịch sử học tập</h2><p className="mt-1 text-xs text-slate-400">{events.length} sự kiện đã ghi nhận trên thiết bị này</p></div>
          <div className="flex items-center gap-2">
            <select aria-label="Lọc lịch sử" value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="all">Tất cả hoạt động</option><option value="task_">Nhiệm vụ</option><option value="pomodoro_">Pomodoro</option><option value="vocabulary_">Từ vựng</option><option value="flashcard_">Flashcard</option><option value="grade_">Điểm số</option><option value="goal_">Mục tiêu</option>
            </select>
            <button type="button" onClick={refresh} aria-label="Làm mới lịch sử" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><RefreshCw size={17}/></button>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {filtered.length ? filtered.slice(0, 200).map((event) => {
            const Icon = eventIcon(event.type);
            return <article key={event.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-600"><Icon size={17}/></span>
              <div className="min-w-0 flex-1"><b className="block text-sm text-slate-800">{getLearningEventLabel(event.type)}</b><p className="mt-0.5 break-words text-sm text-slate-600">{eventDescription(event)}</p><time className="mt-1 block text-xs text-slate-400">{new Date(event.occurredAt).toLocaleString("vi-VN",{dateStyle:"medium",timeStyle:"short"})}</time></div>
            </article>;
          }) : <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center"><Archive className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-medium text-slate-600">Chưa có hoạt động trong mục này.</p><p className="mt-1 text-xs text-slate-400">Khi bạn học và hoàn thành các cột mốc, chúng sẽ xuất hiện ở đây.</p></div>}
          {filtered.length > 200 && <p className="text-center text-xs text-slate-400">Đang hiển thị 200 sự kiện gần nhất trong bộ lọc.</p>}
        </div>
      </section>
      <p className="text-xs leading-5 text-slate-400">Bản hiện tại lưu Archive trên trình duyệt này. Đồng bộ giữa laptop và điện thoại sẽ được triển khai ở giai đoạn tài khoản và cơ sở dữ liệu đám mây.</p>
    </div>
  );
}
