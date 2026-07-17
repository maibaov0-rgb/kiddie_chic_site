import FloatingContactButtonClient from './FloatingContactButtonClient';

const VIBER_LINK = 'viber://chat?number=%2B380671270967';
const WHATSAPP_LINK = 'https://wa.me/380671270967';

export default function FloatingContactButton() {
  return <FloatingContactButtonClient viberLink={VIBER_LINK} whatsappLink={WHATSAPP_LINK} />;
}
