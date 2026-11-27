import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "../context/StoreContext";
import type { NavCategory } from "../types";

const INTERVAL = 4500;

const CTA_STYLES: Record<string, string> = {
  primary: "bg-[#B91C1C] text-white hover:bg-red-700",
  white:   "bg-white text-[#B91C1C] hover:bg-gray-100",
  emerald: "bg-emerald-500 text-white hover:bg-emerald-600",
};

interface HeroSliderProps {
  onNavigate: (cat: NavCategory) => void;
}

export default function HeroSlider({ onNavigate }: HeroSliderProps) {
  const { slides: allSlides, settings } = useStore();
  const slides = allSlides.filter((s) => s.enabled);

  const [current, setCurrent] = useState(0);
  const [direction, setDir]   = useState<"right" | "left">("right");
  const [animKey, setAnimKey] = useState(0);
  const [paused, setPaused]   = useState(false);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Réinitialise l'index si les slides changent */
  useEffect(() => { setCurrent(0); }, [slides.length]);

  const goTo = useCallback((next: number, dir: "right" | "left") => {
    setDir(dir);
    setCurrent(next);
    setAnimKey((k) => k + 1);
  }, []);

  const next = useCallback(() =>
    goTo((current + 1) % Math.max(1, slides.length), "right"),
  [current, goTo, slides.length]);

  const prev = useCallback(() =>
    goTo((current - 1 + Math.max(1, slides.length)) % Math.max(1, slides.length), "left"),
  [current, goTo, slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timerRef.current = setInterval(next, INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused, slides.length]);

  if (!settings.heroSliderEnabled || slides.length === 0) return null;

  const slide = slides[Math.min(current, slides.length - 1)];

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ minHeight: 320 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        key={animKey}
        className={`${direction === "right" ? "slide-in-right" : "slide-in-left"} relative flex min-h-[320px] w-full items-center sm:min-h-[400px] md:min-h-[460px]`}
        style={{ background: slide.bg }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Image */}
        <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden opacity-40 sm:opacity-60 md:opacity-80">
          <img
            src={slide.image}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-center"
            style={{ maskImage: "linear-gradient(to right, transparent 0%, black 40%)" }}
          />
        </div>

        {/* Texte */}
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 py-10 sm:px-10 md:px-14">
          <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white ${slide.badgeBg} mb-3`}>
            {slide.eyebrow}
          </span>
          <h2 className="whitespace-pre-line text-2xl font-black leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
            {slide.title}
          </h2>
          <p className="mt-3 max-w-md whitespace-pre-line text-xs leading-relaxed text-white/70 sm:text-sm">
            {slide.subtitle}
          </p>
          <button
            type="button"
            onClick={() => onNavigate(slide.category)}
            className={`mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold tracking-wide transition-all duration-200 cta-bounce ${CTA_STYLES[slide.ctaStyle] ?? CTA_STYLES.white}`}
          >
            {slide.cta}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Flèches */}
      {slides.length > 1 && (
        <>
          <button type="button" onClick={prev} aria-label="Slide précédent"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/70">
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={next} aria-label="Slide suivant"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/70">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {slides.map((s, i) => (
            <button key={s.id} type="button"
              onClick={() => goTo(i, i > current ? "right" : "left")}
              aria-label={`Aller au slide ${i + 1}`}
              aria-current={i === current}
              className={`transition-all duration-300 ${i === current ? "h-2.5 w-7 bg-white" : "h-2 w-2 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      )}

      {/* Barre de progression */}
      {!paused && slides.length > 1 && (
        <div className="absolute bottom-0 left-0 z-20 h-[3px] w-full bg-white/10">
          <div
            key={`${animKey}-bar`}
            className="h-full bg-white/60"
            style={{ animation: `progress-fill ${INTERVAL}ms linear forwards`, "--progress-width": "100%" } as React.CSSProperties}
          />
        </div>
      )}
    </div>
  );
}
