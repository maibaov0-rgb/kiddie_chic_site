'use client';

import { Search, X } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  placeholder,
  clearLabel,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  clearLabel: string;
  className?: string;
}) {
  return (
    <div
      className={`flex h-10 w-full items-center gap-2 rounded-full border border-white/60 bg-white/50 px-4 shadow-card backdrop-blur-sm ${className}`}
    >
      <Search size={15} className="shrink-0 text-foreground/45" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground/85 placeholder:text-foreground/40 focus:outline-none"
      />
      {value !== '' && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={clearLabel}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-foreground/40 transition-colors duration-300 ease-in-out hover:bg-powder-200 hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
