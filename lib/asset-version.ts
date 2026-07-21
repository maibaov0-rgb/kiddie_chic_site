import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Appends a short content-hash query param to a /public asset URL so browser
 * caches (Cache-Control: max-age=86400, stale-while-revalidate=604800 in
 * next.config.ts) invalidate automatically when the file's bytes change,
 * even though the filename itself stays the same across re-uploads.
 */
export function versionedAssetUrl(publicPath: string): string {
  const hash = createHash('sha256')
    .update(readFileSync(join(process.cwd(), 'public', publicPath)))
    .digest('hex')
    .slice(0, 8);
  return `${publicPath}?v=${hash}`;
}
