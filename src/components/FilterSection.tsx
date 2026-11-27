import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { ActiveFilters } from "../types";

/* Listes avec plus de N options → tronquées + bouton "Voir plus" */
const COLLAPSE_THRESHOLD = 7;

interface FilterSectionProps {
  title: string;
  options: string[];
  selected: ActiveFilters;
  toggle: (category: string, value: string) => void;
}

export default function FilterSection({ title, options, selected, toggle }: FilterSectionProps) {
  const [open, setOpen]       = useState(true);
  const [expanded, setExpanded] = useState(false);

  /* Sur les listes longues, n'affiche les 7 premières options que si non étendu */
  const tooLong   = options.length > COLLAPSE_THRESHOLD;
  const visible   = tooLong && !expanded ? options.slice(0, COLLAPSE_THRESHOLD) : options;
  const hiddenCount = options.length - COLLAPSE_THRESHOLD;

  /* Si au moins une option cachée est sélectionnée, on force l'extension */
  const hasHiddenSelected = tooLong && !expanded &&
    options.slice(COLLAPSE_THRESHOLD).some((o) => selected[title]?.has(o));
  const displayOptions = hasHiddenSelected ? options : visible;

  return (
    <div className="border-b border-border py-3">
      <button
        type="button"
        className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-foreground"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {title}
        <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-1.5">
          {displayOptions.map((option) => {
            const checked = Boolean(selected[title]?.has(option));
            return (
              <label key={option} className="group flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={checked} onChange={() => toggle(title, option)} className="sr-only" />
                <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded transition-colors ${
                  checked ? "bg-primary" : "border border-gray-300 group-hover:border-primary"
                }`}>
                  {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                </span>
                <span className="text-xs text-foreground leading-tight">{option}</span>
              </label>
            );
          })}

          {/* Bouton Voir plus / Voir moins */}
          {tooLong && !hasHiddenSelected && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              <ChevronDown
                size={11}
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              />
              {expanded ? "Voir moins" : `+${hiddenCount} autres`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
