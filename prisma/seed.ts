import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma  = new PrismaClient({ adapter });

async function main() {
  const email    = process.env["ADMIN_EMAIL"];
  const password = process.env["ADMIN_PASSWORD"];

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where:  { email },
    update: {},
    create: { email, password: hash, name: "Admin", role: "ADMIN" },
  });

  await prisma.siteSettings.upsert({
    where:  { id: 1 },
    update: {},
    create: { id: 1 },
  });

  console.log("Seed complete — admin user and SiteSettings created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
