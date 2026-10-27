export type PropKind =
  | 'laptop'
  | 'usedLaptop'
  | 'tools'
  | 'message'
  | 'campus'
  | 'search'
  | 'phone'
  | 'calendar'
  | 'gift'
  | 'list'
  | 'craft'
  | 'work'
  | 'books'
  | 'course'
  | 'code'
  | 'bank'
  | 'close'
  | 'washer'
  | 'team'
  | 'receipt'
  | 'portfolio'
  | 'rest'
  | 'chart'
  | 'shield'
  | 'coins'
  | 'exam'
  | 'handshake'
  | 'travel'
  | 'app'
  | 'bus'
  | 'car'
  | 'bike'
  | 'medicine'
  | 'food'
  | 'wifi'
  | 'shoe';

export type Story = {
  speaker?: string;
  responseSpeaker?: string;
  place: string;
  line: string;
  response: string[];
  props: PropKind[];
  sky: string;
  wall: string;
  floor: string;
  outdoor?: boolean;
};

export const STORY_SCENES: Story[] = [
  {
    place: 'Твоя комната',
    line: 'Завтра первый проект. Ноутбук опять завис… Купить другой или дать этому шанс?',
    response: [
      'Новый ноутбук в списке покупок.',
      'Проверим восстановленную модель.',
      'Несём старый ноутбук в сервис.',
    ],
    props: ['laptop', 'usedLaptop', 'tools'],
    sky: '#c5dfed',
    wall: '#e8e3d8',
    floor: '#b4c3bb',
  },
  {
    place: 'Студенческий кампус',
    line: 'В чате обещают лёгкий заработок. А в университете ищут помощников. Куда пойдём?',
    response: [
      'Доступ к вакансии выбран.',
      'Берём задачу в университете.',
      'Сначала проверим предложение.',
    ],
    props: ['message', 'campus', 'search'],
    sky: '#cddadf',
    wall: '#e5dfd4',
    floor: '#a6bbb2',
  },
  {
    place: 'Мастерская у дома',
    line: 'Один неловкий момент — и экран разбит. Без телефона никак. Как решим?',
    response: ['Ремонт оплачиваем сразу.', 'Разделим платёж на части.', 'Выбрали новый телефон.'],
    props: ['tools', 'calendar', 'phone'],
    sky: '#b8cbd8',
    wall: '#dbe3e7',
    floor: '#b9c6d3',
  },
  {
    place: 'Магазин подарков',
    line: 'Подарки всем, а бюджет один. Что положим под ёлку?',
    response: ['Берём большие подарки.', 'Покупаем по готовому списку.', 'Мастерим подарки сами.'],
    props: ['gift', 'list', 'craft'],
    sky: '#d5e7ed',
    wall: '#dce5e4',
    floor: '#c4c4b8',
    outdoor: true,
  },
  {
    place: 'Университетская библиотека',
    line: 'Сессия, смены и новый курс. На всё часов не хватит. Что важнее сейчас?',
    response: [
      'Добавили смены в расписание.',
      'Готовимся вместе с группой.',
      'Записались на практический курс.',
    ],
    props: ['work', 'books', 'course'],
    sky: '#d4e3e9',
    wall: '#ddd9d4',
    floor: '#aebcc2',
  },
  {
    place: 'Вечер дома',
    line: '«Срочно! Деньги в опасности!» Сообщение не даёт времени подумать. Что сделаем?',
    response: [
      'Выбрана передача кода.',
      'Откроем приложение самостоятельно.',
      'Закрываем сообщение.',
    ],
    props: ['code', 'app', 'close'],
    sky: '#7e8fae',
    wall: '#d9deec',
    floor: '#a3afc5',
  },
  {
    place: 'Общая кухня',
    line: 'Техника сломалась. Соседи собирают деньги на замену. Можно помочь иначе?',
    response: [
      'Оплачиваем взнос из бюджета.',
      'Организуем совместную закупку.',
      'Договариваемся о двух платежах.',
    ],
    props: ['washer', 'team', 'receipt'],
    sky: '#c7e0da',
    wall: '#dce8df',
    floor: '#a5bbb0',
  },
  {
    place: 'Центр студенческой практики',
    line: 'Есть практика и интенсив. Можно заработать, научиться или выдохнуть.',
    response: [
      'Берём оплачиваемую задачу.',
      'Выбрали профессиональный интенсив.',
      'Оставляем привычный график.',
    ],
    props: ['portfolio', 'course', 'rest'],
    sky: '#b9dce6',
    wall: '#dce6e1',
    floor: '#abc4bb',
  },
  {
    place: 'Городской парк',
    line: '«20% в месяц, без риска!» Друг зовёт в закрытый клуб. Как поступим?',
    response: [
      'Выбрали взнос в клуб.',
      'Разберёмся, откуда доходность.',
      'Продолжаем собственный план.',
    ],
    props: ['chart', 'search', 'shield'],
    sky: '#b6dce3',
    wall: '#cee0d4',
    floor: '#a6c7ad',
    outdoor: true,
  },
  {
    place: 'Последняя неделя семестра',
    line: 'Экзамены уже скоро. И как раз сейчас предлагают премию за смены.',
    response: [
      'Дополнительные смены выбраны.',
      'Оставили время на экзамены.',
      'Договорились о части задач.',
    ],
    props: ['coins', 'exam', 'handshake'],
    sky: '#bedfe9',
    wall: '#e5e4da',
    floor: '#b4c6bc',
  },
  {
    place: 'Городская набережная',
    line: 'Короткий проект, стажировка или поездка к близким?',
    response: [
      'Работаем над коротким проектом.',
      'Выбрали стажировку.',
      'Едем к близким восстанавливать силы.',
    ],
    props: ['laptop', 'portfolio', 'travel'],
    sky: '#aed9e5',
    wall: '#d9e6d8',
    floor: '#c7c4a6',
    outdoor: true,
  },
  {
    place: 'Планы в своей комнате',
    line: 'Каким будет следующий шаг: запас, обучение или небольшая поездка?',
    response: [
      'Сохраняем финансовый запас.',
      'Продолжаем обучение.',
      'Планируем небольшое путешествие.',
    ],
    props: ['bank', 'course', 'travel'],
    sky: '#c6deea',
    wall: '#e6dfd3',
    floor: '#c3c5b3',
  },
];
