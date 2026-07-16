import { colorName } from '@/lib/catalog';

// Text-only pill — no color swatch, since custom hex/name pairs in the admin
// panel are unreliable (name doesn't always match the actual hex).
export function ColorPill({
  id,
  en,
  selected,
  onClick,
}: {
  id: string;
  en: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
        selected ? 'border-gold bg-gold/10 text-gold' : 'border-foreground/20 text-foreground/75 hover:border-gold/50'
      }`}
    >
      {colorName(id, en)}
    </button>
  );
}
