"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FDF8F4] p-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-5 rounded-3xl bg-white p-8 shadow-soft"
      >
        <h1 className="text-center text-2xl font-semibold text-[#3d2f28]">
          Вхід в адмінку
        </h1>

        <div className="space-y-2">
          <label htmlFor="email" className="text-base font-medium text-[#3d2f28]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-2xl border border-[#EDE0D4] px-4 py-3 text-base outline-none transition-all duration-300 ease-in-out focus:border-[#C9A96E]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-base font-medium text-[#3d2f28]">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-2xl border border-[#EDE0D4] px-4 py-3 text-base outline-none transition-all duration-300 ease-in-out focus:border-[#C9A96E]"
          />
        </div>

        {state?.error && (
          <p className="rounded-2xl bg-[#F4C6C6]/40 px-4 py-2 text-center text-sm text-[#9b4a4a]">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#F4C6C6] py-3 text-base font-semibold text-[#3d2f28] transition-all duration-300 ease-in-out hover:bg-[#efb4b4] disabled:opacity-60"
        >
          {pending ? "Входимо…" : "Увійти"}
        </button>
      </form>
    </main>
  );
}
