"use client";

import { useEffect, useState } from "react";
import IshtarApp from "@/components/ishtar-app";
import Login from "@/components/Login";
import { authClient } from "@/lib/auth-client";

type SessionUser = { id: string; name: string; email: string };

export default function AuthGate() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceError, setServiceError] = useState("");

  const refreshSession = async () => {
    try {
      const result = await authClient.getSession();
      setUser(result.data?.user ?? null);
      setServiceError("");
    } catch {
      setServiceError("Chưa thể kết nối dịch vụ tài khoản. Hãy thử tải lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refreshSession(); }, []);

  const handleLogin = async (mode: "login" | "register", email: string, password: string, name: string) => {
    try {
      const result = mode === "register"
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });
      if (result.error) return result.error.message || "Không thể xác thực tài khoản.";
      await refreshSession();
      return null;
    } catch {
      return "Không thể kết nối dịch vụ tài khoản. Kiểm tra cấu hình Preview rồi thử lại.";
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    setUser(null);
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-blue-50/70 text-sm text-slate-500">Đang kiểm tra tài khoản…</main>;
  if (!user) return <>{serviceError && <p role="alert" className="fixed inset-x-4 top-4 z-50 mx-auto max-w-xl rounded-xl bg-rose-50 p-3 text-center text-sm text-rose-700">{serviceError}</p>}<Login onLogin={handleLogin}/></>;
  return <IshtarApp userEmail={user.email} userName={user.name} onLogout={handleLogout}/>;
}
