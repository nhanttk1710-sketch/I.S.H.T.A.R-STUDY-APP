"use client";

import { useEffect, useState } from "react";
import type { Word } from "./types";

type Round = {
  passed: boolean;
  attempts: number;
  score: number | null;
  answers: { id: string; ok: boolean }[];
};

type Session = {
  date: string;
  ids: string[];
  round: number;
  rounds: Round[];
  done: boolean;
  order: string[];
  q: number;
  val: string;
  locked: boolean;
  choices: Record<string, string[]>;
};

const emptyRound = (): Round => ({
  passed: false,
  attempts: 0,
  score: null,
  answers: [],
});

const newSession = (date: string, ids: string[]): Session => ({
  date,
  ids,
  round: 0,
  rounds: [emptyRound(), emptyRound(), emptyRound()],
  done: false,
  order: [],
  q: 0,
  val: "",
  locked: false,
  choices: {},
});

const normalize = (value: string) =>
  value.trim().toLowerCase().replace(/\\s+/g, " ");

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

function makeChoices(ids: string[], words: Word[]) {
  const byId = new Map(words.map((word) => [word.id, word]));
  return Object.fromEntries(
    ids.map((id) => {
      const alternatives = shuffle(ids.filter((candidate) => candidate !== id)).slice(0, 3);
      return [id, shuffle([id, ...alternatives])];
    }),
  ) as Record<string, string[]>;
}

function loadSession(key: string, date: string, ids: string[]): Session {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return newSession(date, ids);

    const parsed = JSON.parse(raw) as Partial<Session>;
    if (
      parsed.date !== date ||
      !Array.isArray(parsed.ids) ||
      !Array.isArray(parsed.rounds) ||
      parsed.rounds.length !== 3
    ) {
      return newSession(date, ids);
    }

    const rounds = parsed.rounds.map((round) => ({
      passed: Boolean(round?.passed),
      attempts: Number.isFinite(round?.attempts) ? Number(round?.attempts) : 0,
      score: Number.isFinite(round?.score) ? Number(round?.score) : null,
      answers: Array.isArray(round?.answers)
        ? round.answers.filter(
            (answer) =>
              answer &&
              typeof answer.id === "string" &&
              typeof answer.ok === "boolean",
          )
        : [],
    }));

    return {
      date,
      ids: parsed.ids.filter((id): id is string => typeof id === "string"),
      round: Math.min(2, Math.max(0, Number(parsed.round) || 0)),
      rounds,
      done: Boolean(parsed.done),
      order: Array.isArray(parsed.order)
        ? parsed.order.filter((id): id is string => typeof id === "string")
        : [],
      q: Math.max(0, Number(parsed.q) || 0),
      val: typeof parsed.val === "string" ? parsed.val : "",
      locked: Boolean(parsed.locked),
      choices:
        parsed.choices && typeof parsed.choices === "object"
          ? parsed.choices
          : {},
    };
  } catch {
    // Keep the original value so a failed parse never destroys the only copy.
    try {
      const raw = localStorage.getItem(key);
      if (raw && !localStorage.getItem(key + "-corrupt-backup")) {
        localStorage.setItem(key + "-corrupt-backup", raw);
      }
    } catch {
      // Storage may be unavailable or full; the app can still run in memory.
    }
    return newSession(date, ids);
  }
}

