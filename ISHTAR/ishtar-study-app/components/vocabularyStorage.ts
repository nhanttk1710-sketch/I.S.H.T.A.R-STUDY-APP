import type { Word } from "./types";

export const VOCABULARY_VAULT_KEY = "ishtar-vocabulary-vault-v1";

export type GuestVocabularyVault = {
  schemaVersion: 1;
  mode: "guest";
  createdAt: string;
  updatedAt: string;
  words: Word[];
  knownWordIds: string[];
};

export type VaultReadResult =
  | { status: "missing" }
  | { status: "valid"; vault: GuestVocabularyVault }
  | { status: "invalid" };

function isWord(value: unknown): value is Word {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const word = value as Partial<Word>;
  return typeof word.id === "string" &&
    typeof word.term === "string" &&
    typeof word.meaning === "string" &&
    (word.example === undefined || typeof word.example === "string");
}

function preserveRaw(raw: string) {
  try {
    const backupKey = VOCABULARY_VAULT_KEY + "-corrupt-backup";
    if (!localStorage.getItem(backupKey)) localStorage.setItem(backupKey, raw);
  } catch {
    // Keep the original vault untouched if preservation is unavailable.
  }
}

export function readGuestVocabularyVault(): VaultReadResult {
  if (typeof window === "undefined") return { status: "missing" };
  try {
    const raw = localStorage.getItem(VOCABULARY_VAULT_KEY);
    if (!raw) return { status: "missing" };
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      (parsed as GuestVocabularyVault).schemaVersion !== 1 ||
      (parsed as GuestVocabularyVault).mode !== "guest" ||
      typeof (parsed as GuestVocabularyVault).createdAt !== "string" ||
      typeof (parsed as GuestVocabularyVault).updatedAt !== "string" ||
      !Array.isArray((parsed as GuestVocabularyVault).words) ||
      !(parsed as GuestVocabularyVault).words.every(isWord) ||
      !Array.isArray((parsed as GuestVocabularyVault).knownWordIds) ||
      !(parsed as GuestVocabularyVault).knownWordIds.every((id) => typeof id === "string")
    ) {
      preserveRaw(raw);
      return { status: "invalid" };
    }
    return { status: "valid", vault: parsed as GuestVocabularyVault };
  } catch {
    try {
      const raw = localStorage.getItem(VOCABULARY_VAULT_KEY);
      if (raw) preserveRaw(raw);
    } catch {}
    return { status: "invalid" };
  }
}

export function writeGuestVocabularyVault(
  words: Word[],
  knownWordIds: string[],
): "saved" | "failed" | "invalid" {
  if (typeof window === "undefined") return "failed";
  try {
    const existing = readGuestVocabularyVault();
    if (existing.status === "invalid") return "invalid";
    const now = new Date().toISOString();
    const vault: GuestVocabularyVault = {
      schemaVersion: 1,
      mode: "guest",
      createdAt: existing.status === "valid" ? existing.vault.createdAt : now,
      updatedAt: now,
      words,
      knownWordIds: [...new Set(knownWordIds)],
    };
    localStorage.setItem(VOCABULARY_VAULT_KEY, JSON.stringify(vault));
    return "saved";
  } catch {
    return "failed";
  }
}
