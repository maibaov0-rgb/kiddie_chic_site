// Prefix a local asset path (e.g. /images/...) with the configured base path.
//
// next/image applies basePath automatically when optimizing, but under static
// export with `images.unoptimized` the basePath is NOT added to the <img> src,
// so local images 404 on GitHub Pages. Wrapping the src with asset() fixes it.
// In the normal app build NEXT_PUBLIC_BASE_PATH is empty, so this is a no-op.

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
