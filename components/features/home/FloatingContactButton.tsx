import { VIBER_LINK, WHATSAPP_LINK } from '@/lib/contact';
import FloatingContactButtonClient from './FloatingContactButtonClient';

export default function FloatingContactButton() {
  return <FloatingContactButtonClient viberLink={VIBER_LINK} whatsappLink={WHATSAPP_LINK} />;
}
