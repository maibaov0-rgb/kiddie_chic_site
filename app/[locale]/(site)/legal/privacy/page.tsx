import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import LegalPageLayout from '@/components/features/layout/LegalPageLayout';

type Params = { locale: string };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Політика конфіденційності — Kiddie Chic',
    description: 'Політика конфіденційності та захисту персональних даних інтернет-магазину Kiddie Chic.',
  };
}

export default async function PrivacyPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalPageLayout title="Політика конфіденційності">

      <p className="text-foreground/70">
        Ця Політика визначає порядок збору, використання, зберігання та розкриття персональних даних
        користувачів веб-сайту{' '}
        <a href="https://kiddiechic.ua/" className="text-gold underline-offset-2 hover:underline">
          https://kiddiechic.ua/
        </a>
        . Використовуючи Сайт або оформлюючи замовлення, Користувач повністю погоджується з умовами
        цієї Політики.
      </p>

      <PrivacySection title="1. ЗАГАЛЬНІ ПОЛОЖЕННЯ">
        <p>
          <strong>1.1.</strong> Власником та розпорядником персональних даних є Фізична
          особа-підприємець Шапошнікова Катерина Володимирівна.
        </p>
        <p>
          <strong>1.2.</strong> Обробка персональних даних здійснюється відповідно до Закону України
          «Про захист персональних даних» та інших законодавчих актів України.
        </p>
        <p>
          <strong>1.3.</strong> Ця Політика застосовується лише до цього Сайту. Інтернет-магазин не
          несе відповідальності за сайти третіх осіб, на які Користувач може перейти за посиланнями.
        </p>
      </PrivacySection>

      <PrivacySection title="2. ЯКІ ДАНІ МИ ЗБИРАЄМО">
        <p>
          <strong>2.1.</strong> Ми збираємо та обробляємо лише ті дані, які Користувач свідомо та
          добровільно надає для оформлення замовлення:
        </p>
        <ul className="ml-4 mt-2 list-disc space-y-2">
          <li>Прізвище, ім&apos;я та по батькові;</li>
          <li>Контактний номер телефону;</li>
          <li>Адреса електронної пошти (e-mail);</li>
          <li>Місто та номер відділення/поштомату «Нової Пошти» для доставки.</li>
        </ul>
        <p>
          <strong>2.2.</strong> Сайт також може автоматично збирати неособисту інформацію (IP-адреса,
          дані про браузер, файли cookie, час перебування на сайті) для аналітики та покращення
          роботи Інтернет-магазину.
        </p>
      </PrivacySection>

      <PrivacySection title="3. МЕТА ЗБОРУ ТА ОБРОБКИ ДАНИХ">
        <p>
          <strong>3.1.</strong> Персональні дані використовуються виключно з метою:
        </p>
        <ul className="ml-4 mt-2 list-disc space-y-2">
          <li>Оформлення, обробки та підтвердження замовлень;</li>
          <li>Здійснення доставки замовлених товарів;</li>
          <li>Обробки платежів (через сервіс ПУМБ / Hutko);</li>
          <li>Надання клієнтської підтримки та зворотного зв&apos;язку;</li>
          <li>Інформування про статус замовлення.</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="4. ПЕРЕДАЧА ДАНИХ ТРЕТІМ ОСОБАМ">
        <p>
          <strong>4.1.</strong> Ми не продаємо, не обмінюємо та не передаємо персональні дані
          Користувачів стороннім особам, за винятком випадків, необхідних для виконання замовлення.
        </p>
        <p>
          <strong>4.2.</strong> Для виконання зобов&apos;язань перед Покупцем Продавець передає
          необхідні дані (ПІБ, телефон, місто та номер відділення) компанії «Нова Пошта».
        </p>
        <p>
          <strong>4.3.</strong> При онлайн-оплаті дані банківської картки Користувача обробляються
          виключно на захищеній стороні платіжної системи ПУМБ / Hutko і не зберігаються на серверах
          Інтернет-магазину.
        </p>
      </PrivacySection>

      <PrivacySection title="5. ВИКОРИСТАННЯ ФАЙЛІВ COOKIE">
        <p>
          <strong>5.1.</strong> Наш Сайт використовує файли cookie — невеликі текстові файли, які
          зберігаються на пристрої Користувача. Вони допомагають зберігати вміст «Кошика»,
          аналізувати відвідуваність та робити взаємодію з Сайтом зручнішою.
        </p>
        <p>
          <strong>5.2.</strong> Користувач може налаштувати свій браузер таким чином, щоб
          відхиляти файли cookie, однак це може вплинути на коректну роботу деяких функцій Сайту.
        </p>
      </PrivacySection>

      <PrivacySection title="6. ЗАХИСТ ІНФОРМАЦІЇ">
        <p>
          <strong>6.1.</strong> Ми вживаємо необхідних технічних та організаційних заходів безпеки
          для захисту персональних даних Користувача від несанкціонованого доступу, зміни, розкриття
          чи знищення.
        </p>
      </PrivacySection>

      <PrivacySection title="7. ПРАВА КОРИСТУВАЧА">
        <p>
          <strong>7.1.</strong> Відповідно до статті 8 Закону України «Про захист персональних
          даних», Користувач має право:
        </p>
        <ul className="ml-4 mt-2 list-disc space-y-2">
          <li>Знати про джерела збору та мету обробки своїх персональних даних;</li>
          <li>Отримувати доступ до своїх персональних даних;</li>
          <li>Вимагати зміни, оновлення або видалення своїх персональних даних;</li>
          <li>Відкликати згоду на обробку персональних даних.</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="8. ЗМІНИ ДО ПОЛІТИКИ КОНФІДЕНЦІЙНОСТІ">
        <p>
          <strong>8.1.</strong> Інтернет-магазин залишає за собою право вносити зміни до цієї
          Політики. Оновлена версія набуває чинності з моменту її публікації на Сайті.
        </p>
        <p>
          <strong>8.2.</strong> Рекомендуємо Користувачам періодично переглядати цю сторінку для
          ознайомлення з актуальними умовами.
        </p>
      </PrivacySection>

      <PrivacySection title="9. КОНТАКТНА ІНФОРМАЦІЯ">
        <p>У разі виникнення питань або для відкликання згоди на обробку даних, зверніться до нас:</p>
        <div className="mt-3 rounded-2xl bg-beige-100 p-4 space-y-1">
          <p><strong>ФОП:</strong> Шапошнікова Катерина Володимирівна</p>
          <p><strong>РНОКПП (ІПН):</strong> 3485300080</p>
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
            <strong>Сайт:</strong>{' '}
            <a href="https://kiddiechic.ua/" className="text-gold underline-offset-2 hover:underline">
              https://kiddiechic.ua/
            </a>
          </p>
        </div>
      </PrivacySection>

    </LegalPageLayout>
  );
}

function PrivacySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-widest text-gold">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
