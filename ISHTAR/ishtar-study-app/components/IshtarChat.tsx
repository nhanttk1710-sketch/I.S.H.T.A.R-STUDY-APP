"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { GripVertical, MessageCircle, Minus, Send } from "lucide-react";

const replies = [
  "Hừm, ít nhất ngươi cũng biết hỏi đấy. Cứ chia việc lớn thành từng bước nhỏ đi!",
  "Đừng có bỏ cuộc giữa chừng nhé. Ta chỉ nhắc vậy thôi, không phải lo cho ngươi đâu!",
  "Tập trung 25 phút trước đã. Nghỉ ngơi đúng lúc cũng quan trọng đấy!",
  "Ngươi làm được mà. Nhưng đừng để ta phải nhắc lần thứ hai nhé!",
];

const POSITION_KEY = "ishtar_assistant_position_v1";
const EDGE = 12;
const AVATAR_SIZE = 60;

type Position = { right: number; bottom: number };
type Viewport = { width: number; height: number };
type DragState = {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  startRight: number;
  startBottom: number;
  moved: boolean;
  handle: "avatar" | "header";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export default function IshtarChat({
  onNavigate,
}: {
  onNavigate: (tab: "flashcards" | "pomodoro" | "tasks") => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [position, setPosition] = useState<Position>({ right: EDGE, bottom: EDGE });
  const [viewport, setViewport] = useState<Viewport>({ width: 1280, height: 800 });
  const [dragging, setDragging] = useState(false);
  const [positionReady, setPositionReady] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<{ from: "ai" | "me"; text: string }[]>([
    { from: "ai", text: "Cần gì thì nói mau, ta không có rảnh cả ngày đâu đấy!" },
  ]);

  useEffect(() => {
    const readViewport = () => {
      const next = { width: window.innerWidth, height: window.innerHeight };
      setViewport(next);
      setPosition((current) => ({
        right: clamp(current.right, EDGE, next.width - AVATAR_SIZE - EDGE),
        bottom: clamp(current.bottom, EDGE, next.height - AVATAR_SIZE - EDGE),
      }));
    };

    readViewport();
    window.addEventListener("resize", readViewport);

    try {
      const saved = localStorage.getItem(POSITION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Number.isFinite(parsed?.right) && Number.isFinite(parsed?.bottom)) {
          setPosition({
            right: clamp(parsed.right, EDGE, window.innerWidth - AVATAR_SIZE - EDGE),
            bottom: clamp(parsed.bottom, EDGE, window.innerHeight - AVATAR_SIZE - EDGE),
          });
        }
      }
    } catch {
      // Invalid or unavailable saved data falls back to the default corner.
    }
    setPositionReady(true);

    return () => window.removeEventListener("resize", readViewport);
  }, []);

  useEffect(() => {
    if (!positionReady || dragging) return;
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    } catch {
      // Position persistence is optional when browser storage is unavailable.
    }
  }, [position, positionReady, dragging]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const handle = target.closest<HTMLElement>("[data-assistant-drag]")?.dataset.assistantDrag;
    if (handle !== "avatar" && handle !== "header") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      startRight: position.right,
      startBottom: position.bottom,
      moved: false,
      handle,
    };

    try {
      widgetRef.current?.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture may be unavailable in unusual embedded browsers.
    }
    setDragging(true);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.pointerX;
    const dy = event.clientY - drag.pointerY;
    if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;

    setPosition({
      right: clamp(drag.startRight - dx, EDGE, viewport.width - AVATAR_SIZE - EDGE),
      bottom: clamp(drag.startBottom - dy, EDGE, viewport.height - AVATAR_SIZE - EDGE),
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setDragging(false);

    if (!cancelled && !drag.moved && drag.handle === "avatar") {
      setOpen((current) => !current);
    }

    try {
      if (widgetRef.current?.hasPointerCapture(event.pointerId)) {
        widgetRef.current.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore capture cleanup failures.
    }
  };

  const send = (text = input) => {
    if (!text.trim()) return;
    setMessages((current) => [
      ...current,
      { from: "me", text: text.trim() },
      { from: "ai", text: replies[Math.floor(Math.random() * replies.length)] },
    ]);
    setInput("");
  };

  const panelWidth = Math.min(360, Math.max(0, viewport.width - EDGE * 2));
  const panelMaxRight = Math.max(EDGE, viewport.width - panelWidth - EDGE);
  const panelRight = clamp(position.right, EDGE, panelMaxRight);
  const panelOffset = position.right - panelRight;

  return (
    <div
      ref={widgetRef}
      className="fixed z-[60] h-[60px] w-[60px] select-none"
      style={{ right: position.right, bottom: position.bottom }}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={(event) => endDrag(event)}
      onPointerCancel={(event) => endDrag(event, true)}
      onLostPointerCapture={() => {
        if (dragRef.current) {
          dragRef.current = null;
          setDragging(false);
        }
      }}
    >
      {open && (
        <section
          aria-label="Trợ lý Ishtar"
          className="absolute bottom-[72px] flex h-[min(500px,calc(100dvh-104px))] w-[min(360px,calc(100vw-24px))] flex-col overflow-hidden rounded-[22px] border border-orange-100 bg-white shadow-[0_12px_45px_rgba(80,50,15,.22)]"
          style={{ right: panelOffset }}
        >
          <header
            data-assistant-drag="header"
            className={`flex shrink-0 touch-none select-none items-center justify-between bg-gradient-to-r from-amber-600 to-amber-500 px-3 py-3 text-white ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
            title="Giữ và kéo để di chuyển trợ lý"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <GripVertical size={16} className="shrink-0 text-amber-100/80" />
              <img src="/isthar-avatar.png" className="h-9 w-9 rounded-full border border-white/60" alt="Ishtar" draggable={false} />
              <div className="min-w-0">
                <b className="text-sm">Ishtar</b>
                <p className="text-[11px] text-amber-50">Trợ lý học tập</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Thu nhỏ trợ lý"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/15"
            >
              <Minus size={18} />
            </button>
          </header>

          <div className="soft-scrollbar flex-1 space-y-3 overflow-y-auto bg-[#faf9f6] p-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-[13px] leading-relaxed ${message.from === "ai" ? "bg-white text-slate-700 shadow-sm" : "ml-auto bg-amber-600 text-white"}`}
              >
                {message.text}
              </div>
            ))}
            <div className="space-y-2 pt-1">
              <button type="button" onClick={() => { send("Nhắc tôi học 20 từ Flashcard nhé"); onNavigate("flashcards"); }} className="w-full rounded-xl border border-amber-100 bg-amber-50 p-2.5 text-left text-xs leading-relaxed text-amber-800">
                ⚠️ Hôm nay thử học 20 từ Flashcard nhé!
              </button>
              <button type="button" onClick={() => { send("Giúp tôi tập trung học Toán"); onNavigate("pomodoro"); }} className="w-full rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-left text-xs leading-relaxed text-blue-800">
                💡 Mở Pomodoro để bắt đầu một phiên tập trung?
              </button>
            </div>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); send(); }} className="flex shrink-0 gap-2 border-t border-slate-100 bg-white p-2.5">
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhắn gì đó cho Ishtar..." className="min-w-0 flex-1 rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-200" />
            <button aria-label="Gửi tin nhắn" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-600 text-white hover:bg-amber-700">
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        data-assistant-drag="avatar"
        aria-label={open ? "Thu nhỏ trợ lý Ishtar" : "Mở trợ lý Ishtar"}
        aria-expanded={open}
        className={`relative grid h-[60px] w-[60px] touch-none select-none place-items-center overflow-hidden rounded-full border-2 border-amber-400 bg-white p-1 shadow-[0_5px_18px_rgba(217,119,6,.22)] transition-shadow hover:shadow-lg ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        title="Kéo để di chuyển • Nhấn để mở/thu nhỏ"
      >
        <img src="/isthar-avatar.png" alt="Ishtar" className="h-full w-full rounded-full object-cover" draggable={false} />
        <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
        {!open && <span className="absolute bottom-0 left-0 grid h-5 w-5 place-items-center rounded-full bg-amber-600 text-white"><MessageCircle size={11} /></span>}
      </button>
    </div>
  );
}
