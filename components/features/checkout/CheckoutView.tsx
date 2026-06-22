'use client';

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Check, ChevronDown, CreditCard, Loader2, Lock, MapPin, Package,
  RefreshCcw, Truck, User, Wallet,
} from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart';
import { asset } from '@/lib/asset';
import { TOP_UA_CITIES, fallbackBranches } from '@/lib/np-fallback';

type PayMethod = 'card' | 'cod';

interface Form {
  firstName: string;
  lastName: string;
  phone: string;
  city: { ref: string; name: string; area: string } | null;
  branch: { ref: string; number: string; description: string } | null;
  payment: PayMethod;
  agree: boolean;
}

const EMPTY_FORM: Form = {
  firstName: '',
  lastName: '',
  phone: '+380',
  city: null,
  branch: null,
  payment: 'cod',
  agree: false,
};

function isValidPhone(p: string) {
  return /^\+380\d{9}$/.test(p.replace(/\s/g, ''));
}

export default function CheckoutView() {
  const locale = useLocale();
  const router = useRouter();

  // ───────── cart (hydration-safe) ─────────
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const hydrated = useSyncExternalStore(
    (cb) => useCartStore.persist.onFinishHydration(cb),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const itemCount = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  // ───────── form state ─────────
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Empty cart → catalog (only after hydration AND only if we didn't just
  // submit — otherwise clearCart() would race the success-page redirect)
  useEffect(() => {
    if (!submitted && hydrated && items.length === 0) router.replace('/catalog');
  }, [submitted, hydrated, items.length, router]);

  const setField = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  // ───────── city autocomplete ─────────
  const [cityQuery, setCityQuery] = useState('');
  const [remoteCities, setRemoteCities] = useState<typeof TOP_UA_CITIES | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const cityBoxRef = useRef<HTMLDivElement>(null);

  const cityResults = useMemo(() => {
    if (cityQuery.length < 2) return TOP_UA_CITIES.slice(0, 8);
    if (remoteCities && remoteCities.length > 0) return remoteCities;
    const q = cityQuery.toLowerCase();
    return TOP_UA_CITIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [cityQuery, remoteCities]);

  useEffect(() => {
    if (cityQuery.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setCityLoading(true);
      try {
        const res = await fetch(`/api/np/cities?q=${encodeURIComponent(cityQuery)}`, { signal: ctrl.signal });
        if (res.ok) {
          const j = await res.json();
          if (Array.isArray(j.cities) && j.cities.length > 0) {
            setRemoteCities(j.cities);
            return;
          }
        }
        setRemoteCities([]);
      } catch {
        setRemoteCities([]);
      } finally {
        setCityLoading(false);
      }
    }, 300);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [cityQuery]);

  // Click-outside city dropdown
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (cityBoxRef.current && !cityBoxRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // ───────── branches ─────────
  const [remoteBranches, setRemoteBranches] = useState<{ ref: string; number: string; description: string }[] | null>(null);
  const [branchLoading, setBranchLoading] = useState(false);
  const branches = useMemo(() => {
    if (!form.city) return [];
    return remoteBranches ?? [];
  }, [form.city, remoteBranches]);

  useEffect(() => {
    if (!form.city) return;
    const ctrl = new AbortController();
    const cityRef = form.city.ref;
    const cityName = form.city.name;
    (async () => {
      setBranchLoading(true);
      try {
        const res = await fetch(`/api/np/branches?cityRef=${encodeURIComponent(cityRef)}`, { signal: ctrl.signal });
        if (res.ok) {
          const j = await res.json();
          if (Array.isArray(j.branches) && j.branches.length > 0) {
            setRemoteBranches(j.branches);
            return;
          }
        }
        setRemoteBranches(fallbackBranches(cityName));
      } catch {
        setRemoteBranches(fallbackBranches(cityName));
      } finally {
        setBranchLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [form.city]);

  // ───────── validation ─────────
  const errors = {
    firstName: !form.firstName.trim() ? 'Введіть імʼя' : null,
    phone: !isValidPhone(form.phone) ? 'Формат: +380XXXXXXXXX' : null,
    city: !form.city ? 'Оберіть місто' : null,
    branch: !form.branch ? 'Оберіть відділення' : null,
    agree: !form.agree ? 'Підтвердіть згоду' : null,
  };
  const formValid = Object.values(errors).every((e) => e === null);

  // ───────── submit ─────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Touch all so errors show
    setTouched({
      firstName: true, lastName: true, phone: true,
      city: true, branch: true, agree: true,
    });
    if (!formValid) {
      // Scroll to first error
      const first = document.querySelector('[data-invalid="true"]');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (form.payment === 'card') return; // disabled, shouldn't happen

    setSubmitting(true);
    setSubmitted(true); // freezes empty-cart guard before clearCart fires
    const orderRef = `KC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    // TODO: real Order creation + Mono invoice. For now: log + redirect.
    console.info('[checkout] order payload', { orderRef, form, items, subtotal });
    await new Promise((r) => setTimeout(r, 600));
    router.push(`/order-success?ref=${orderRef}`);
    // Clear the cart only after navigation kicks off, so the user's basket
    // is empty when they come back to /catalog later.
    clearCart();
  }

  // Don't flash empty content during hydration
  if (!hydrated) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-foreground/30" size={28} />
      </div>
    );
  }
  if (items.length === 0) return null;

  // ───────── render ─────────
  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12 lg:grid lg:grid-cols-[1fr_380px] lg:gap-10">
      {/* ─────────── LEFT: form ─────────── */}
      <div className="space-y-6 lg:space-y-8">
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Оформлення замовлення
        </h1>

        {/* SECTION 1: Contacts */}
        <Section icon={<User size={18} />} title="Контактна інформація">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Імʼя"
              required
              value={form.firstName}
              onChange={(v) => setField('firstName', v)}
              onBlur={() => blur('firstName')}
              autoComplete="given-name"
              error={touched.firstName ? errors.firstName : null}
            />
            <Field
              label="Прізвище"
              value={form.lastName}
              onChange={(v) => setField('lastName', v)}
              onBlur={() => blur('lastName')}
              autoComplete="family-name"
              error={null}
            />
            <Field
              label="Телефон"
              required
              value={form.phone}
              onChange={(v) => setField('phone', v.startsWith('+') ? v : `+${v}`)}
              onBlur={() => blur('phone')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              error={touched.phone ? errors.phone : null}
              hint="Формат: +380XXXXXXXXX"
            />
          </div>
        </Section>

        {/* SECTION 2: Delivery (Nova Poshta) */}
        <Section icon={<Truck size={18} />} title="Доставка — Нова Пошта">
          {/* City autocomplete */}
          <div ref={cityBoxRef} className="relative">
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-foreground/65">
              Місто <span className="text-gold">*</span>
            </label>
            <div className="relative">
              <MapPin size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                value={form.city ? `${form.city.name}, ${form.city.area} обл.` : cityQuery}
                onChange={(e) => {
                  if (form.city) setField('city', null);
                  setCityQuery(e.target.value);
                  setCityOpen(true);
                }}
                onFocus={() => setCityOpen(true)}
                onBlur={() => blur('city')}
                placeholder="Почніть вводити місто…"
                autoComplete="address-level2"
                data-invalid={touched.city && !!errors.city}
                className="h-12 w-full rounded-2xl border border-foreground/20 bg-white pl-11 pr-10 text-base text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-gold focus:ring-2 focus:ring-gold/30 aria-[invalid=true]:border-red-300"
                aria-invalid={touched.city && !!errors.city}
              />
              {cityLoading && (
                <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-foreground/40" />
              )}
            </div>
            {cityOpen && !form.city && cityResults.length > 0 && (
              <div className="absolute z-10 mt-1.5 max-h-72 w-full overflow-y-auto rounded-2xl border border-foreground/10 bg-white shadow-float">
                {cityResults.map((c) => (
                  <button
                    key={c.ref}
                    type="button"
                    onClick={() => {
                      setField('city', c);
                      setField('branch', null);
                      setCityOpen(false);
                      setCityQuery('');
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-powder-100 focus-visible:bg-powder-100 focus-visible:outline-none"
                  >
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-[12px] text-foreground/55">{c.area} обл.</span>
                  </button>
                ))}
              </div>
            )}
            {touched.city && errors.city && (
              <p className="mt-1.5 text-xs text-red-500">{errors.city}</p>
            )}
          </div>

          {/* Branch select */}
          <div className="mt-4">
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-foreground/65">
              Відділення <span className="text-gold">*</span>
            </label>
            <div className="relative">
              <Package size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
              <select
                value={form.branch?.ref ?? ''}
                onChange={(e) => {
                  const b = branches.find((x) => x.ref === e.target.value);
                  setField('branch', b ?? null);
                }}
                onBlur={() => blur('branch')}
                disabled={!form.city || branchLoading}
                data-invalid={touched.branch && !!errors.branch}
                aria-invalid={touched.branch && !!errors.branch}
                className="h-12 w-full appearance-none rounded-2xl border border-foreground/20 bg-white pl-11 pr-10 text-base text-foreground outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/30 disabled:cursor-not-allowed disabled:bg-foreground/5 disabled:text-foreground/40 aria-[invalid=true]:border-red-300"
              >
                <option value="">
                  {!form.city ? 'Спочатку оберіть місто' : branchLoading ? 'Завантаження…' : 'Оберіть відділення'}
                </option>
                {branches.map((b) => (
                  <option key={b.ref} value={b.ref}>
                    №{b.number} — {b.description}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            </div>
            {touched.branch && errors.branch && (
              <p className="mt-1.5 text-xs text-red-500">{errors.branch}</p>
            )}
          </div>
        </Section>

        {/* SECTION 3: Payment */}
        <Section icon={<Wallet size={18} />} title="Спосіб оплати">
          <div className="grid gap-3 sm:grid-cols-2">
            <PayCard
              selected={form.payment === 'card'}
              disabled
              icon={<CreditCard size={20} />}
              title="Оплатити карткою"
              subtitle="Visa / Mastercard / Apple Pay"
              badge="Скоро"
              onClick={() => undefined}
            />
            <PayCard
              selected={form.payment === 'cod'}
              icon={<Package size={20} />}
              title="Післяплата"
              subtitle="Оплата при отриманні у відділенні Нової Пошти"
              onClick={() => setField('payment', 'cod')}
            />
          </div>
        </Section>

        {/* Agreement + submit (mobile-friendly, desktop has summary CTA too) */}
        <div className="space-y-4">
          <label className="flex items-start gap-3 text-sm text-foreground/70">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => {
                setField('agree', e.target.checked);
                blur('agree');
              }}
              data-invalid={touched.agree && !!errors.agree}
              className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-foreground/30 text-gold accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            />
            <span>
              Я погоджуюся з{' '}
              <Link href="/legal/offer" className="text-gold underline underline-offset-2 hover:no-underline">
                умовами продажу
              </Link>{' '}
              та{' '}
              <Link href="/legal/privacy" className="text-gold underline underline-offset-2 hover:no-underline">
                політикою конфіденційності
              </Link>
              .
            </span>
          </label>
          {touched.agree && errors.agree && (
            <p className="-mt-2 text-xs text-red-500">{errors.agree}</p>
          )}
        </div>
      </div>

      {/* ─────────── RIGHT: sticky summary ─────────── */}
      <aside className="mt-8 lg:mt-0">
        <div className="sticky top-24 space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h2 className="font-sans text-xl font-semibold text-foreground">Ваше замовлення</h2>
            <p className="mt-1 text-sm text-foreground/55">
              {itemCount === 1 ? '1 товар' : `${itemCount} товарів`}
            </p>

            <ul className="mt-5 space-y-3">
              {items.map((it) => (
                <li key={`${it.productId}-${it.variantId ?? 'x'}`} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-powder-100">
                    {it.imageUrl && (
                      <Image src={asset(it.imageUrl)} alt={it.name} fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                    <p className="text-[12px] text-foreground/55">
                      {[it.size, it.color].filter(Boolean).join(' · ') || '—'}
                    </p>
                    <p className="mt-0.5 text-[12px] text-foreground/55">× {it.qty}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {(it.price * it.qty).toLocaleString(locale === 'en' ? 'en-US' : 'uk-UA')} ₴
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2 border-t border-foreground/10 pt-5 text-sm">
              <div className="flex items-center justify-between text-foreground/65">
                <span>Сума</span>
                <span>{subtotal.toLocaleString('uk-UA')} ₴</span>
              </div>
              <div className="flex items-center justify-between text-foreground/65">
                <span>Доставка</span>
                <span className="text-[13px]">за тарифом НП</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-foreground/10 pt-3 text-base font-semibold text-foreground">
                <span>Разом</span>
                <span className="text-gold">{subtotal.toLocaleString('uk-UA')} ₴</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || form.payment === 'card'}
              className="mt-5 hidden h-12 w-full items-center justify-center gap-2 rounded-full bg-powder-200 text-base font-semibold text-foreground/85 shadow-card transition-all hover:bg-powder-300 hover:text-foreground hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 lg:flex"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
              {submitting ? 'Обробка…' : 'Оформити замовлення'}
            </button>
          </div>

          {/* Trust strip */}
          <div className="hidden gap-2 rounded-2xl bg-white/70 px-4 py-3 text-[12px] text-foreground/60 lg:flex lg:flex-col">
            <span className="inline-flex items-center gap-2"><Lock size={13} className="text-gold" /> Захищена оплата SSL</span>
            <span className="inline-flex items-center gap-2"><Truck size={13} className="text-gold" /> Доставка 1–3 дні по Україні</span>
            <span className="inline-flex items-center gap-2"><RefreshCcw size={13} className="text-gold" /> Обмін / повернення 14 днів</span>
          </div>
        </div>
      </aside>

      {/* Mobile sticky submit bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-foreground/10 bg-white px-4 pt-3 lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-foreground/55">Разом</p>
          <p className="truncate text-lg font-bold text-gold">{subtotal.toLocaleString('uk-UA')} ₴</p>
        </div>
        <button
          type="submit"
          disabled={submitting || form.payment === 'card'}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-powder-200 text-base font-semibold text-foreground/85 shadow-card transition-all hover:bg-powder-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
          {submitting ? 'Обробка…' : 'Оформити'}
        </button>
      </div>

      {/* Spacer for mobile sticky bar */}
      <div className="h-24 lg:hidden" aria-hidden="true" />
    </form>
  );
}

// ─────────────── Reusable bits ───────────────

function Section({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-card md:p-8">
      <header className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-powder-100 text-gold">
          {icon}
        </span>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function Field({
  label, required, value, onChange, onBlur, type = 'text', inputMode, autoComplete, error, hint,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  type?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  autoComplete?: string;
  error: string | null;
  hint?: string;
}) {
  const id = useId();
  const invalid = error !== null;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-wider text-foreground/65">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        data-invalid={invalid}
        aria-invalid={invalid}
        className="h-12 rounded-2xl border border-foreground/20 bg-white px-4 text-base text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-gold focus:ring-2 focus:ring-gold/30 aria-[invalid=true]:border-red-300"
      />
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-foreground/45">{hint}</p>
      ) : null}
    </div>
  );
}

function PayCard({
  selected, disabled, icon, title, subtitle, badge, onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`group relative flex items-start gap-3 rounded-3xl border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
        selected
          ? 'border-gold bg-gold/5'
          : disabled
            ? 'cursor-not-allowed border-foreground/10 bg-foreground/3 opacity-60'
            : 'border-foreground/15 bg-white hover:border-gold/50'
      }`}
    >
      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${selected ? 'bg-gold text-white' : 'bg-powder-100 text-gold'}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">{title}</span>
          {badge && (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-foreground/55">{subtitle}</span>
      </span>
      {selected && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-white">
          <Check size={14} />
        </span>
      )}
    </button>
  );
}