export default function VocabularyVault({
  words,
  onWordsChange,
  dailyWords,
  today,
  knownWords,
  onKnownWordsChange,
  onToast,
}: {
  words: Word[];
  onWordsChange: (value: Word[]) => void;
  dailyWords: Word[];
  today: string;
  knownWords: string[];
  onKnownWordsChange: (value: string[]) => void;
  onToast: (value: string) => void;
}) {
  const storageKey = "ishtar-vault-" + today;
  const [session, setSession] = useState<Session>(() =>
    loadSession(storageKey, today, dailyWords.map((word) => word.id)),
  );
  const [draft, setDraft] = useState({ term: "", meaning: "", example: "" });
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const state =
    session.date === today
      ? session
      : newSession(today, dailyWords.map((word) => word.id));

  const selected = state.ids
    .map((id) => words.find((word) => word.id === id))
    .filter((word): word is Word => Boolean(word));
  const order = state.order.filter((id) => selected.some((word) => word.id === id));
  const current = selected.find((word) => word.id === order[state.q]);
  const limit = Math.ceil(order.length * 0.9);

  useEffect(() => {
    if (!today || state.date !== today) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      onToast("Không thể lưu tiến độ Flashcard. Bộ nhớ trình duyệt có thể đã đầy.");
    }
  }, [state, storageKey, today, onToast]);

  const start = (roundNumber: number) => {
    const ids = selected.map((word) => word.id);
    setSession((previous) => ({
      ...(previous.date === today ? previous : newSession(today, ids)),
      ids,
      round: roundNumber,
      order: shuffle(ids),
      q: 0,
      val: "",
      locked: false,
      choices: makeChoices(ids, selected),
    }));
  };

  const addWord = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.term.trim() || !draft.meaning.trim()) return;
    onWordsChange([
      ...words,
      {
        ...draft,
        id: Math.random().toString(36).slice(2, 10),
      },
    ]);
    setDraft({ term: "", meaning: "", example: "" });
  };

  const submit = (answer: string, correct?: boolean) => {
    if (!current || state.locked) return;
    const isCorrect = correct ?? normalize(answer) === normalize(current.term);
    setSession((previous) => ({
      ...previous,
      val: isCorrect ? current.term : answer,
      locked: true,
      rounds: previous.rounds.map((round, index) =>
        index === previous.round
          ? {
              ...round,
              answers: [
                ...round.answers.filter((item) => item.id !== current.id),
                { id: current.id, ok: isCorrect },
              ],
            }
          : round,
      ),
    }));
  };

  const next = () => {
    if (state.q + 1 < order.length) {
      setSession((previous) => ({
        ...previous,
        q: previous.q + 1,
        val: "",
        locked: false,
      }));
      return;
    }

    const answers = state.rounds[state.round].answers;
    const score = answers.filter((answer) => answer.ok).length;
    const passed = score >= limit;
    const rounds = state.rounds.map((round, index) =>
      index === state.round
        ? {
            ...round,
            passed,
            attempts: round.attempts + 1,
            score,
          }
        : round,
    );

    setSession((previous) => ({
      ...previous,
      rounds,
      done: passed && state.round === 2,
      q: order.length,
      locked: false,
      val: "",
    }));
    onToast(
      passed
        ? "Đạt yêu cầu vòng kiểm tra!"
        : "Chưa đạt 90%. Hãy ôn lại rồi thi lại toàn bộ vòng.",
    );
  };

  const retry = () => {
    const ids = selected.map((word) => word.id);
    // Reset the round and create its next attempt in one update, avoiding stale state.
    setSession((previous) => ({
      ...previous,
      ids,
      rounds: previous.rounds.map((round, index) =>
        index === previous.round
          ? { ...round, answers: [], score: null, passed: false }
          : round,
      ),
      order: shuffle(ids),
      q: 0,
      val: "",
      locked: false,
      choices: makeChoices(ids, selected),
    }));
  };

  const saveKnown = (id: string) =>
    onKnownWordsChange([...new Set([...knownWords, id])]);

  return (
    <>
      <div className="mb-3">
        <h1 className="text-2xl font-bold text-stone-800">
          Flashcard · Vocabulary Vault
        </h1>
        <p className="mt-2 text-sm text-stone-400">
          Kho từ không giới hạn · Mỗi ngày ôn tối đa 20 từ qua ba vòng.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-bold">Kho từ vựng</h3>
          <form onSubmit={addWord} className="grid gap-2">
            <input
              className="rounded-xl bg-stone-50 p-3 text-sm"
              placeholder="Từ tiếng Anh"
              value={draft.term}
              onChange={(event) =>
                setDraft({ ...draft, term: event.target.value })
              }
              required
            />
            <textarea
              className="rounded-xl bg-stone-50 p-3 text-sm"
              placeholder="Nghĩa tiếng Việt"
              value={draft.meaning}
              onChange={(event) =>
                setDraft({ ...draft, meaning: event.target.value })
              }
              required
            />
            <textarea
              className="rounded-xl bg-stone-50 p-3 text-sm"
              placeholder="Câu ví dụ (không bắt buộc)"
              value={draft.example}
              onChange={(event) =>
                setDraft({ ...draft, example: event.target.value })
              }
            />
            <button className="rounded-xl bg-sky-500 p-3 text-sm font-semibold text-white">
              Thêm từ mới
            </button>
          </form>
          <p className="mt-3 text-xs text-stone-400">
            {words.length} từ · Không giới hạn
          </p>
          <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
            {words.map((word) => (
              <div key={word.id} className="rounded-xl bg-stone-50 p-3">
                <b className="text-sm">{word.term}</b>
                <p className="text-xs text-stone-500">{word.meaning}</p>
                <button
                  type="button"
                  onClick={() =>
                    onWordsChange(words.filter((item) => item.id !== word.id))
                  }
                  className="mt-1 text-xs text-rose-500"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex justify-between">
            <b>Học hôm nay</b>
            <span className="text-xs text-stone-400">
              {dailyWords.length}/20
            </span>
          </div>
          {dailyWords.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setFlipped(!flipped)}
                className="mt-4 flex min-h-56 w-full flex-col items-center justify-center rounded-3xl bg-sky-50 p-6 text-center"
              >
                <span className="text-xs text-sky-500">
                  {flipped ? "NGHĨA" : "TỪ VỰNG"}
                </span>
                <b className="mt-4 text-3xl">
                  {flipped
                    ? dailyWords[index]?.meaning
                    : dailyWords[index]?.term}
                </b>
                {flipped && dailyWords[index]?.example && (
                  <p className="mt-3 text-sm text-slate-500">
                    {dailyWords[index].example}
                  </p>
                )}
              </button>
              <div className="mt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => saveKnown(dailyWords[index].id)}
                  className="text-sm text-emerald-600"
                >
                  Đã thuộc
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onKnownWordsChange(
                      knownWords.filter((id) => id !== dailyWords[index].id),
                    )
                  }
                  className="text-sm text-amber-600"
                >
                  Cần ôn
                </button>
              </div>
              <div className="mt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIndex(Math.max(0, index - 1));
                    setFlipped(false);
                  }}
                >
                  Trước
                </button>
                <span className="text-sm text-slate-400">
                  {index + 1}/{dailyWords.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIndex(Math.min(dailyWords.length - 1, index + 1));
                    setFlipped(false);
                  }}
                >
                  Tiếp
                </button>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Thêm từ để bắt đầu học.
            </p>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
        <h3 className="font-bold">
          Kiểm tra 3 vòng · {selected.length} từ · Đạt {limit}/{selected.length}
        </h3>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["Nhận diện", "Gợi nhớ", "Ngữ cảnh"].map((name, index) => (
            <div key={name} className="rounded-xl bg-slate-50 p-3 text-sm">
              <b>Vòng {index + 1}</b>
              <p className="mt-1 text-xs">
                {state.rounds[index].passed
                  ? "Đã qua"
                  : index > 0 && !state.rounds[index - 1].passed
                    ? "Đang khóa"
                    : "Chưa hoàn thành"}
              </p>
            </div>
          ))}
        </div>

        {order.length === 0 && selected.length > 0 && !state.done && (
          <button
            type="button"
            onClick={() => start(0)}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-3 text-sm text-white"
          >
            Bắt đầu vòng 1
          </button>
        )}

        {order.length > 0 && !state.done && (
          <div className="mt-4 rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-semibold">
              Vòng {state.round + 1} · Câu {Math.min(state.q + 1, order.length)}/
              {order.length}
            </p>
            {current && state.q < order.length ? (
              <>
                <h4 className="mt-3 text-xl font-bold">
                  {state.round === 0
                    ? current.term
                    : state.round === 1
                      ? current.meaning
                      : current.example
                        ? current.example.replace(current.term, "_____")
                        : current.meaning}
                </h4>

                {state.round === 0 ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(state.choices[current.id] || [current.id])
                      .map((id) => selected.find((word) => word.id === id))
                      .filter((word): word is Word => Boolean(word))
                      .map((word) => (
                        <button
                          key={word.id}
                          disabled={state.locked}
                          type="button"
                          onClick={() =>
                            submit(
                              word.id === current.id
                                ? current.term
                                : "incorrect",
                              word.id === current.id,
                            )
                          }
                          className="rounded-xl bg-white p-3 text-left text-sm"
                        >
                          {word.meaning}
                        </button>
                      ))}
                  </div>
                ) : (
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      submit(state.val);
                    }}
                  >
                    <input
                      disabled={state.locked}
                      value={state.val}
                      onChange={(event) =>
                        setSession((previous) => ({
                          ...previous,
                          val: event.target.value,
                        }))
                      }
                      placeholder="Nhập từ tiếng Anh"
                      className="min-w-0 flex-1 rounded-xl bg-white p-3 text-sm"
                    />
                    <button
                      disabled={state.locked || !state.val.trim()}
                      className="rounded-xl bg-blue-600 px-4 text-white"
                    >
                      Trả lời
                    </button>
                  </form>
                )}

                {state.locked && (
                  <div className="mt-3 text-sm">
                    {normalize(state.val) === normalize(current.term)
                      ? "Chính xác!"
                      : "Đáp án: " + current.term}
                    <button
                      type="button"
                      onClick={next}
                      className="ml-3 rounded-lg bg-blue-600 px-3 py-2 text-white"
                    >
                      Tiếp
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-3">
                <b>
                  Kết quả:{" "}
                  {state.rounds[state.round].score ??
                    state.rounds[state.round].answers.filter(
                      (answer) => answer.ok,
                    ).length}
                  /{order.length}
                </b>
                {state.rounds[state.round].answers
                  .filter((answer) => !answer.ok)
                  .map((answer) => {
                    const word = selected.find((item) => item.id === answer.id);
                    return (
                      word && (
                        <p key={answer.id} className="text-xs text-rose-600">
                          {word.term} — {word.meaning}
                        </p>
                      )
                    );
                  })}
                {(state.rounds[state.round].score ?? 0) >= limit &&
                state.round < 2 ? (
                  <button
                    type="button"
                    onClick={() => start(state.round + 1)}
                    className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-white"
                  >
                    Mở vòng {state.round + 2}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={retry}
                    className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-white"
                  >
                    Thi lại toàn bộ vòng
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {state.done && (
          <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-center font-semibold text-emerald-700">
            Hoàn thành cả ba vòng hôm nay!
          </p>
        )}
      </section>
    </>
  );
}
