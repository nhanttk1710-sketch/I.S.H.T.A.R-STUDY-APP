"use client";

import { useEffect, useRef, useState } from "react";
import {
  Music2, Plus, Trash2, Play, Pause, SkipBack, SkipForward,
  Repeat, Repeat1, ChevronUp, ChevronDown, ListMusic, Disc3,
} from "lucide-react";

type Track = { id: string; title: string; videoId: string };
type Playlist = { id: string; name: string; tracks: Track[] };
type RepeatMode = "off" | "all" | "one";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const STORAGE_KEY = "ishtar-music-playlists-v1";
const uid = () => Math.random().toString(36).slice(2, 10);

function parseVideoId(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0];
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).pop() || "";
    }
  } catch {
    // The input may be a raw YouTube video ID.
  }
  return /^[\w-]{11}$/.test(value.trim()) ? value.trim() : "";
}

export default function MusicPlaylist({
  onToast,
  visible = true,
}: {
  onToast: (message: string) => void;
  visible?: boolean;
}) {
  const [lists, setLists] = useState<Playlist[]>([]);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState("");
  const [name, setName] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [url, setUrl] = useState("");
  const [repeat, setRepeat] = useState<RepeatMode>("all");
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [apiReady, setApiReady] = useState(false);

  const player = useRef<any>(null);
  const host = useRef<HTMLDivElement>(null);
  const activeList = lists.find((item) => item.id === active);
  const tracks = activeList?.tracks ?? [];
  const track = tracks[current];
  const playback = useRef({ current, trackCount: tracks.length, repeat });
  playback.current = { current, trackCount: tracks.length, repeat };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Playlist[];
        setLists(parsed);
        setActive(parsed[0]?.id ?? "");
      }
    } catch {
      onToast("Không thể đọc playlist đã lưu.");
    }
    setReady(true);
  }, [onToast]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch {
      onToast("Không đủ bộ nhớ để lưu playlist.");
    }
  }, [lists, ready, onToast]);

  useEffect(() => {
    if (window.YT?.Player) {
      setApiReady(true);
      return;
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      setApiReady(true);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }

    return () => {
      window.onYouTubeIframeAPIReady = previousCallback;
    };
  }, []);

  useEffect(() => {
    if (!apiReady || !host.current || player.current) return;

    player.current = new window.YT.Player(host.current, {
      width: "100%",
      height: "100%",
      videoId: "",
      playerVars: { playsinline: 1, rel: 0 },
      events: {
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) setPlaying(true);
          if (event.data === window.YT.PlayerState.PAUSED) setPlaying(false);
          if (event.data !== window.YT.PlayerState.ENDED) return;

          const state = playback.current;
          if (state.repeat === "one") {
            event.target.seekTo(0);
            event.target.playVideo();
          } else if (state.current < state.trackCount - 1) {
            setCurrent(state.current + 1);
          } else if (state.repeat === "all" && state.trackCount > 1) {
            setCurrent(0);
          } else {
            setPlaying(false);
          }
        },
      },
    });

    return () => {
      try {
        player.current?.destroy();
      } catch {
        // Ignore teardown errors from the YouTube iframe API.
      }
      player.current = null;
    };
  }, [apiReady]);

  useEffect(() => {
    if (!player.current || !track) return;
    player.current.loadVideoById(track.videoId);
  }, [track?.videoId]);

  const create = () => {
    if (!name.trim()) return;
    const playlist = { id: uid(), name: name.trim(), tracks: [] as Track[] };
    setLists((items) => [...items, playlist]);
    setActive(playlist.id);
    setCurrent(0);
    setName("");
  };

  const add = () => {
    const id = parseVideoId(url);
    if (!id) {
      onToast("Link YouTube không hợp lệ. Hãy dùng link video hoặc ID 11 ký tự.");
      return;
    }
    if (!activeList) return;
    const newTrack = { id: uid(), title: trackTitle.trim() || "YouTube track", videoId: id };
    setLists((items) =>
      items.map((item) =>
        item.id === active ? { ...item, tracks: [...item.tracks, newTrack] } : item,
      ),
    );
    setTrackTitle("");
    setUrl("");
    onToast("Đã thêm bài hát vào playlist.");
  };

  const patchActive = (update: (playlist: Playlist) => Playlist) => {
    setLists((items) => items.map((item) => (item.id === active ? update(item) : item)));
  };

  const select = (id: string) => {
    setActive(id);
    setCurrent(0);
    setPlaying(false);
  };

  const jump = (index: number) => {
    if (tracks.length) setCurrent((index + tracks.length) % tracks.length);
  };

  const togglePlay = () => {
    if (!track || !player.current) return;
    if (playing) player.current.pauseVideo();
    else player.current.playVideo();
  };

  const move = (index: number, direction: number) => {
    const next = index + direction;
    if (next < 0 || next >= tracks.length) return;
    patchActive((playlist) => {
      const reordered = [...playlist.tracks];
      [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
      return { ...playlist, tracks: reordered };
    });
    if (current === index) setCurrent(next);
    else if (current === next) setCurrent(index);
  };

  const cycleRepeat = () =>
    setRepeat((mode) => (mode === "off" ? "all" : mode === "all" ? "one" : "off"));

  return (
    <>
      <div
        className={
          track
            ? visible
              ? "mb-4 aspect-video w-full overflow-hidden rounded-2xl bg-stone-950"
              : "fixed bottom-24 right-4 z-[65] h-[112px] w-[200px] overflow-hidden rounded-xl border border-amber-300 shadow-xl"
            : "fixed -left-[9999px] top-0 h-px w-px overflow-hidden"
        }
      >
        <div ref={host} className="h-full w-full" />
      </div>

      {visible && (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                <Music2 size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-800">Music Playlist</h1>
                <p className="mt-1 text-sm text-stone-400">
                  Không gian âm nhạc của riêng bạn · Phát từ YouTube
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="rounded-3xl bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-bold">
                <ListMusic size={18} /> Playlist của tôi
              </h3>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  create();
                }}
                className="mb-4 flex gap-2"
              >
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Tên playlist mới"
                  className="min-w-0 flex-1 rounded-xl bg-stone-50 px-3 py-2 text-sm outline-none"
                  maxLength={50}
                />
                <button aria-label="Tạo playlist" className="rounded-xl bg-amber-500 px-3 text-white">
                  <Plus size={18} />
                </button>
              </form>
              <div className="space-y-2">
                {lists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className={
                      "flex items-center gap-2 rounded-xl p-3 " +
                      (active === playlist.id
                        ? "bg-amber-50 text-amber-700"
                        : "bg-stone-50 text-stone-600")
                    }
                  >
                    <button onClick={() => select(playlist.id)} className="min-w-0 flex-1 text-left">
                      <b className="block truncate text-sm">{playlist.name}</b>
                      <span className="text-xs opacity-60">{playlist.tracks.length} bài hát</span>
                    </button>
                    <button
                      title="Xóa playlist"
                      onClick={() => {
                        setLists((items) => items.filter((item) => item.id !== playlist.id));
                        if (active === playlist.id) {
                          const next = lists.find((item) => item.id !== playlist.id);
                          setActive(next?.id ?? "");
                          setCurrent(0);
                          setPlaying(false);
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {!lists.length && (
                  <p className="rounded-xl bg-stone-50 p-4 text-center text-xs text-stone-400">
                    Chưa có playlist. Tạo playlist đầu tiên nhé.
                  </p>
                )}
              </div>
            </aside>

            <section className="min-w-0 space-y-5">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">Trình phát</h3>
                  <button
                    onClick={cycleRepeat}
                    title="Chế độ lặp"
                    className={
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-xs " +
                      (repeat === "off"
                        ? "bg-stone-100 text-stone-400"
                        : "bg-amber-50 text-amber-600")
                    }
                  >
                    {repeat === "one" ? <Repeat1 size={17} /> : <Repeat size={17} />}
                    {repeat === "off" ? "Không lặp" : repeat === "all" ? "Lặp playlist" : "Lặp bài"}
                  </button>
                </div>
                {!track && (
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-2xl bg-stone-950 text-stone-500">
                    <Disc3 size={48} />
                    <p className="text-sm">Chọn playlist và thêm bài hát để bắt đầu</p>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <b className="block truncate">{track?.title || "Chưa phát bài nào"}</b>
                    <p className="text-xs text-stone-400">
                      {activeList?.name || "Chưa chọn playlist"} ·{" "}
                      {track ? `${current + 1} / ${tracks.length}` : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => jump(current - 1)} disabled={!tracks.length} aria-label="Bài trước">
                      <SkipBack />
                    </button>
                    <button
                      onClick={togglePlay}
                      disabled={!track}
                      aria-label={playing ? "Tạm dừng" : "Phát"}
                      className="rounded-full bg-amber-500 p-3 text-white disabled:opacity-40"
                    >
                      {playing ? <Pause /> : <Play />}
                    </button>
                    <button onClick={() => jump(current + 1)} disabled={!tracks.length} aria-label="Bài tiếp">
                      <SkipForward />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-xs text-stone-400">
                  Phát nhạc bằng trình phát YouTube chính thức. Bạn có thể cần nhấn Play trong khung YouTube để bắt đầu.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-bold">Thêm bài hát</h3>
                {activeList ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      add();
                    }}
                    className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]"
                  >
                    <input
                      value={trackTitle}
                      onChange={(event) => setTrackTitle(event.target.value)}
                      placeholder="Tên bài hát (không bắt buộc)"
                      className="rounded-xl bg-stone-50 px-3 py-3 text-sm outline-none"
                    />
                    <input
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="Dán link YouTube hoặc Video ID"
                      className="min-w-0 rounded-xl bg-stone-50 px-3 py-3 text-sm outline-none"
                      required
                    />
                    <button className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white">
                      Thêm
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-stone-400">Hãy tạo hoặc chọn playlist để thêm bài hát.</p>
                )}

                <div className="mt-5 space-y-2">
                  {tracks.map((item, index) => (
                    <div
                      key={item.id}
                      className={
                        "flex items-center gap-3 rounded-xl p-3 " +
                        (index === current ? "bg-amber-50" : "bg-stone-50")
                      }
                    >
                      <button
                        onClick={() => {
                          setCurrent(index);
                          setPlaying(true);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm font-medium">
                          {index + 1}. {item.title}
                        </span>
                        <span className="text-xs text-stone-400">YouTube · {item.videoId}</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <button title="Lên" onClick={() => move(index, -1)} disabled={index === 0}>
                          <ChevronUp size={16} />
                        </button>
                        <button
                          title="Xuống"
                          onClick={() => move(index, 1)}
                          disabled={index === tracks.length - 1}
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          title="Xóa bài"
                          onClick={() => {
                            patchActive((playlist) => ({
                              ...playlist,
                              tracks: playlist.tracks.filter((entry) => entry.id !== item.id),
                            }));
                            if (index < current) setCurrent((value) => Math.max(0, value - 1));
                            else if (index === current) setPlaying(false);
                          }}
                        >
                          <Trash2 size={15} className="text-rose-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {activeList && !tracks.length && (
                    <p className="rounded-xl bg-stone-50 p-4 text-center text-xs text-stone-400">
                      Playlist đang trống. Thêm link YouTube đầu tiên.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      {track && (
        <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-amber-200/80 bg-[#fffaf1]/95 px-4 py-3 shadow-[0_-8px_30px_rgba(120,53,15,0.10)] backdrop-blur-xl md:left-[var(--ishtar-sidebar-width,0px)]">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <Music2 size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-sm text-stone-800">{track.title}</b>
              <span className="block truncate text-xs text-stone-500">
                {activeList?.name || "Playlist"} · {current + 1}/{tracks.length}
              </span>
            </div>
            <button onClick={() => jump(current - 1)} disabled={!tracks.length} aria-label="Bài trước" className="rounded-full p-2 text-stone-600 hover:bg-amber-100 disabled:opacity-30">
              <SkipBack size={19} />
            </button>
            <button onClick={togglePlay} aria-label={playing ? "Tạm dừng" : "Phát"} className="grid h-10 w-10 place-items-center rounded-full bg-amber-500 text-white shadow-sm hover:bg-amber-600">
              {playing ? <Pause size={19} /> : <Play size={19} />}
            </button>
            <button onClick={() => jump(current + 1)} disabled={!tracks.length} aria-label="Bài tiếp" className="rounded-full p-2 text-stone-600 hover:bg-amber-100 disabled:opacity-30">
              <SkipForward size={19} />
            </button>
            <button onClick={cycleRepeat} title={repeat === "off" ? "Không lặp" : repeat === "all" ? "Lặp playlist" : "Lặp bài"} className={"hidden rounded-full p-2 sm:block " + (repeat === "off" ? "text-stone-400" : "bg-amber-100 text-amber-700")}>
              {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
            <label className="hidden items-center gap-2 text-stone-500 sm:flex" title="Âm lượng">
              <span className="text-xs">Âm lượng</span>
              <input aria-label="Âm lượng" type="range" min="0" max="100" defaultValue="70" onChange={(event) => player.current?.setVolume(Number(event.target.value))} className="w-20 accent-amber-500" />
            </label>
            <button
              onClick={() => {
                if (!visible) window.dispatchEvent(new CustomEvent("ishtar-open-playlist"));
              }}
              title="Mở Playlist"
              className="rounded-xl p-2 text-amber-700 hover:bg-amber-100"
            >
              <ListMusic size={19} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
