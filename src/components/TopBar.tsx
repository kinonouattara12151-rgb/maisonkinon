import { useStore } from "../context/StoreContext";

export default function TopBar() {
  const { settings, ticker } = useStore();
  const enabled  = settings.tickerEnabled;
  const messages = ticker.filter((m) => m.enabled);

  if (!enabled || messages.length === 0) return null;

  /* Double la liste pour le loop CSS sans saut */
  const items = [...messages, ...messages];
  const SEP   = <span className="mx-6 text-white/30" aria-hidden="true">•</span>;

  return (
    <div className="bg-[#1a0a0a] text-white" style={{ minHeight: 32 }}>

      {/* ── MOBILE ── */}
      <div className="marquee-wrapper overflow-hidden md:hidden">
        <div className="marquee-track flex items-center py-1.5 text-[11px] font-medium tracking-wide">
          {items.map((m, i) => (
            <span key={i} className="flex-shrink-0 whitespace-nowrap">
              {m.text}{SEP}
            </span>
          ))}
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="relative hidden md:flex items-center">
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16"
          style={{ background: "linear-gradient(to right, #1a0a0a, transparent)" }}
        />
        <div className="marquee-wrapper min-w-0 flex-1 overflow-hidden">
          <div className="marquee-track flex items-center py-1.5 text-[11px] font-medium tracking-wide">
            {items.map((m, i) => (
              <span key={i} className="flex-shrink-0 whitespace-nowrap">
                {m.text}{SEP}
              </span>
            ))}
          </div>
        </div>
        <div
          className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16"
          style={{ background: "linear-gradient(to left, #1a0a0a, transparent)" }}
        />
      </div>
    </div>
  );
}
