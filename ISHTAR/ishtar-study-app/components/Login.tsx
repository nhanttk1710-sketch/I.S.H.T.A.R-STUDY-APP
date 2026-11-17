"use client";

import { useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";

type AuthMode = "login" | "register";

export default function Login({
  onLogin,
}: {
  onLogin: (mode: AuthMode, email: string, password: string, name: string) => Promise<string | null>;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ Email và mật khẩu.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email chưa đúng định dạng.");
      return;
    }
    if (password.length < 10) {
      setError("Mật khẩu cần có ít nhất 10 ký tự.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await onLogin(mode, email.trim(), password, name.trim() || email.split("@")[0] || "Bạn");
    setBusy(false);
    setError(result || "");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-50/70 p-5">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[32px] bg-white shadow-xl shadow-blue-100/70 md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-500 to-sky-300 p-10 text-white md:flex">
          <div className="flex items-center gap-3"><img src="/isthar-avatar.png" className="h-11 w-11 rounded-full border border-white/50" alt="Ishtar"/><b className="tracking-[.2em]">I.S.H.T.A.R</b></div>
          <div><div className="mb-4 text-5xl">✦</div><h1 className="text-3xl font-bold leading-tight">Mỗi ngày tiến bộ<br/>một chút thôi.</h1><p className="mt-4 max-w-xs text-sm leading-6 text-blue-50">Một góc nhỏ để bạn sắp xếp việc học, giữ nhịp tập trung và chạm đến mục tiêu.</p></div>
          <p className="text-xs text-blue-50">It Shall Help Toward Academic Readiness</p>
        </div>
        <form onSubmit={submit} className="p-8 sm:p-12">
          <div className="mb-6 inline-flex rounded-2xl bg-blue-50 p-3 text-blue-600"><BookOpen size={24}/></div>
          <h2 className="text-2xl font-bold text-slate-800">{mode === "login" ? "Chào mừng bạn trở lại!" : "Tạo không gian học tập"}</h2>
          <p className="mt-2 text-sm text-slate-400">Tài khoản riêng, dữ liệu học tập đồng bộ trên cloud.</p>
          <div className="mt-7 grid grid-cols-2 rounded-xl bg-blue-50 p-1">
            {(["login", "register"] as const).map((value) => <button key={value} type="button" onClick={() => { setMode(value); setError(""); }} className={`rounded-lg py-2 text-sm font-bold ${mode === value ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>{value === "login" ? "Đăng nhập" : "Đăng ký"}</button>)}
          </div>
          {mode === "register" && <label className="mt-5 block text-sm font-semibold text-slate-600">Tên hiển thị<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên của bạn" maxLength={80} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-300"/></label>}
          <label className="mt-5 block text-sm font-semibold text-slate-600">Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-300" required/></label>
          <label className="mt-5 block text-sm font-semibold text-slate-600">Mật khẩu<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ít nhất 10 ký tự" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-300" required minLength={10} maxLength={128}/></label>
          {error && <p role="alert" className="mt-3 text-sm text-rose-500">{error}</p>}
          <button disabled={busy} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}<ArrowRight size={18}/></button>
          <p className="mt-5 text-center text-xs text-slate-400">Mật khẩu được xử lý bởi hệ thống xác thực an toàn; ISHTAR không lưu mật khẩu vào dữ liệu học tập.</p>
        </form>
      </div>
    </main>
  );
}
