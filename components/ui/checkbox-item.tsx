import { Check } from 'lucide-react';

export function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl px-2 py-1 transition-colors duration-300 ease-in-out hover:bg-gold/5">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-foreground/25 transition-colors duration-300 ease-in-out peer-checked:border-gold peer-checked:bg-gold">
        {checked && <Check size={14} strokeWidth={3} className="text-white" />}
      </span>
      <span className="text-sm text-foreground/80">{label}</span>
    </label>
  );
}
