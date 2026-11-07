"use client";

import { useRef, useState } from "react";
import { Download, Upload, ShieldCheck, AlertTriangle, FileJson } from "lucide-react";
import { isStudyData } from "./studyStorage";

const BACKUP_FORMAT = "ishtar-local-backup";
const BACKUP_VERSION = 1;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_ENTRIES = 500;

type BackupEntry = { key: string; value: string };
type BackupFile = {
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: string;
  app: string;
  entries: BackupEntry[];
};

function collectEntries(): BackupEntry[] {
  const entries: BackupEntry[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith("ishtar")) continue;
    const value = localStorage.getItem(key);
    if (value !== null) entries.push({ key, value });
  }
  return entries.sort((a, b) => a.key.localeCompare(b.key));
}

function downloadBackup(entries: BackupEntry[], suffix = "") {
  const backup: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    app: "I.S.H.T.A.R.",
    entries,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  anchor.href = url;
  anchor.download = `ishtar-backup${suffix}-${date}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validateBackup(value: unknown): BackupFile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("File không có cấu trúc backup hợp lệ.");
  }
  const candidate = value as Partial<BackupFile>;
  if (
    candidate.format !== BACKUP_FORMAT ||
    candidate.version !== BACKUP_VERSION ||
    !Array.isArray(candidate.entries) ||
    candidate.entries.length > MAX_ENTRIES
  ) {
    throw new Error("Định dạng hoặc phiên bản backup không được hỗ trợ.");
  }

  const seen = new Set<string>();
  const entries = candidate.entries.map((entry) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof entry.key !== "string" ||
      !entry.key.startsWith("ishtar") ||
      typeof entry.value !== "string" ||
      entry.key.length > 200 ||
      entry.value.length > MAX_FILE_BYTES
    ) {
      throw new Error("File chứa bản ghi không hợp lệ. Chưa có dữ liệu nào bị thay đổi.");
    }
    if (seen.has(entry.key)) {
      throw new Error("File chứa khóa dữ liệu trùng lặp.");
    }
    seen.add(entry.key);
    return { key: entry.key, value: entry.value };
  });

  const mainData = entries.find((entry) => entry.key === "ishtar-study-data-v2");
  if (mainData) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(mainData.value);
    } catch {
      throw new Error("Dữ liệu học tập chính trong file backup bị lỗi JSON.");
    }
    if (!isStudyData(parsed)) {
      throw new Error("Dữ liệu học tập chính không đúng cấu trúc hiện tại.");
    }
  }

  const playlist = entries.find((entry) => entry.key === "ishtar-music-playlists-v1");
  if (playlist) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(playlist.value);
    } catch {
      throw new Error("Dữ liệu Playlist trong file backup bị lỗi JSON.");
    }
    if (
      !Array.isArray(parsed) ||
      !parsed.every((list) =>
        list &&
        typeof list.id === "string" &&
        typeof list.name === "string" &&
        Array.isArray(list.tracks) &&
        list.tracks.every((track: any) =>
          track &&
          typeof track.id === "string" &&
          typeof track.title === "string" &&
          typeof track.videoId === "string"
        )
      )
    ) {
      throw new Error("Dữ liệu Playlist không đúng cấu trúc.");
    }
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : "",
    app: typeof candidate.app === "string" ? candidate.app : "I.S.H.T.A.R.",
    entries,
  };
}

export default function DataBackup({ onToast }: { onToast: (message: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const exportData = () => {
    try {
      const entries = collectEntries();
      if (!entries.length) {
        onToast("Chưa tìm thấy dữ liệu I.S.H.T.A.R. trên địa chỉ này.");
        return;
      }
      downloadBackup(entries);
      onToast(`Đã tạo backup gồm ${entries.length} mục dữ liệu. Hãy giữ file ở nơi an toàn.`);
    } catch {
      onToast("Không thể tạo backup. Hãy kiểm tra quyền tải xuống của trình duyệt.");
    }
  };

  const importData = async (file: File) => {
    setBusy(true);
    try {
      if (file.size > MAX_FILE_BYTES) {
        throw new Error("File backup vượt quá giới hạn 20 MB.");
      }
      const parsed: unknown = JSON.parse(await file.text());
      const backup = validateBackup(parsed);
      if (!backup.entries.length) {
        throw new Error("File backup không có dữ liệu để khôi phục.");
      }

      const confirmed = window.confirm(
        `Tìm thấy ${backup.entries.length} mục dữ liệu. I.S.H.T.A.R. sẽ tải một bản backup dữ liệu hiện tại về máy trước, sau đó cập nhật các khóa có trong file. Những khóa hiện tại không có trong file sẽ được giữ nguyên. Tiếp tục?`
      );
      if (!confirmed) return;

      const before = collectEntries();
      const beforeMap = new Map(before.map((entry) => [entry.key, entry.value]));
      downloadBackup(before, "-before-restore");

      try {
        for (const entry of backup.entries) {
          localStorage.setItem(entry.key, entry.value);
        }
      } catch {
        // Roll back every key touched by this restore if the browser rejects a write.
        for (const entry of backup.entries) {
          const oldValue = beforeMap.get(entry.key);
          try {
            if (oldValue === undefined) localStorage.removeItem(entry.key);
            else localStorage.setItem(entry.key, oldValue);
          } catch {
            // The browser may be out of storage; the downloaded pre-restore file remains available.
          }
        }
        throw new Error("Trình duyệt không đủ dung lượng để khôi phục. Đã thử hoàn tác và tải backup trước khôi phục.");
      }

      onToast(`Đã khôi phục ${backup.entries.length} mục. Hãy tải lại trang để các tính năng nạp dữ liệu mới.`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Không thể đọc file backup.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
          <ShieldCheck size={23} />
        </span>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Sao lưu và khôi phục dữ liệu</h3>
          <p className="text-sm text-slate-500">Bảo vệ dữ liệu học tập trước khi cập nhật hoặc chuyển thiết bị.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle size={17} /> Lưu ý quan trọng
        </div>
        Backup chỉ chứa dữ liệu của địa chỉ website hiện tại. Các Preview URL khác nhau có LocalStorage riêng. Muốn chuyển dữ liệu từ Preview cũ sang Preview mới, hãy xuất file ở Preview cũ rồi nhập file ở Preview mới.
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={exportData}
          disabled={busy}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <Download size={17} /> Tải backup JSON
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Upload size={17} /> {busy ? "Đang khôi phục..." : "Khôi phục từ file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importData(file);
          }}
        />
      </div>

      <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
        <FileJson size={16} className="mt-0.5 shrink-0" />
        Backup bao gồm các khóa dữ liệu I.S.H.T.A.R. trên trình duyệt hiện tại: hồ sơ, nhiệm vụ, lịch, từ vựng, tiến độ Flashcard, Pomodoro, Playlist và cài đặt. File JSON có thể chứa thông tin cá nhân; hãy giữ riêng tư.
      </div>
    </section>
  );
}
