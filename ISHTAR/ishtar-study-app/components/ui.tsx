import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md", className)}>{children}</div>;
}
export function Button({ className, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-100",
    secondary: "border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100"
  };
  return <button {...props} className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50", styles[variant], className)} />;
}
export function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="block space-y-2"><span className="text-sm font-medium text-slate-600">{label}</span><input {...props} className={cn("w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50", props.className)} /></label>;
}
export function SelectField({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium text-slate-600">{label}</span><select {...props} className={cn("w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50", props.className)}>{children}</select></label>;
}
export function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return <div className="mb-6"><p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-blue-500">{eyebrow || "Không gian của bạn"}</p><h2 className="text-2xl font-bold tracking-tight text-slate-800">{title}</h2>{description && <p className="mt-2 text-sm text-slate-500">{description}</p>}</div>;
}