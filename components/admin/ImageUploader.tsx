"use client";

import { useState } from "react";
import Image from "next/image";
import { signUploadAction } from "@/app/admin/products/sign-upload";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUploader({ value, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const sig = await signUploadAction();
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sig.apiKey);
        form.append("timestamp", String(sig.timestamp));
        form.append("signature", sig.signature);
        form.append("folder", sig.folder);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          { method: "POST", body: form },
        );
        if (!res.ok) throw new Error("upload failed");
        const json: { secure_url: string } = await res.json();
        uploaded.push(json.secure_url);
      }
      onChange([...value, ...uploaded]);
    } catch {
      setError("Не вдалося завантажити фото. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const a = value[index];
    const b = value[target];
    if (a === undefined || b === undefined) return;
    const next = [...value];
    next[index] = b;
    next[target] = a;
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((url, i) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-[#EDE0D4]"
          >
            <Image src={url} alt="" fill className="object-cover" sizes="120px" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/40 p-1 opacity-0 transition-all duration-300 ease-in-out group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(i, -1)}
                className="rounded-full px-2 text-white"
                aria-label="Лівіше"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => remove(url)}
                className="rounded-full px-2 text-white"
                aria-label="Видалити"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                className="rounded-full px-2 text-white"
                aria-label="Правіше"
              >
                →
              </button>
            </div>
          </div>
        ))}

        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#EDE0D4] text-center text-sm text-[#9b8b7e] transition-all duration-300 ease-in-out hover:border-[#C9A96E]">
          {busy ? "Завантаження…" : "+ Фото"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
      {error && <p className="text-sm text-[#9b4a4a]">{error}</p>}
    </div>
  );
}
