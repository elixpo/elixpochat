"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

interface TimelineEntry {
  type: "male" | "female" | "image";
  content: string;
  start: number;
  end: number;
}

interface CarouselImage {
  time: number;
  url: string;
  description: string;
}

export default function PodcastPage() {
  const [podcastName, setPodcastName] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [sourceLink, setSourceLink] = useState("");
  const [sourceDomain, setSourceDomain] = useState("");
  const [gradientColor, setGradientColor] = useState("#1a1a2e");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);

  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [activeSpeaker, setActiveSpeaker] = useState<"male" | "female" | "">("");
  const [activeCarouselUrl, setActiveCarouselUrl] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const subtitleContainerRef = useRef<HTMLDivElement>(null);
  const speeds = [1, 1.5, 2];

  useEffect(() => {
    fetch("/api/podcast")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setPodcastName(data.podcast_name);
        setBannerUrl(data.podcast_banner_url || "");
        setThumbnailUrl(data.podcast_thumbnail_url || "");
        setSourceLink(data.topic_source || "");
        try {
          setSourceDomain(new URL(data.topic_source).hostname.replace(/^www\./, ""));
        } catch { setSourceDomain(""); }

        if (data.podcast_audio_url) {
          const audio = new Audio(data.podcast_audio_url);
          audio.preload = "metadata";
          audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
          audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
          audio.addEventListener("play", () => setIsPlaying(true));
          audio.addEventListener("pause", () => setIsPlaying(false));
          audio.addEventListener("ended", () => setIsPlaying(false));
          audio.addEventListener("error", () => setAudioError(true));
          audioRef.current = audio;
        } else {
          setAudioError(true);
        }
        setLoaded(true);
      })
      .catch(console.error);

    fetch("/api/podcast-details")
      .then((r) => r.json())
      .then((details) => {
        if (details.gradientColor) setGradientColor(details.gradientColor);
        if (details.carouselImages) setCarouselImages(details.carouselImages);
        // Timeline embedded directly in D1 — no extra fetch needed
        if (details.timeline?.length) {
          setTimeline(details.timeline);
        } else if (details.timelineUrl) {
          // Fallback: fetch from Cloudinary URL
          fetch(details.timelineUrl).then((r) => r.json()).then(setTimeline).catch(() => {});
        }
      })
      .catch(() => {});

    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; } };
  }, []);

  // Sync timeline
  const updateTimeline = useCallback(() => {
    if (!timeline.length) return;
    const t = currentTime;
    const idx = timeline.findIndex(
      (e) => (e.type === "male" || e.type === "female") && t >= e.start && t < e.end
    );
    if (idx !== -1) {
      setActiveIdx(idx);
      setActiveSpeaker(timeline[idx].type as "male" | "female");
    }
    const passed = carouselImages.filter((img) => t >= img.time);
    if (passed.length) setActiveCarouselUrl(passed[passed.length - 1].url);
  }, [currentTime, timeline, carouselImages]);

  useEffect(() => { updateTimeline(); }, [updateTimeline]);

  // Auto-scroll subtitles
  useEffect(() => {
    if (activeIdx < 0 || !subtitleContainerRef.current) return;
    const el = subtitleContainerRef.current.children[activeIdx] as HTMLElement;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx]);

  const togglePlay = () => {
    if (!audioRef.current || audioError) return;
    if (audioRef.current.paused) audioRef.current.play(); else audioRef.current.pause();
  };

  const cycleSpeed = () => {
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const skip = (sec: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + sec));
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || !audioRef.current) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    audioRef.current.currentTime = (Math.max(0, Math.min(e.clientX - rect.left, rect.width)) / rect.width) * duration;
  };

  const fmt = (sec: number) => {
    sec = Math.max(0, Math.floor(sec));
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speechEntries = timeline.filter((e) => e.type === "male" || e.type === "female");
  const faviconUrl = sourceDomain ? `https://www.google.com/s2/favicons?domain=${sourceDomain}&sz=64` : "";

  return (
    <section className="relative h-screen w-screen overflow-hidden flex flex-col bg-black">
      {/* Back button */}
      <Link href="/" className="fixed top-5 left-5 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
      </Link>

      {/* ═══ BACKGROUND ═══ */}
      {/* Always show gradient base */}
      <div className="absolute inset-0 z-0" style={{ background: `radial-gradient(ellipse at top, ${gradientColor}88 0%, ${gradientColor} 70%, #0a0a0a 100%)` }} />
      {/* Banner full bleed if available */}
      {bannerUrl && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center scale-110 transition-opacity duration-1000" style={{ backgroundImage: `url(${bannerUrl})`, filter: "blur(20px) brightness(0.4) saturate(1.3)" }} />
        </div>
      )}
      {/* Gradient overlay: soft fade from top to gradientColor */}
      <div className="absolute inset-0 z-[1]" style={{ background: `linear-gradient(to bottom, transparent 0%, ${gradientColor}99 30%, ${gradientColor}dd 55%, ${gradientColor}f5 75%, ${gradientColor} 100%)` }} />

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Top: Banner image + info */}
        <div className="flex-shrink-0 pt-16 pb-4 px-6 flex flex-col items-center">
          {/* Carousel / Banner / Thumbnail display */}
          {(() => {
            const imgSrc = activeCarouselUrl || bannerUrl || thumbnailUrl;
            return imgSrc ? (
              <div className="relative w-full max-w-lg h-[200px] max-sm:h-[150px] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 mb-5">
                <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${imgSrc})` }} />
                <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: `linear-gradient(to bottom, transparent, ${gradientColor}cc)` }} />
                {carouselImages.length > 0 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {carouselImages.map((img, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all ${activeCarouselUrl === img.url ? "bg-white w-4" : "bg-white/40 w-1.5"}`} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-32 h-32 max-sm:w-24 max-sm:h-24 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 mb-5 bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" className="opacity-20">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                </svg>
              </div>
            );
          })()}

          {/* Speaker indicator */}
          {activeSpeaker && isPlaying && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm">
              <div className={`w-2 h-2 rounded-full animate-pulse ${activeSpeaker === "female" ? "bg-pink-400" : "bg-blue-400"}`} />
              <span className="text-[10px] text-white/50 font-semibold tracking-wider uppercase">
                {activeSpeaker === "female" ? "Liza" : "Lix"}
              </span>
            </div>
          )}
        </div>

        {/* Middle: Scrollable subtitles (Spotify-style) — toggleable */}
        <div className={`flex-1 overflow-hidden relative px-6 transition-opacity duration-500 ${showCaptions ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          {/* Fade masks top/bottom */}
          <div className="absolute inset-x-0 top-0 h-12 z-10 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${gradientColor}, transparent)` }} />
          <div className="absolute inset-x-0 bottom-0 h-12 z-10 pointer-events-none" style={{ background: `linear-gradient(to top, ${gradientColor}, transparent)` }} />

          <div ref={subtitleContainerRef} className="h-full overflow-y-auto scroll-smooth px-2 py-10" style={{ scrollbarWidth: "none" }}>
            {speechEntries.length > 0 ? speechEntries.map((entry, i) => {
              const isActive = timeline.indexOf(entry) === activeIdx;
              return (
                <div
                  key={i}
                  className="py-3 cursor-pointer transition-all duration-500"
                  onClick={() => {
                    if (audioRef.current) audioRef.current.currentTime = entry.start;
                  }}
                >
                  {/* Speaker tag */}
                  <span className={`text-[10px] uppercase tracking-widest font-bold mb-1 block transition-colors duration-300 ${
                    isActive
                      ? entry.type === "female" ? "text-pink-400" : "text-blue-400"
                      : "text-white/15"
                  }`}>
                    {entry.type === "female" ? "Liza" : "Lix"}
                  </span>
                  <p className={`text-base leading-relaxed transition-all duration-500 ${
                    isActive ? "text-white font-medium scale-[1.01]" : "text-white/20"
                  }`}>
                    {entry.content}
                  </p>
                </div>
              );
            }) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-white/20 text-sm italic">{loaded ? "Press play to start listening" : "Loading podcast..."}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ PLAYER BAR ═══ */}
      <div className="relative z-10 flex-shrink-0 px-6 pb-6 pt-4">
        <div className="max-w-lg mx-auto bg-white/[0.06] backdrop-blur-xl rounded-3xl px-6 py-5 border border-white/[0.08]">
          {/* Title + Source row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white/90 truncate font-[family-name:var(--font-parkinsans)]">
                {podcastName || "Elixpo Podcast"}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                {faviconUrl && sourceDomain && (
                  <a href={sourceLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 group">
                    <img src={faviconUrl} alt="" width={12} height={12} className="rounded-sm opacity-50 group-hover:opacity-80" />
                    <span className="text-[10px] text-white/30 group-hover:text-white/50 uppercase tracking-wider">{sourceDomain}</span>
                  </a>
                )}
                {!sourceDomain && <span className="text-[10px] text-white/20 italic">Elixpo Copilot</span>}
              </div>
            </div>
            {/* CC toggle */}
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                showCaptions ? "bg-white/15 border-white/20 text-white/80" : "bg-transparent border-white/10 text-white/30 hover:text-white/50"
              }`}
            >
              CC
            </button>
          </div>

          {/* Seek bar */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] text-white/30 font-mono w-8 text-right">{fmt(currentTime)}</span>
            <div
              ref={seekBarRef}
              onClick={seekTo}
              className="flex-1 h-1 rounded-full cursor-pointer relative group hover:h-1.5 transition-all"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div className="absolute inset-y-0 left-0 rounded-full transition-all bg-white/80" style={{ width: `${pct}%` }} />
              <div className="absolute w-3 h-3 rounded-full bg-white -top-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${pct}% - 6px)` }} />
            </div>
            <span className="text-[10px] text-white/30 font-mono w-8">{fmt(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-5">
            <button onClick={cycleSpeed} className="w-9 h-7 rounded-md text-[10px] text-white/40 font-bold hover:bg-white/10 hover:text-white/60 transition-all cursor-pointer flex items-center justify-center">{speed}x</button>

            <button onClick={() => skip(-10)} className="text-white/40 hover:text-white/70 transition-colors cursor-pointer p-1.5">
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M2.74999 2.5C2.33578 2.5 2 2.83579 2 3.25V8.75C2 9.16421 2.33578 9.5 2.74999 9.5H8.25011C8.66432 9.5 9.00011 9.16421 9.00011 8.75C9.00011 8.33579 8.66432 8 8.25011 8H4.34273C5.40077 6.60212 6.77033 5.4648 8.47169 4.93832C10.5381 4.29885 12.7232 4.35354 14.7384 5.10317C16.7673 5.85787 18.6479 7.38847 19.5922 9.11081C19.7914 9.47401 20.2473 9.607 20.6104 9.40785C20.9736 9.20871 21.1066 8.75284 20.9075 8.38964C19.7655 6.30687 17.5773 4.55877 15.2614 3.69728C12.9318 2.83072 10.4069 2.7693 8.02826 3.50536C6.14955 4.08673 4.65345 5.26153 3.49999 6.64949V3.25C3.49999 2.83579 3.1642 2.5 2.74999 2.5Z" fill="currentColor" /></svg>
            </button>

            <button
              onClick={togglePlay}
              disabled={audioError}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${audioError ? "bg-white/10 cursor-not-allowed" : "bg-white hover:scale-105 active:scale-95 shadow-lg shadow-white/5"}`}
            >
              {audioError ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              ) : isPlaying ? (
                <svg viewBox="0 0 32 32" className="w-6 h-6"><path d="M7.25 29C5.45507 29 4 27.5449 4 25.75V7.25C4 5.45507 5.45507 4 7.25 4H10.75C12.5449 4 14 5.45507 14 7.25V25.75C14 27.5449 12.5449 29 10.75 29H7.25ZM21.25 29C19.4551 29 18 27.5449 18 25.75V7.25C18 5.45507 19.4551 4 21.25 4H24.75C26.5449 4 28 5.45507 28 7.25V25.75C28 27.5449 26.5449 29 24.75 29H21.25Z" fill="#111" /></svg>
              ) : (
                <svg viewBox="0 0 32 32" className="w-6 h-6 ml-0.5"><path d="M12.2246 27.5373C9.89137 28.8585 7 27.173 7 24.4917V7.50044C7 4.81864 9.89234 3.1332 12.2256 4.45537L27.2233 12.9542C29.5897 14.2951 29.5891 17.7047 27.2223 19.0449L12.2246 27.5373Z" fill="#111" /></svg>
              )}
            </button>

            <button onClick={() => skip(10)} className="text-white/40 hover:text-white/70 transition-colors cursor-pointer p-1.5">
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M21.25 2.5C21.6642 2.5 22 2.83579 22 3.25V8.75C22 9.16421 21.6642 9.5 21.25 9.5H15.7499C15.3357 9.5 14.9999 9.16421 14.9999 8.75C14.9999 8.33578 15.3357 8 15.7499 8H19.6573C18.5992 6.60212 17.2297 5.4648 15.5283 4.93832C13.4619 4.29885 11.2768 4.35354 9.26156 5.10317C7.23271 5.85787 5.35214 7.38846 4.40776 9.11081C4.20861 9.47401 3.75274 9.607 3.38955 9.40785C3.02635 9.20871 2.89336 8.75283 3.09251 8.38964C4.23451 6.30687 6.42268 4.55877 8.73861 3.69728C11.0682 2.83072 13.5931 2.7693 15.9717 3.50536C17.8504 4.08673 19.3465 5.26153 20.5 6.64949V3.25C20.5 2.83579 20.8358 2.5 21.25 2.5Z" fill="currentColor" /></svg>
            </button>

            <div className="w-9" />
          </div>
        </div>
      </div>
    </section>
  );
}
