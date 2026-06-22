// Static fallback for GH Pages demo, where /api/np/* route handlers don't exist.
// Top-20 Ukrainian cities by population — covers most real orders.
export const TOP_UA_CITIES: { ref: string; name: string; area: string }[] = [
  { ref: 'kyiv',        name: 'Київ',         area: 'Київська' },
  { ref: 'kharkiv',     name: 'Харків',       area: 'Харківська' },
  { ref: 'odesa',       name: 'Одеса',        area: 'Одеська' },
  { ref: 'dnipro',      name: 'Дніпро',       area: 'Дніпропетровська' },
  { ref: 'lviv',        name: 'Львів',        area: 'Львівська' },
  { ref: 'zaporizhzhia',name: 'Запоріжжя',    area: 'Запорізька' },
  { ref: 'kryvyirih',   name: 'Кривий Ріг',   area: 'Дніпропетровська' },
  { ref: 'mykolaiv',    name: 'Миколаїв',     area: 'Миколаївська' },
  { ref: 'vinnytsia',   name: 'Вінниця',      area: 'Вінницька' },
  { ref: 'poltava',     name: 'Полтава',      area: 'Полтавська' },
  { ref: 'chernihiv',   name: 'Чернігів',     area: 'Чернігівська' },
  { ref: 'cherkasy',    name: 'Черкаси',      area: 'Черкаська' },
  { ref: 'sumy',        name: 'Суми',         area: 'Сумська' },
  { ref: 'zhytomyr',    name: 'Житомир',      area: 'Житомирська' },
  { ref: 'rivne',       name: 'Рівне',        area: 'Рівненська' },
  { ref: 'ivano',       name: 'Івано-Франківськ', area: 'Івано-Франківська' },
  { ref: 'ternopil',    name: 'Тернопіль',    area: 'Тернопільська' },
  { ref: 'lutsk',       name: 'Луцьк',        area: 'Волинська' },
  { ref: 'uzhhorod',    name: 'Ужгород',      area: 'Закарпатська' },
  { ref: 'chernivtsi',  name: 'Чернівці',     area: 'Чернівецька' },
];

// Realistic branch placeholders per city. For real orders we use the live API.
export function fallbackBranches(cityName: string): { ref: string; number: string; description: string }[] {
  return [1, 2, 3, 5, 8, 12, 27].map((n) => ({
    ref: `${cityName}-${n}`,
    number: String(n),
    description: `Відділення №${n} (демо)`,
  }));
}
