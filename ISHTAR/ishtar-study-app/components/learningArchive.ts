export const LEARNING_ARCHIVE_KEY = "ishtar-learning-archive-v1";

export type LearningEventType =
  | "task_created"
  | "task_completed"
  | "pomodoro_completed"
  | "vocabulary_added"
  | "vocabulary_mastered"
  | "vocabulary_review"
  | "flashcard_round_completed"
  | "grade_recorded"
  | "goal_score_recorded";

export type LearningEvent = {
  id: string;
  type: LearningEventType;
  occurredAt: string;
  entityId?: string;
  payload: Record<string, unknown>;
  schemaVersion: 1;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

const EVENT_TYPES: LearningEventType[] = [
  "task_created", "task_completed", "pomodoro_completed",
  "vocabulary_added", "vocabulary_mastered", "vocabulary_review",
  "flashcard_round_completed", "grade_recorded", "goal_score_recorded",
];

function isLearningEvent(item: unknown): item is LearningEvent {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false;
  const event = item as Partial<LearningEvent>;
  return typeof event.id === "string" &&
    EVENT_TYPES.includes(event.type as LearningEventType) &&
    typeof event.occurredAt === "string" &&
    event.schemaVersion === 1 &&
    Boolean(event.payload) &&
    typeof event.payload === "object" &&
    !Array.isArray(event.payload);
}

function preserveInvalidArchive(raw: string) {
  try {
    const backupKey = LEARNING_ARCHIVE_KEY + "-corrupt-backup";
    if (!window.localStorage.getItem(backupKey)) {
      window.localStorage.setItem(backupKey, raw);
    }
  } catch {
    // Never replace the original archive if preservation is not possible.
  }
}

export function readLearningArchive(): LearningEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEARNING_ARCHIVE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isLearningEvent)) {
      preserveInvalidArchive(raw);
      return [];
    }
    return parsed;
  } catch {
    try {
      const raw = window.localStorage.getItem(LEARNING_ARCHIVE_KEY);
      if (raw) preserveInvalidArchive(raw);
    } catch {}
    return [];
  }
}

export function appendLearningEvent(
  type: LearningEventType,
  payload: Record<string, unknown>,
  options: { id?: string; entityId?: string; occurredAt?: string } = {},
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = readLearningArchive();
    const id = options.id || createId();
    if (current.some((event) => event.id === id)) return true;
    const next: LearningEvent = {
      id,
      type,
      occurredAt: options.occurredAt || new Date().toISOString(),
      ...(options.entityId ? { entityId: options.entityId } : {}),
      payload,
      schemaVersion: 1,
    };
    window.localStorage.setItem(
      LEARNING_ARCHIVE_KEY,
      JSON.stringify([next, ...current]),
    );
    window.dispatchEvent(new CustomEvent("ishtar:archive-updated"));
    return true;
  } catch {
    return false;
  }
}

export function getLearningEventLabel(type: LearningEventType): string {
  const labels: Record<LearningEventType, string> = {
    task_created: "Tạo nhiệm vụ",
    task_completed: "Hoàn thành nhiệm vụ",
    pomodoro_completed: "Hoàn thành Pomodoro",
    vocabulary_added: "Thêm từ vựng",
    vocabulary_mastered: "Đánh dấu đã thuộc",
    vocabulary_review: "Đánh dấu cần ôn",
    flashcard_round_completed: "Hoàn thành vòng Flashcard",
    grade_recorded: "Ghi nhận điểm số",
    goal_score_recorded: "Ghi nhận điểm mục tiêu",
  };
  return labels[type] || "Hoạt động học tập";
}
