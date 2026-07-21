// Single source of truth for the public messenger contacts. Used by the home
// floating contact button and the product-page "Get a consultation" CTA, so the
// phone number lives in exactly one place.
export const VIBER_LINK = 'viber://chat?number=%2B380671270967';
export const WHATSAPP_LINK = 'https://wa.me/380671270967';

// Brand names are proper nouns (not translatable copy) — same convention as
// SOCIAL_LINKS in components/ui/SocialIcons.tsx.
export const MESSENGERS = [
  { key: 'viber', name: 'Viber', href: VIBER_LINK, color: '#7360F2' },
  { key: 'whatsapp', name: 'WhatsApp', href: WHATSAPP_LINK, color: '#25D366' },
] as const;

export type MessengerKey = (typeof MESSENGERS)[number]['key'];
