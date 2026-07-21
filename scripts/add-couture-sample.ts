import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

// One couture sample with NO photos — the gallery falls back to the
// no-image placeholder, and couture products carry no variants/price
// (view + consultation only). Idempotent via upsert on slug.
async function main() {
  const product = await prisma.product.upsert({
    where: { slug: "couture-sample" },
    update: {},
    create: {
      slug: "couture-sample",
      category: "couture",
      name_uk: "Кутюрна сукня «Ангеліна»",
      name_en: "Couture dress “Angelina”",
      description_uk:
        "Ексклюзивна сукня ручної роботи з французького мережива та шовку. Створюється індивідуально під замовлення. Оформлення покупки недоступне — лише консультація.",
      description_en:
        "An exclusive handmade dress in French lace and silk. Made to order individually. Not available for purchase — consultation only.",
      images: [],
      colors: [],
      inStock: true,
      isNew: false,
      isBestseller: false,
      isHidden: false,
    },
  });

  console.log("✔ couture sample ready:", { id: product.id, slug: product.slug });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
