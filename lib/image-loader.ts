// Custom next/image loader.
//
// Product photos live on Cloudinary, and Cloudinary's CDN does resizing and
// format negotiation (f_auto/q_auto) itself — so the browser talks straight to
// the CDN and the VPS never proxies or re-encodes images. (The default Next
// optimizer did that on the server: a cold optimization took ~4s per image on
// prod, and its cache is wiped by every deploy.)
//
// Local /public assets (hero poster, fallback covers) are small and
// pre-compressed, so they are served untouched.
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.startsWith('https://res.cloudinary.com/')) {
    const q = quality ? `q_${quality}` : 'q_auto';
    return src.replace('/image/upload/', `/image/upload/f_auto,${q},w_${width},c_limit/`);
  }
  return src;
}
