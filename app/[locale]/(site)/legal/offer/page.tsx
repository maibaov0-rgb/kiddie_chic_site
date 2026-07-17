import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import LegalPageLayout from '@/components/features/layout/LegalPageLayout';

type Params = { locale: string };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Публічна оферта — Kiddie Chic',
    description: 'Договір публічної оферти інтернет-магазину Kiddie Chic.',
  };
}

export default async function OfferPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalPageLayout title="Договір публічної оферти">

      <p className="text-foreground/70">
        Цей договір є офіційною та публічною пропозицією Продавця укласти договір купівлі-продажу
        Товару, представленого на сайті інтернет-магазину{' '}
        <a href="https://kiddiechic.ua/" className="text-gold underline-offset-2 hover:underline">
          https://kiddiechic.ua/
        </a>
        . Даний договір є публічним, тобто відповідно до статей 633, 641 Цивільного кодексу України,
        його умови є однаковими для всіх покупців незалежно від їх статусу.
      </p>

      <LegalSection title="1. ТЕРМІНИ ТА ВИЗНАЧЕННЯ">
        <p>
          <strong>1.1.</strong> Інтернет-магазин — веб-сайт, розміщений за адресою{' '}
          <a href="https://kiddiechic.ua/" className="text-gold underline-offset-2 hover:underline">
            https://kiddiechic.ua/
          </a>
          , створений для укладення договорів роздрібної купівлі-продажу.
        </p>
        <p>
          <strong>1.2.</strong> Продавець — Фізична особа-підприємець Шапошнікова Катерина
          Володимирівна, яка реалізує товари через Інтернет-магазин.
        </p>
        <p>
          <strong>1.3.</strong> Покупець — фізична особа, яка досягла 18 років, розміщує замовлення
          та купує Товари, представлені на сайті.
        </p>
        <p>
          <strong>1.4.</strong> Товар — дитячий одяг (сукні для дівчаток) та інші супутні товари,
          представлені в Інтернет-магазині.
        </p>
        <p>
          <strong>1.5.</strong> Замовлення — належним чином оформлений запит Покупця на придбання та
          доставку Товарів, обраних на сайті.
        </p>
      </LegalSection>

      <LegalSection title="2. ПРЕДМЕТ ДОГОВОРУ">
        <p>
          <strong>2.1.</strong> Продавець зобов&apos;язується передати у власність Покупцю Товар,
          а Покупець зобов&apos;язується оплатити і прийняти Товар на умовах даного Договору.
        </p>
        <p>
          <strong>2.2.</strong> Датою укладення Договору-оферти (акцептом оферти) та моментом
          повного й беззаперечного прийняття Покупцем умов Договору вважається дата заповнення та
          підтвердження Покупцем форми Замовлення на сайті.
        </p>
      </LegalSection>

      <LegalSection title="3. ПОРЯДОК ОФОРМЛЕННЯ ЗАМОВЛЕННЯ">
        <p>
          <strong>3.1.</strong> Покупець самостійно оформлює замовлення на сайті Інтернет-магазину
          через форму «Кошик».
        </p>
        <p>
          <strong>3.2.</strong> При оформленні замовлення Покупець зобов&apos;язується надати
          достовірну інформацію про себе (ПІБ, контактний телефон, місто та номер відділення пошти).
        </p>
      </LegalSection>

      <LegalSection title="4. ЦІНА ТОВАРУ ТА ПОРЯДОК ОПЛАТИ">
        <p>
          <strong>4.1.</strong> Ціни на Товари вказані на сайті в національній валюті України —
          гривні.
        </p>
        <p>
          <strong>4.2.</strong> Оплата здійснюється онлайн-оплатою (інтернет-еквайринг):
          безготівковий розрахунок банківською карткою безпосередньо на сайті при оформленні
          Замовлення (платіжний сервіс ПУМБ / Hutko).
        </p>
      </LegalSection>

      <LegalSection title="5. ДОСТАВКА ТОВАРУ">
        <p>
          <strong>5.1.</strong> Доставка Замовлень здійснюється на території України виключно за
          допомогою логістичної компанії «Нова Пошта».
        </p>
        <p>
          <strong>5.2.</strong> Вартість доставки формується компанією-перевізником виходячи з
          габаритів, ваги та місця призначення і оплачується Покупцем при отриманні Замовлення.
        </p>
        <p>
          <strong>5.3.</strong> Разом із Замовленням Покупцеві надаються передбачені чинним
          законодавством документи (товарний чек / електронна квитанція).
        </p>
      </LegalSection>

      <LegalSection title="6. ВІДПОВІДАЛЬНІСТЬ СТОРІН ТА ВИРІШЕННЯ СПОРІВ">
        <p>
          <strong>6.1.</strong> Продавець не несе відповідальності за шкоду, заподіяну Покупцеві
          внаслідок неналежного використання Товарів.
        </p>
        <p>
          <strong>6.2.</strong> Усі суперечки вирішуються шляхом переговорів. У разі недосягнення
          згоди — у судовому порядку згідно з чинним законодавством України.
        </p>
      </LegalSection>

      <LegalSection title="7. КОНФІДЕНЦІЙНІСТЬ ТА ЗАХИСТ ПЕРСОНАЛЬНИХ ДАНИХ">
        <p>
          <strong>7.1.</strong> Оформлюючи Замовлення, Покупець надає свою згоду на збір та обробку
          своїх персональних даних відповідно до Закону України «Про захист персональних даних».
        </p>
        <p>
          <strong>7.2.</strong> Інформація, яку надає Покупець, використовується виключно для
          обробки Замовлення, доставки Товару та інформування Покупця.
        </p>
      </LegalSection>

      <LegalSection title="8. РЕКВІЗИТИ ПРОДАВЦЯ">
        <div className="rounded-2xl bg-beige-100 p-4 space-y-1">
          <p><strong>ФОП:</strong> Шапошнікова Катерина Володимирівна</p>
          <p><strong>РНОКПП (ІПН):</strong> 3485300080</p>
          <p><strong>IBAN:</strong> UA583348510000000026007364862</p>
          <p><strong>Адреса:</strong> вул. Саксаганського 63/28, 01033, Київ</p>
          <p>
            <strong>Телефон:</strong>{' '}
            <a href="tel:+380671270967" className="text-gold underline-offset-2 hover:underline">
              +380 (67) 127 09 67
            </a>
          </p>
          <p>
            <strong>Email:</strong>{' '}
            <a href="mailto:kiddiechic.ua@gmail.com" className="text-gold underline-offset-2 hover:underline">
              kiddiechic.ua@gmail.com
            </a>
          </p>
          <p>
            <strong>Веб-сайт:</strong>{' '}
            <a href="https://kiddiechic.ua/" className="text-gold underline-offset-2 hover:underline">
              https://kiddiechic.ua/
            </a>
          </p>
        </div>
      </LegalSection>

    </LegalPageLayout>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-widest text-gold">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
