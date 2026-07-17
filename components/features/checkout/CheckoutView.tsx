'use client';

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  ChevronDown, Loader2, Lock, MapPin, Package,
  RefreshCcw, Truck, User,
} from 'lucide-react';
import { useCartStore, cartItemKey } from '@/lib/stores/cart';
import { asset } from '@/lib/asset';
import { TOP_UA_CITIES } from '@/lib/np-fallback';
import { placeOrder, createHutkoPayment } from '@/app/[locale]/(checkout)/checkout/actions';
import type { Locale } from '@/i18n/routing';

interface Form {
  firstName: string;
  lastName: string;
  phone: string;
  city: { ref: string; name: string; area: string } | null;
  branch: { ref: string; number: string; description: string } | null;
}

const EMPTY_FORM: Form = {
  firstName: '',
  lastName: '',
  phone: '',
  city: null,
  branch: null,
};

export default function CheckoutView() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('checkoutPage');

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

  // Group accessories under the product they were added with, same as the
  // cart page — otherwise a dress + accessory kit splits into flat unrelated
  // rows here even though it's one kit in the cart.
  const productItems = useMemo(
    () => items.filter((i): i is Extract<typeof items[number], { kind: 'product' }> => i.kind === 'product'),
    [items],
  );
  const accessoriesOf = (productId: string) =>
    items.filter(
      (i): i is Extract<typeof items[number], { kind: 'accessory' }> =>
        i.kind === 'accessory' && i.productId === productId,
    );
  const topLevelItems = useMemo(
    () => items.filter((i) => i.kind === 'product' || !productItems.some((p) => p.productId === i.productId)),
    [items, productItems],
  );

  // ───────── form state ─────────
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [hutkoRetry, setHutkoRetry] = useState<{ id: string; ref: string } | null>(null);

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
  const [branchQuery, setBranchQuery] = useState('');
  const [branchOpen, setBranchOpen] = useState(false);
  const branchBoxRef = useRef<HTMLDivElement>(null);

  const branches = useMemo(() => {
    if (!form.city) return [];
    return remoteBranches ?? [];
  }, [form.city, remoteBranches]);

  const filteredBranches = useMemo(() => {
    if (!branchQuery.trim()) return branches.slice(0, 80);
    const q = branchQuery.toLowerCase();
    return branches.filter(
      (b) => b.number.includes(q) || b.description.toLowerCase().includes(q),
    );
  }, [branches, branchQuery]);

  // Click-outside branch dropdown (declared after branchBoxRef/setBranchOpen)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (branchBoxRef.current && !branchBoxRef.current.contains(e.target as Node)) {
        setBranchOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!form.city) return;
    const ctrl = new AbortController();
    const cityRef = form.city.ref;
    (async () => {
      setBranchLoading(true);
      try {
        const res = await fetch(`/api/np/branches?cityRef=${encodeURIComponent(cityRef)}`, { signal: ctrl.signal });
        if (res.ok) {
          const j = await res.json();
          if (Array.isArray(j.branches) && j.branches.length > 0) {
            setRemoteBranches(j.branches);
          }
        }
      } catch {
        // branch fetch failed — leave list empty so user sees the error state
      } finally {
        setBranchLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [form.city]);

  // ───────── validation ─────────
  const errors = {
    firstName: !form.firstName.trim() ? t('errFirstName') : null,
    phone: !form.phone.trim() ? t('errPhone') : null,
    city: !form.city ? t('errCity') : null,
    branch: !form.branch ? t('errBranch') : null,
  };
  const formValid = Object.values(errors).every((e) => e === null);

  // ───────── submit ─────────
  async function attemptHutkoPayment(orderId: string, ref: string) {
    setServerError(null);
    setSubmitting(true);
    const result = await createHutkoPayment(orderId, locale as Locale);
    if ('error' in result) {
      setSubmitting(false);
      setHutkoRetry({ id: orderId, ref });
      setServerError(result.error);
      return;
    }
    clearCart();
    window.location.href = result.checkoutUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, phone: true, city: true, branch: true });
    if (!formValid) {
      const first = document.querySelector('[data-invalid="true"]');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setServerError(null);
    setHutkoRetry(null);
    setSubmitting(true);
    setSubmitted(true);

    const result = await placeOrder({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      city: form.city?.name ?? '',
      novaPoshta: form.branch ? `№${form.branch.number} — ${form.branch.description}` : '',
      note: '',
      paymentMethod: 'card',
      items,
    });

    if ('error' in result) {
      setSubmitting(false);
      setSubmitted(false);
      setServerError(result.error);
      return;
    }

    await attemptHutkoPayment(result.orderId, result.ref);
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
          {t('title')}
        </h1>

        {/* SECTION 1: Contacts */}
        <Section icon={<User size={18} />} title={t('sectionContact')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('firstName')}
              required
              value={form.firstName}
              onChange={(v) => setField('firstName', v)}
              onBlur={() => blur('firstName')}
              autoComplete="given-name"
              error={touched.firstName ? errors.firstName : null}
            />
            <Field
              label={t('lastName')}
              value={form.lastName}
              onChange={(v) => setField('lastName', v)}
              onBlur={() => blur('lastName')}
              autoComplete="family-name"
              error={null}
            />
            <Field
              label={t('phone')}
              required
              value={form.phone}
              onChange={(v) => setField('phone', v)}
              onBlur={() => blur('phone')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              error={touched.phone ? errors.phone : null}
              hint={t('phoneHint')}
            />
          </div>
        </Section>

        {/* SECTION 2: Delivery (Nova Poshta) */}
        <Section icon={<Truck size={18} />} title={t('sectionDelivery')}>
          {/* City autocomplete */}
          <div ref={cityBoxRef} className="relative">
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-foreground/65">
              {t('city')} <span className="text-gold">*</span>
            </label>
            <div className="relative">
              <MapPin size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                value={form.city ? `${form.city.name}, ${form.city.area} ${t('cityRegionSuffix')}` : cityQuery}
                onChange={(e) => {
                  if (form.city) setField('city', null);
                  setCityQuery(e.target.value);
                  setCityOpen(true);
                }}
                onFocus={() => {
                  if (form.city) {
                    setField('city', null);
                    setCityQuery('');
                    setRemoteCities(null);
                  }
                  setCityOpen(true);
                }}
                onBlur={() => blur('city')}
                placeholder={t('cityPlaceholder')}
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
                      setBranchQuery('');
                      setRemoteBranches(null);
                      setCityOpen(false);
                      setCityQuery('');
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-powder-100 focus-visible:bg-powder-100 focus-visible:outline-none"
                  >
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-[12px] text-foreground/55">{c.area} {t('cityRegionSuffix')}</span>
                  </button>
                ))}
              </div>
            )}
            {touched.city && errors.city && (
              <p className="mt-1.5 text-xs text-red-500">{errors.city}</p>
            )}
          </div>

          {/* Branch searchable dropdown */}
          <div ref={branchBoxRef} className="relative mt-4">
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-foreground/65">
              {t('branch')} <span className="text-gold">*</span>
            </label>
            <div className="relative">
              <Package size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                inputMode="search"
                value={form.branch ? `№${form.branch.number} — ${form.branch.description}` : branchQuery}
                onChange={(e) => {
                  if (form.branch) setField('branch', null);
                  setBranchQuery(e.target.value);
                  setBranchOpen(true);
                }}
                onFocus={() => {
                  if (form.branch) {
                    setField('branch', null);
                    setBranchQuery('');
                  }
                  setBranchOpen(true);
                }}
                onBlur={() => blur('branch')}
                disabled={!form.city || branchLoading}
                placeholder={
                  !form.city
                    ? t('branchPickCityFirst')
                    : branchLoading
                      ? t('branchLoading')
                      : t('branchPick')
                }
                data-invalid={touched.branch && !!errors.branch}
                aria-invalid={touched.branch && !!errors.branch}
                className="h-12 w-full rounded-2xl border border-foreground/20 bg-white pl-11 pr-10 text-base text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-gold focus:ring-2 focus:ring-gold/30 disabled:cursor-not-allowed disabled:bg-foreground/5 disabled:text-foreground/40 aria-[invalid=true]:border-red-300"
              />
              {branchLoading
                ? <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-foreground/40" />
                : <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              }
            </div>
            {branchOpen && !form.branch && filteredBranches.length > 0 && (
              <div className="absolute z-10 mt-1.5 max-h-64 w-full overflow-y-auto rounded-2xl border border-foreground/10 bg-white shadow-float">
                {!branchQuery.trim() && branches.length > 80 && (
                  <p className="px-4 py-2.5 text-[11px] text-foreground/45">
                    Показано перші 80 з {branches.length} — введіть номер для пошуку
                  </p>
                )}
                {filteredBranches.map((b) => (
                  <button
                    key={b.ref}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setField('branch', b);
                      setBranchOpen(false);
                      setBranchQuery('');
                    }}
                    className="flex w-full flex-col px-4 py-3 text-left transition-colors hover:bg-powder-100 focus-visible:bg-powder-100 focus-visible:outline-none"
                  >
                    <span className="text-sm font-semibold text-foreground">№{b.number}</span>
                    <span className="mt-0.5 text-xs leading-snug text-foreground/55">{b.description}</span>
                  </button>
                ))}
              </div>
            )}
            {touched.branch && errors.branch && (
              <p className="mt-1.5 text-xs text-red-500">{errors.branch}</p>
            )}
          </div>
        </Section>

      </div>

      {/* ─────────── RIGHT: sticky summary ─────────── */}
      <aside className="mt-8 lg:mt-0">
        <div className="sticky top-24 space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h2 className="font-sans text-xl font-semibold text-foreground">{t('yourOrder')}</h2>
            <p className="mt-1 text-sm text-foreground/55">
              {t('items', { count: itemCount })}
            </p>

            <ul className="mt-5 space-y-3">
              {topLevelItems.map((it) => (
                <li key={cartItemKey(it)}>
                  <div className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-powder-100">
                      {it.kind === 'product' && it.imageUrl && (
                        <Image src={asset(it.imageUrl)} alt={it.name} fill sizes="64px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                      <p className="text-[12px] text-foreground/55">
                        {it.kind === 'product' ? [it.size, it.color].filter(Boolean).join(' · ') || '—' : '—'}
                      </p>
                      <p className="mt-0.5 text-[12px] text-foreground/55">× {it.qty}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-foreground">
                      {(it.price * it.qty).toLocaleString(locale === 'en' ? 'en-US' : 'uk-UA')} ₴
                    </span>
                  </div>

                  {it.kind === 'product' && accessoriesOf(it.productId).length > 0 && (
                    <ul className="mt-2 space-y-1.5 pl-[4.75rem]">
                      {accessoriesOf(it.productId).map((acc) => (
                        <li key={cartItemKey(acc)} className="flex items-center justify-between gap-2">
                          <span className="truncate text-[12px] text-foreground/65">
                            + {acc.name}
                            {acc.qty > 1 ? ` × ${acc.qty}` : ''}
                          </span>
                          <span className="shrink-0 text-[12px] font-semibold text-powder-300">
                            {(acc.price * acc.qty).toLocaleString(locale === 'en' ? 'en-US' : 'uk-UA')} ₴
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2 border-t border-foreground/10 pt-5 text-sm">
              <div className="flex items-center justify-between text-foreground/65">
                <span>{t('rowSubtotal')}</span>
                <span>{subtotal.toLocaleString(locale === 'en' ? 'en-US' : 'uk-UA')} ₴</span>
              </div>
              <div className="flex items-center justify-between text-foreground/65">
                <span>{t('rowDelivery')}</span>
                <span className="text-[13px]">{t('deliveryByNp')}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-foreground/10 pt-3 text-base font-semibold text-foreground">
                <span>{t('rowTotal')}</span>
                <span className="text-powder-300">{subtotal.toLocaleString(locale === 'en' ? 'en-US' : 'uk-UA')} ₴</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 hidden h-12 w-full items-center justify-center gap-2 rounded-full bg-powder-200 text-base font-semibold text-foreground/85 shadow-card transition-all hover:bg-powder-300 hover:text-foreground hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 lg:flex"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
              {submitting ? t('submitting') : t('submit')}
            </button>
          </div>

          {/* Trust strip */}
          <div className="hidden gap-2 rounded-2xl bg-white/70 px-4 py-3 text-[12px] text-foreground/60 lg:flex lg:flex-col">
            <span className="inline-flex items-center gap-2"><Lock size={13} className="text-gold" /> {t('trustSsl')}</span>
            <span className="inline-flex items-center gap-2"><Truck size={13} className="text-gold" /> {t('trustShipping')}</span>
            <span className="inline-flex items-center gap-2"><RefreshCcw size={13} className="text-gold" /> {t('trustReturn')}</span>
          </div>
        </div>
      </aside>

      {/* Mobile sticky submit bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-foreground/10 bg-white px-4 pt-3 lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-foreground/55">{t('rowTotal')}</p>
          <p className="truncate text-lg font-bold text-powder-300">{subtotal.toLocaleString(locale === 'en' ? 'en-US' : 'uk-UA')} ₴</p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-powder-200 text-base font-semibold text-foreground/85 shadow-card transition-all hover:bg-powder-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
          {submitting ? t('submitting') : t('submitShort')}
        </button>
      </div>

      {serverError && (
        <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-700 shadow-float">
            {serverError}
          </div>
          {hutkoRetry && (
            <button
              type="button"
              onClick={() => attemptHutkoPayment(hutkoRetry.id, hutkoRetry.ref)}
              disabled={submitting}
              className="flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-white shadow-card transition-all hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
              {t('payCardRetry')}
            </button>
          )}
        </div>
      )}

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

