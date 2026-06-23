"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin/products",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Невірний email або пароль" };
    }
    throw error; // re-throw redirect
  }
}
