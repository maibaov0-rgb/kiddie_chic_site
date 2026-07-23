"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { productSchema, type ProductInput } from "@/lib/validation/product";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { CheckboxItem } from "@/components/ui/checkbox-item";
import { SIZES, COLORS, ACCESSORY_TYPES } from "@/lib/catalog";
import type { ActionResult } from "@/app/admin/products/actions";

interface Props {
  defaultValues: ProductInput;
  onSubmit: (input: ProductInput) => Promise<ActionResult>;
  submitLabel: string;
}

const inputCls =
  "w-full rounded-2xl border border-[#EDE0D4] px-4 py-3 text-base outline-none transition-all duration-300 ease-in-out focus:border-[#C9A96E]";
const labelCls = "text-base font-medium text-[#3d2f28]";

// Safe fallbacks for noUncheckedIndexedAccess
const DEFAULT_SIZE: string = SIZES[0] ?? "86-92";

export function ProductForm({ defaultValues, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  // Zod v4 + @hookform/resolvers: productSchema's INPUT type has optional fields
  // (those with .default()), while ProductInput (z.infer<>) is the OUTPUT type
  // (all required). We pass three generics so that:
  //   TFieldValues = z.input<typeof productSchema>  (what the form stores)
  //   TContext     = unknown
  //   TTransformedValues = ProductInput             (what handleSubmit delivers)
  // This resolves the resolver/useForm generic mismatch without touching the schema.
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof productSchema>, unknown, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const variants = useFieldArray({ control, name: "variants" });
  const accessories = useFieldArray({ control, name: "accessories" });
  const watchedAccessories = useWatch({ control, name: "accessories" }) ?? [];
  const availableAccessoryTypes = ACCESSORY_TYPES.filter(
    (t) => !watchedAccessories.some((a) => a?.type === t.id),
  );

  const category = useWatch({ control, name: "category" });
  const initialCategory = useRef(defaultValues.category);
  useEffect(() => {
    if (category !== initialCategory.current) {
      setValue("featuredPosition", null);
      initialCategory.current = category;
    }
  }, [category, setValue]);

  async function submit(data: ProductInput) {
    setServerError(null);
    const res = await onSubmit(data);
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      setServerError(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-8">
      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <div className="space-y-2">
          <label className={labelCls}>Категорія</label>
          <select {...register("category")} className={inputCls}>
            <option value="dress">Основна колекція</option>
            <option value="couture">Кутюрна колекція</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={labelCls}>Назва (укр)</label>
            <input {...register("name_uk")} className={inputCls} />
            {errors.name_uk && (
              <p className="text-sm text-[#9b4a4a]">{errors.name_uk.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Назва (eng)</label>
            <input {...register("name_en")} className={inputCls} />
            {errors.name_en && (
              <p className="text-sm text-[#9b4a4a]">{errors.name_en.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={labelCls}>Опис (укр)</label>
            <textarea {...register("description_uk")} rows={4} className={inputCls} />
            {errors.description_uk && (
              <p className="text-sm text-[#9b4a4a]">{errors.description_uk.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Опис (eng)</label>
            <textarea {...register("description_en")} rows={4} className={inputCls} />
            {errors.description_en && (
              <p className="text-sm text-[#9b4a4a]">{errors.description_en.message}</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <label className={labelCls}>Фото товару</label>
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <ImageUploader value={field.value ?? []} onChange={field.onChange} />
          )}
        />
        {errors.images && (
          <p className="text-sm text-[#9b4a4a]">{errors.images.message}</p>
        )}
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <label className={labelCls}>Кольори</label>
        <Controller
          control={control}
          name="colors"
          render={({ field }) => (
            <div className="grid max-h-80 grid-cols-1 gap-x-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              {COLORS.map((c) => {
                const selected = (field.value ?? []).includes(c.id);
                return (
                  <CheckboxItem
                    key={c.id}
                    label={c.name_uk}
                    checked={selected}
                    onChange={() =>
                      field.onChange(
                        selected
                          ? (field.value ?? []).filter((v: string) => v !== c.id)
                          : [...(field.value ?? []), c.id],
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        />
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex flex-wrap gap-6">
          {(
            [
              ["isNew", "Новинка"],
              ["isBestseller", "Хіт"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-base">
              <input type="checkbox" {...register(name)} className="h-5 w-5 rounded-md" />
              {label}
            </label>
          ))}
        </div>

        <Controller
          control={control}
          name="featuredPosition"
          render={({ field }) => {
            const isFeatured = field.value !== null && field.value !== undefined;
            return (
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-base">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => field.onChange(e.target.checked ? 1 : null)}
                    className="h-5 w-5 rounded-md"
                  />
                  Показувати в топі
                </label>
                {isFeatured && (
                  <select
                    value={(field.value as number | null) ?? 1}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-auto rounded-2xl border border-[#EDE0D4] px-4 py-2 text-base outline-none transition-all duration-300 ease-in-out focus:border-[#C9A96E]"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        Позиція {n}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          }}
        />
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <label className={labelCls}>Варіанти (розмір / ціна)</label>
          <button
            type="button"
            onClick={() =>
              variants.append({ size: DEFAULT_SIZE, price: undefined as unknown as number })
            }
            className="rounded-full bg-[#FDF8F4] px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out hover:bg-[#EDE0D4]"
          >
            + Додати варіант
          </button>
        </div>

        {errors.variants?.message && (
          <p className="text-sm text-[#9b4a4a]">{errors.variants.message}</p>
        )}

        <div className="space-y-3">
          {variants.fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <select {...register(`variants.${i}.size`)} className={inputCls}>
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ціна, ₴"
                  {...register(`variants.${i}.price`)}
                  className={inputCls}
                />
                {errors.variants?.[i]?.price && (
                  <p className="mt-1 text-sm text-[#9b4a4a]">
                    {errors.variants[i]?.price?.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => variants.remove(i)}
                className="rounded-full px-4 py-3 text-sm text-[#9b4a4a] transition-all duration-300 ease-in-out hover:bg-[#F4C6C6]/30"
              >
                Видалити
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <label className={labelCls}>Аксесуари</label>
          <select
            value=""
            disabled={availableAccessoryTypes.length === 0}
            onChange={(e) => {
              const type = e.target.value as (typeof ACCESSORY_TYPES)[number]["id"] | "";
              if (!type) return;
              accessories.append({ type, price: undefined as unknown as number });
            }}
            className="rounded-full bg-[#FDF8F4] px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out hover:bg-[#EDE0D4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              + Додати аксесуар
            </option>
            {availableAccessoryTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name_uk}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {accessories.fields.map((f, i) => {
            const typeLabel = ACCESSORY_TYPES.find((t) => t.id === f.type)?.name_uk ?? f.type;
            return (
              <div key={f.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                {/* `type` has no visible input (it's a read-only label below) —
                    register it as hidden so react-hook-form actually includes
                    it in the submitted data. Without this, only registered
                    leaf inputs are guaranteed to survive submission. */}
                <input type="hidden" {...register(`accessories.${i}.type`)} />
                <span className={`${inputCls} flex items-center bg-[#FDF8F4]`}>{typeLabel}</span>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ціна, ₴"
                    {...register(`accessories.${i}.price`)}
                    className={inputCls}
                  />
                  {errors.accessories?.[i]?.price && (
                    <p className="mt-1 text-sm text-[#9b4a4a]">
                      {errors.accessories[i]?.price?.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => accessories.remove(i)}
                  className="rounded-full px-4 py-3 text-sm text-[#9b4a4a] transition-all duration-300 ease-in-out hover:bg-[#F4C6C6]/30"
                >
                  Видалити
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {serverError && (
        <p className="rounded-2xl bg-[#F4C6C6]/40 px-4 py-2 text-center text-sm text-[#9b4a4a]">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-[#F4C6C6] py-4 text-base font-semibold text-[#3d2f28] transition-all duration-300 ease-in-out hover:bg-[#efb4b4] disabled:opacity-60 sm:w-auto sm:px-12"
      >
        {isSubmitting ? "Збереження…" : submitLabel}
      </button>
    </form>
  );
}
