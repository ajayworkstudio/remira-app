"use client";

import { Search, X } from "lucide-react";
import { controlClass } from "@/components/ui/field";
import { cn } from "@/lib/utils/cn";

export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-subtle" aria-hidden />
      <input
        type="search"
        enterKeyHint="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(controlClass, "h-12 border-transparent bg-surface pl-11 pr-11 shadow-card [&::-webkit-search-cancel-button]:hidden")}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-muted"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
