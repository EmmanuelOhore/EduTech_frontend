import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  Maximize2,
  Minus,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  jobsCount: number;
  locationsCount: number;
  schoolsCount: number;
};

type Mode = "expanded" | "minimized" | "hidden";

const STORAGE_KEY = "jobsHeroMode";

const SLIDES: { img: string; caption: string }[] = [
  {
    img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=70",
    caption: "Connecting schools with great educators",
  },
  {
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=70",
    caption: "Modern classrooms, modern teaching",
  },
  {
    img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=70",
    caption: "Roles across teaching, admin & support",
  },
  {
    img: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1600&q=70",
    caption: "Find work close to home",
  },
];

const readMode = (): Mode => {
  if (typeof window === "undefined") return "expanded";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "minimized" || v === "hidden" ? v : "expanded";
};

const JobsHero = ({ jobsCount, locationsCount, schoolsCount }: Props) => {
  const [mode, setMode] = useState<Mode>(readMode);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const setAndStore = useCallback((m: Mode) => {
    setMode(m);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, m);
  }, []);

  // Auto-advance the carousel while expanded and not hovered.
  useEffect(() => {
    if (mode !== "expanded" || paused) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [mode, paused]);

  const stats = [
    { icon: BriefcaseBusiness, label: `${jobsCount}+ Jobs Available` },
    { icon: MapPin, label: `${locationsCount} Locations` },
    { icon: GraduationCap, label: `${schoolsCount} Schools Hiring` },
  ];

  /* ── Hidden: a slim restore button only ───────────────────── */
  if (mode === "hidden") {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-6 pt-4">
        <button
          onClick={() => setAndStore("expanded")}
          className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ef] bg-white px-4 py-2 text-xs font-bold text-[#184e77] shadow-sm transition hover:bg-[#e0f2fe]"
        >
          <Sparkles size={13} />
          Show highlights
        </button>
      </div>
    );
  }

  /* ── Minimized: compact single-row bar ────────────────────── */
  if (mode === "minimized") {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-6 pt-4">
        <div className="flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#184e77] via-[#1a6091] to-[#287271] px-4 py-3 shadow-md shadow-[#184e77]/20">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
            <Sparkles size={16} />
          </span>
          <p className="shrink-0 text-sm font-black text-white">Staff Opportunities</p>
          <div className="ml-1 hidden flex-1 flex-wrap items-center gap-2 md:flex">
            {stats.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/15"
              >
                <s.icon size={12} className="text-[#7dd3fc]" />
                {s.label}
              </span>
            ))}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => setAndStore("expanded")}
              aria-label="Expand highlights"
              className="grid size-8 place-items-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={() => setAndStore("hidden")}
              aria-label="Hide highlights"
              className="grid size-8 place-items-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Expanded: full image carousel ────────────────────────── */
  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 pt-4">
      <section
        className="relative h-[260px] overflow-hidden rounded-3xl bg-[#184e77] shadow-lg shadow-[#184e77]/25"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Slides (cross-fade) */}
        {SLIDES.map((s, i) => (
          <img
            key={s.img}
            src={s.img}
            alt=""
            aria-hidden
            className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ${
              i === slide ? "opacity-100" : "opacity-0"
            }`}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ))}

        {/* Readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b2c45]/95 via-[#123a59]/80 to-[#287271]/40" />

        {/* Controls (top-right) */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5">
          <button
            onClick={() => setAndStore("minimized")}
            aria-label="Minimize highlights"
            className="grid size-8 place-items-center rounded-lg bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30"
          >
            <Minus size={15} />
          </button>
          <button
            onClick={() => setAndStore("hidden")}
            aria-label="Hide highlights"
            className="grid size-8 place-items-center rounded-lg bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-[5] flex h-full max-w-2xl flex-col justify-center px-7 py-6">
          <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#7dd3fc] ring-1 ring-white/20 backdrop-blur-sm">
            <Sparkles size={12} />
            Staff Opportunities
          </span>
          <h1 className="text-3xl font-black leading-tight text-white md:text-4xl">
            Explore School Staff{" "}
            <span className="text-[#7dd3fc]">Opportunities</span>
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/75">
            {SLIDES[slide].caption}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15 backdrop-blur-sm"
              >
                <s.icon size={14} className="text-[#7dd3fc]" />
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Carousel arrows + dots (bottom-right) */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
          <div className="mr-1 flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length)}
            aria-label="Previous slide"
            className="grid size-8 place-items-center rounded-lg bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setSlide((s) => (s + 1) % SLIDES.length)}
            aria-label="Next slide"
            className="grid size-8 place-items-center rounded-lg bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default JobsHero;
