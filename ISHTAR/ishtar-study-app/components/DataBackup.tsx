"use client";

import { useEffect, useRef, useState } from "react";
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

  const vocabulary = entries.find((entry) => entry.key === "ishtar-vocabulary-vault-v1");
  if (vocabulary) {
    let parsed: unknown;
    try { parsed = JSON.parse(vocabulary.value); }
    catch { throw new Error("Kho từ vựng trong file backup bị lỗi JSON."); }
    if (
      !parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
      (parsed as any).schemaVersion !== 1 ||
      (parsed as any).mode !== "guest" ||
      typeof (parsed as any).createdAt !== "string" ||
      typeof (parsed as any).updatedAt !== "string" ||
      !Array.isArray((parsed as any).words) ||
      !(parsed as any).words.every((word: any) =>
        word && typeof word.id === "string" &&
        typeof word.term === "string" &&
        typeof word.meaning === "string" &&
        (word.example === undefined || typeof word.example === "string")
      ) ||
      !Array.isArray((parsed as any).knownWordIds) ||
      !(parsed as any).knownWordIds.every((id: unknown) => typeof id === "string")
    ) {
      throw new Error("Kho từ vựng trong file backup không đúng cấu trúc.");
    }
  }

  const archive = entries.find((entry) => entry.key === "ishtar-learning-archive-v1");
  if (archive) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(archive.value);
    } catch {
      throw new Error("Learning Archive trong file backup bị lỗi JSON.");
    }
    const allowedTypes = new Set([
      "task_created", "task_completed", "pomodoro_completed",
      "vocabulary_added", "vocabulary_mastered", "vocabulary_review",
      "flashcard_round_completed", "grade_recorded", "goal_score_recorded",
    ]);
    if (
      !Array.isArray(parsed) ||
      !parsed.every((event) =>
        event &&
        typeof event.id === "string" &&
        allowedTypes.has(event.type) &&
        typeof event.occurredAt === "string" &&
        event.schemaVersion === 1 &&
        event.payload &&
        typeof event.payload === "object" &&
        !Array.isArray(event.payload)
      )
    ) {
      throw new Error("Learning Archive không đúng cấu trúc. Chưa có dữ liệu nào bị thay đổi.");
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
  const [localDataCount, setLocalDataCount] = useState<number | null>(null);

  const refreshLocalDataCount = () => {
    try {
      let count = 0;
      for (let index = 0; index < localStorage.length; index += 1) {
        if (localStorage.key(index)?.startsWith("ishtar")) count += 1;
      }
      setLocalDataCount(count);
    } catch {
      setLocalDataCount(null);
    }
  };

  useEffect(() => {
    refreshLocalDataCount();
  }, []);

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

      const archiveKey = "ishtar-learning-archive-v1";
      const vocabularyKey = "ishtar-vocabulary-vault-v1";
      const incomingStudy = backup.entries.find((entry) => entry.key === "ishtar-study-data-v2");
      const incomingLegacyKnown = backup.entries.find((entry) => entry.key === "ishtar-known-words");
      const incomingVocabulary = backup.entries.find((entry) => entry.key === vocabularyKey);
      let incomingVault: any = null;

      if (incomingVocabulary) {
        incomingVault = JSON.parse(incomingVocabulary.value);
      } else if (incomingStudy) {
        const study = JSON.parse(incomingStudy.value);
        let knownWordIds: string[] = [];
        if (incomingLegacyKnown) {
          try {
            const parsedKnown = JSON.parse(incomingLegacyKnown.value);
            if (Array.isArray(parsedKnown)) knownWordIds = parsedKnown.filter((id) => typeof id === "string");
          } catch {}
        }
        incomingVault = {
          schemaVersion: 1,
          mode: "guest",
          createdAt: backup.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          words: Array.isArray(study.words) ? study.words : [],
          knownWordIds,
        };
      }

      const restoreEntries = backup.entries.filter((entry) =>
        entry.key !== vocabularyKey && entry.key !== archiveKey
      ).map((entry) => entry);

      if (incomingVault) {
        const currentRaw = localStorage.getItem(vocabularyKey);
        let currentVault: any = null;
        if (currentRaw) {
          try { currentVault = JSON.parse(currentRaw); }
          catch {
            throw new Error("Kho từ vựng hiện tại bị lỗi JSON. Đã giữ nguyên dữ liệu và hủy khôi phục.");
          }
          if (
            !currentVault || currentVault.schemaVersion !== 1 ||
            currentVault.mode !== "guest" || !Array.isArray(currentVault.words) ||
            !Array.isArray(currentVault.knownWordIds)
          ) {
            throw new Error("Kho từ vựng hiện tại không hợp lệ. Đã giữ nguyên dữ liệu và hủy khôi phục.");
          }
        }
        const words = new Map<string, any>();
        for (const word of currentVault?.words || []) words.set(word.id, word);
        for (const word of incomingVault.words || []) if (!words.has(word.id)) words.set(word.id, word);
        const knownWordIds = new Set<string>(currentVault?.knownWordIds || []);
        for (const id of incomingVault.knownWordIds || []) knownWordIds.add(id);
        const mergedVault = {
          schemaVersion: 1,
          mode: "guest",
          createdAt: currentVault?.createdAt || incomingVault.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          words: [...words.values()],
          knownWordIds: [...knownWordIds],
        };
        restoreEntries.push({ key: vocabularyKey, value: JSON.stringify(mergedVault) });
      }

      const incomingArchive = backup.entries.find((entry) => entry.key === archiveKey);
      if (incomingArchive) {
        const incoming = JSON.parse(incomingArchive.value) as Array<{ id: string; occurredAt: string }>;
        const currentRaw = localStorage.getItem(archiveKey);
        let current: Array<{ id: string; occurredAt: string }> = [];
        if (currentRaw) {
          let parsed: unknown;
          try { parsed = JSON.parse(currentRaw); } catch {
            throw new Error("Learning Archive hiện tại bị lỗi JSON. Đã giữ nguyên dữ liệu và hủy khôi phục.");
          }
          if (!Array.isArray(parsed) || !parsed.every((event) =>
            event && typeof event.id === "string" && typeof event.occurredAt === "string"
          )) {
            throw new Error("Learning Archive hiện tại không hợp lệ. Đã giữ nguyên dữ liệu và hủy khôi phục.");
          }
          current = parsed;
        }
        const merged = new Map(current.map((event) => [event.id, event]));
        for (const event of incoming) if (!merged.has(event.id)) merged.set(event.id, event);
        restoreEntries.push({
          key: archiveKey,
          value: JSON.stringify([...merged.values()].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))),
        });
      }
      const before = collectEntries();
      const beforeMap = new Map(before.map((entry) => [entry.key, entry.value]));
      downloadBackup(before, "-before-restore");

      try {
        for (const entry of restoreEntries) {
          localStorage.setItem(entry.key, entry.value);
        }
      } catch {
        // Roll back every key touched by this restore if the browser rejects a write.
        for (const entry of restoreEntries) {
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

      refreshLocalDataCount();
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

      <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Kho dữ liệu trên trình duyệt này</p>
          <p className="mt-1 text-xs text-slate-500">Số khóa I.S.H.T.A.R. đang được lưu trên đúng địa chỉ website hiện tại.</p>
          <p className="mt-2 text-sm font-bold text-emerald-700">
            {localDataCount === null ? "Chưa kiểm tra được" : `${localDataCount} khóa dữ liệu`}
          </p>
        </div>
        <button type="button" onClick={refreshLocalDataCount} className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
          Kiểm tra lại
        </button>
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
        Backup bao gồm các khóa dữ liệu I.S.H.T.A.R. trên trình duyệt hiện tại: hồ sơ, nhiệm vụ, lịch, Guest Vocabulary Vault, trạng thái từ đã thuộc, tiến độ Flashcard, Pomodoro, Learning Archive, Playlist và cài đặt. File JSON có thể chứa thông tin cá nhân; hãy giữ riêng tư.
      </div>
    </section>
  );
}
