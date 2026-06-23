"use server";

import { auth } from "@/auth";
import { getUploadSignature } from "@/lib/cloudinary";

export async function signUploadAction() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") throw new Error("UNAUTHORIZED");
  return getUploadSignature();
}
