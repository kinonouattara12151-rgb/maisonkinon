import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { ActiveFilters } from "../types";

interface FilterSectionProps {
  title: string;
  options: string[];
  selected: ActiveFilters;
  toggle: (category: string, value: string) => void;
}

export default function FilterSection({
  title,
  options,
  selected,
  toggle,
}: FilterSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-border py-3">
      <button
        type="button"
        className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-foreground"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {title}

        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-1.5">
          {options.map((option) => {
            const checked = Boolean(selected[title]?.has(option));

            return (
              <label key={option} className="group flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(title, option)}
                  className="sr-only"
                />

                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center border transition-colors ${
                    checked
                      ? "border-primary bg-primary"
                      : "border-gray-300 group-hover:border-primary"
                  }`}
                >
                  {checked && (
                    <Check size={10} className="text-white" strokeWidth={3} />
                  )}
                </span>

                <span className="text-xs text-foreground">{option}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
