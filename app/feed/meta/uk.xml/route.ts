import { prisma } from '@/lib/prisma';

// Meta/Google Shopping product feed for Commerce Manager.
// DB-backed — must render at request time, not build time (CI has no DB access).
export const dynamic = 'force-dynamic';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://kiddiechic.ua').replace(/\/$/, '');

const PRODUCT_TYPE: Record<'dress' | 'couture', string> = {
  dress: 'Сукні > Основна колекція',
  couture: 'Сукні > Кутюрна колекція',
};

const CUSTOM_LABEL_0: Record<'dress' | 'couture', string> = {
  dress: '2 weeks',
  couture: '4 weeks',
};

const CATEGORY_TO_SLUG: Record<'dress' | 'couture', string> = {
  dress: 'dresses',
  couture: 'couture',
};

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: {
      isHidden: false,
      category: { in: ['dress', 'couture'] },
      images: { isEmpty: false },
    },
    select: {
      id: true,
      slug: true,
      category: true,
      name_uk: true,
      description_uk: true,
      images: true,
      colors: true,
      inStock: true,
      variants: { select: { id: true, size: true, price: true } },
    },
  });

  const items = products.flatMap((product) => {
    const category = product.category as 'dress' | 'couture';
    const path = `/catalog/${CATEGORY_TO_SLUG[category]}/${product.slug}`;
    const link = `${SITE_URL}${path}`;
    const title = xmlEscape(product.name_uk.slice(0, 200));
    const description = cdata(stripHtml(product.description_uk).slice(0, 5000));
    const imageLink = xmlEscape(product.images[0] ?? '');
    const additionalImages = product.images
      .slice(1, 11)
      .map((url) => `      <g:additional_image_link>${xmlEscape(url)}</g:additional_image_link>`)
      .join('\n');
    const color = xmlEscape(product.colors.join(', '));
    const availability = product.inStock ? 'in stock' : 'available for order';

    return product.variants.map((variant) => {
      const price = `${variant.price.toFixed(2)} UAH`;
      return `    <item>
      <g:id>${variant.id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
${additionalImages}
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${price}</g:price>
      <g:brand>Kiddie Chic</g:brand>
      <g:google_product_category>5424</g:google_product_category>
      <g:product_type>${PRODUCT_TYPE[category]}</g:product_type>
      <g:item_group_id>${product.id}</g:item_group_id>
      <g:size>${xmlEscape(variant.size)}</g:size>
      <g:size_system>EU</g:size_system>
      <g:color>${color}</g:color>
      <g:gender>female</g:gender>
      <g:custom_label_0>${CUSTOM_LABEL_0[category]}</g:custom_label_0>
    </item>`;
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Kiddie Chic</title>
    <link>${SITE_URL}</link>
    <description>Kiddie Chic product feed</description>
${items.join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
