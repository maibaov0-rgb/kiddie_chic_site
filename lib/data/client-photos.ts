// Real photos live in /public/images/reviews/ (1.jpg .. 21.jpg), dropped in
// manually — not part of the code deploy. Order determines stack sequence.
// The showcase carousel is fully data-driven off this array's length, so
// adding/removing entries here is all that's needed to change what renders.
export const CLIENT_PHOTOS: string[] = Array.from(
  { length: 21 },
  (_, i) => `/images/reviews/${i + 1}.jpg`,
);
