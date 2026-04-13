"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import CloseButton from "@/components/CloseButton";
import SourcePill from "@/components/SourcePill";
import type { NewsItem } from "@/lib/types";

export default function DailyPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dominantColor, setDominantColor] = useState("rgba(30, 37, 56, 0.9)");

  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const headline = `Your Elixpo Daily For ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => {
        const newsItems: NewsItem[] = Array.isArray(data.items) ? data.items : Object.values(data.items);
        setItems(newsItems);
        audioRefs.current = newsItems.map((item) => {
          const audio = new Audio(item.audio_url);
          audio.preload = "auto";
          return audio;
        });
        setLoading(false);
      })
      .catch(console.error);

    return () => {
      audioRefs.current.forEach((a) => { a.pause(); a.src = ""; });
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    };
  }, []);

  const updateDominantColor = useCallback((imageUrl: string) => {
    fetch(`/api/dominant-color?imageUrl=${encodeURIComponent(imageUrl)}`)
      .then((r) => r.json())
      .then((data) => setDominantColor(data.color))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const audio = audioRefs.current[currentIdx];
    if (!audio) return;

    const onTimeUpdate = () => { setCurrentTime(audio.currentTime); setDuration(audio.duration || 0); };
    const onEnded = () => {
      if (currentIdx < items.length - 1) {
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        audioRefs.current[nextIdx].currentTime = 0;
        playTimeoutRef.current = setTimeout(() => { audioRefs.current[nextIdx].play(); setIsPlaying(true); }, 1500);
      } else { setIsPlaying(false); }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    if (items[currentIdx]?.image_url) updateDominantColor(items[currentIdx].image_url);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [currentIdx, items, updateDominantColor]);

  const togglePlay = () => {
    const audio = audioRefs.current[currentIdx];
    if (!audio) return;
    if (audio.paused) audio.play(); else audio.pause();
  };

  const switchTrack = (direction: "prev" | "next") => {
    const newIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1;
    if (newIdx < 0 || newIdx >= items.length) return;
    audioRefs.current[currentIdx].pause();
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    setCurrentIdx(newIdx);
    audioRefs.current[newIdx].currentTime = 0;
    playTimeoutRef.current = setTimeout(() => audioRefs.current[newIdx].play(), 1500);
  };

  const seekTo = (barIdx: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (barIdx !== currentIdx) {
      audioRefs.current[currentIdx].pause();
      setCurrentIdx(barIdx);
      audioRefs.current[barIdx].currentTime = 0;
      setTimeout(() => audioRefs.current[barIdx].play(), 500);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRefs.current[barIdx].currentTime = percent * (audioRefs.current[barIdx].duration || 0);
  };

  const formatTime = (sec: number) => {
    sec = Math.floor(sec);
    return `${Math.floor(sec / 60).toString().padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;
  };

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentItem = items[currentIdx];

  return (
    <section className="relative h-screen w-screen overflow-hidden">
      <CloseButton />

      {/* Gradient background from dominant color */}
      <div className="absolute inset-0 transition-colors duration-1000" style={{ background: `linear-gradient(135deg, ${dominantColor}, #0a0a0a)` }} />

      {/* Backdrop image */}
      {currentItem?.image_url && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-30"
          style={{ backgroundImage: `url('${currentItem.image_url}')`, filter: "blur(40px) brightness(0.5)" }}
        />
      )}

      {/* Thumbnail centered */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-10">
        {currentItem?.image_url && (
          <div
            className="w-[280px] h-[180px] rounded-3xl bg-cover bg-center shadow-2xl shadow-black/40 transition-all duration-500 border border-white/10"
            style={{ backgroundImage: `url('${currentItem.image_url}')` }}
          />
        )}
      </div>

      {/* Source pill */}
      {currentItem?.source_link && (
        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 z-10">
          <SourcePill sourceLink={currentItem.source_link} />
        </div>
      )}

      {/* Title */}
      <p className="absolute top-[62%] left-1/2 -translate-x-1/2 text-xl font-bold z-10 text-center font-[family-name:var(--font-parkinsans)] w-[80%] text-white max-sm:text-base max-sm:top-[58%]">
        {loading ? headline : (currentItem?.topic?.slice(0, 80) + "..." || headline)}
      </p>
      <p className="absolute top-[72%] left-1/2 -translate-x-1/2 text-xs z-10 w-[80%] text-center text-white/50 font-[family-name:var(--font-parkinsans)] max-sm:top-[68%]">
        Generated by Elixpo Copilot. There might be mistakes
      </p>

      {/* Playback zone */}
      <div className="absolute top-[80%] left-1/2 -translate-x-1/2 w-[30%] h-[104px] rounded-[25px] z-10 select-none max-lg:w-[50%] max-sm:w-[85%] max-sm:top-[76%]" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        {/* Seek bars */}
        <div className="relative flex items-center w-[90%] h-[40%] left-[5%] top-[10%] gap-[5px]">
          <span className="font-[family-name:var(--font-parkinsans)] font-bold mr-2.5 ml-2.5 text-white/80 text-sm">{formatTime(currentTime)}</span>
          {items.map((_, idx) => (
            <div
              key={idx}
              onClick={(e) => seekTo(idx, e)}
              className="relative h-1.5 rounded-[10px] cursor-pointer transition-all duration-250"
              style={{ width: idx === currentIdx ? "75%" : "6%", background: "rgba(255,255,255,0.3)" }}
            >
              {idx === currentIdx && (
                <>
                  <div className="absolute h-1.5 rounded-[20px] top-0 left-0 bg-white" style={{ width: `${percent}%` }} />
                  <div className="absolute w-3 h-3 rounded-full -top-[3px] z-[1] bg-white cursor-pointer" style={{ left: `calc(${percent}% - 6px)` }} />
                </>
              )}
            </div>
          ))}
          <span className="font-[family-name:var(--font-parkinsans)] font-bold mr-2.5 ml-2.5 text-white/80 text-sm">{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="relative flex items-center justify-between w-[50%] h-[40%] left-1/2 -translate-x-1/2 top-[10%]">
          <svg viewBox="0 0 24 24" className="w-6 h-6 cursor-pointer rotate-y-180" onClick={() => switchTrack("prev")}>
            <path d="M2.99998 19.247C2.99998 20.6548 4.57779 21.4864 5.73913 20.6906L16.2376 13.4972C17.2478 12.8051 17.253 11.3161 16.2476 10.6169L5.74918 3.31534C4.58885 2.50835 2.99998 3.33868 2.99998 4.75204V19.247ZM20.9999 20.25C20.9999 20.6642 20.6641 21 20.2499 21C19.8357 21 19.4999 20.6642 19.4999 20.25V3.75C19.4999 3.33579 19.8357 3 20.2499 3C20.6641 3 20.9999 3.33579 20.9999 3.75V20.25Z" fill="white" />
          </svg>
          <svg viewBox="0 0 32 32" className="w-8 h-8 cursor-pointer" onClick={togglePlay}>
            {isPlaying ? (
              <path d="M7.25 29C5.45507 29 4 27.5449 4 25.75V7.25C4 5.45507 5.45507 4 7.25 4H10.75C12.5449 4 14 5.45507 14 7.25V25.75C14 27.5449 12.5449 29 10.75 29H7.25ZM21.25 29C19.4551 29 18 27.5449 18 25.75V7.25C18 5.45507 19.4551 4 21.25 4H24.75C26.5449 4 28 5.45507 28 7.25V25.75C28 27.5449 26.5449 29 24.75 29H21.25Z" fill="white" />
            ) : (
              <path d="M12.2246 27.5373C9.89137 28.8585 7 27.173 7 24.4917V7.50044C7 4.81864 9.89234 3.1332 12.2256 4.45537L27.2233 12.9542C29.5897 14.2951 29.5891 17.7047 27.2223 19.0449L12.2246 27.5373Z" fill="white" />
            )}
          </svg>
          <svg viewBox="0 0 24 24" className="w-6 h-6 cursor-pointer" onClick={() => switchTrack("next")}>
            <path d="M2.99998 19.247C2.99998 20.6548 4.57779 21.4864 5.73913 20.6906L16.2376 13.4972C17.2478 12.8051 17.253 11.3161 16.2476 10.6169L5.74918 3.31534C4.58885 2.50835 2.99998 3.33868 2.99998 4.75204V19.247ZM20.9999 20.25C20.9999 20.6642 20.6641 21 20.2499 21C19.8357 21 19.4999 20.6642 19.4999 20.25V3.75C19.4999 3.33579 19.8357 3 20.2499 3C20.6641 3 20.9999 3.33579 20.9999 3.75V20.25Z" fill="white" />
          </svg>
        </div>
      </div>
    </section>
  );
}
