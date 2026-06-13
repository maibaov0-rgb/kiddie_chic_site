import { redirect } from 'next/navigation';

// Catalog opens on the "Dresses" sub-menu by default
export default function CatalogIndexPage() {
  redirect('/catalog/dresses');
}
