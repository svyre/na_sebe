import type { DifficultyId, GameState, GoalId } from './types';
import { clone, percent } from './utils';

export const MONTHS = [
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
];

export const SHORT_MONTHS = [
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
];

export const DIFFICULTIES: Record<
  DifficultyId,
  {
    name: string;
    label: string;
    description: string;
    cash: number;
    savings: number;
    support: number;
    hours: number;
    marketFactor: number;
    inflationFactor: number;
  }
> = {
  first: {
    name: 'Первый шаг',
    label: 'Легче',
    description: 'Больше запаса для экспериментов и спокойного знакомства с бюджетом.',
    cash: 36000,
    savings: 18000,
    support: 21000,
    hours: 144,
    marketFactor: 0.75,
    inflationFactor: 0.75,
  },
  balance: {
    name: 'Баланс',
    label: 'Средне',
    description: 'Самостоятельный год, в котором нужно совместить деньги, учёбу и отдых.',
    cash: 26000,
    savings: 12000,
    support: 18000,
    hours: 128,
    marketFactor: 1,
    inflationFactor: 1,
  },
  challenge: {
    name: 'Вызов',
    label: 'Сложнее',
    description: 'Меньше поддержки и времени. Резерв и точный расчёт решают больше.',
    cash: 18000,
    savings: 6000,
    support: 14000,
    hours: 112,
    marketFactor: 1.5,
    inflationFactor: 1.5,
  },
};

export const difficultyId = (value: unknown): DifficultyId =>
  typeof value === 'string' && Object.hasOwn(DIFFICULTIES, value)
    ? (value as DifficultyId)
    : 'balance';

export const GOALS: Record<
  GoalId,
  { name: string; description: string; target: number; skills: number }
> = {
  capital: {
    name: 'Первый капитал',
    description: '100 000 ₽ капитала и устойчивый бюджет к концу года.',
    target: 100000,
    skills: 0,
  },
  career: {
    name: 'Сильный старт',
    description: '70 000 ₽ капитала и 4 профессиональных навыка.',
    target: 70000,
    skills: 4,
  },
  freedom: {
    name: 'Большая цель',
    description: '140 000 ₽ капитала. Амбициозно, но с заботой о себе.',
    target: 140000,
    skills: 0,
  },
};

export const HOUSING = [
  {
    id: 'dorm',
    name: 'Общежитие',
    cost: 6500,
    transport: 1500,
    hours: 18,
    description: 'Дешевле жить, дольше добираться',
  },
  {
    id: 'shared',
    name: 'Квартира с друзьями',
    cost: 11500,
    transport: 1000,
    hours: 10,
    description: 'Делишь расходы и пространство',
  },
  {
    id: 'alone',
    name: 'Своя студия',
    cost: 19000,
    transport: 700,
    hours: 4,
    description: 'Больше комфорта и времени',
  },
];

export const JOBS = [
  { id: 'none', name: 'Сосредоточиться на учёбе', income: 0, hours: 0, fatigue: 0, education: 1 },
  { id: 'flex', name: 'Гибкая подработка', income: 8500, hours: 28, fatigue: 12, education: 0 },
  {
    id: 'part',
    name: 'Неполный рабочий день',
    income: 14500,
    hours: 52,
    fatigue: 20,
    education: -2,
  },
  {
    id: 'intense',
    name: 'Плотный рабочий график',
    income: 23000,
    hours: 84,
    fatigue: 31,
    education: -7,
  },
];

export const STUDIES = [
  { hours: 16, name: 'Минимум', gain: -2 },
  { hours: 32, name: 'В балансе', gain: 2 },
  { hours: 48, name: 'Вглубь', gain: 5 },
];

export const OFFERS = [
  { id: 'clear', name: 'Понятный', rate: 24, term: 6, fee: 0, monthlyFee: 0, tag: '6 месяцев' },
  {
    id: 'comfort',
    name: 'Комфорт',
    rate: 18,
    term: 12,
    fee: 1900,
    monthlyFee: 390,
    tag: 'Низкая ставка',
  },
  {
    id: 'zero',
    name: 'Без процентов',
    rate: 0,
    term: 4,
    fee: 1800,
    monthlyFee: 0,
    tag: '0% годовых',
  },
];

export const MACRO = [
  {
    inflation: 1,
    savingsRate: 8,
    market: -2,
    title: 'Новый город, новые возможности',
    text: 'Осваивайся и оставь место для неожиданностей.',
  },
  {
    inflation: 1,
    savingsRate: 8,
    market: 3,
    title: 'Сезон подработок',
    text: 'Смотри на договор, а не только на обещанный доход.',
  },
  {
    inflation: 1.02,
    savingsRate: 9,
    market: -8,
    title: 'Расходы выросли на 2%',
    text: 'Рынок нестабилен. Прошлый рост не гарантирует будущий.',
  },
  {
    inflation: 1.02,
    savingsRate: 9,
    market: 4,
    title: 'Праздничный сезон',
    text: 'Заранее выбери сумму, которую готов потратить.',
  },
  {
    inflation: 1.03,
    savingsRate: 10,
    market: 1,
    title: 'Первая сессия',
    text: 'Стипендия зависит от учёбы в начале месяца.',
  },
  {
    inflation: 1.03,
    savingsRate: 10,
    market: -3,
    title: 'Месяц цифровой безопасности',
    text: 'Независимая проверка важнее срочности сообщения.',
  },
  {
    inflation: 1.05,
    savingsRate: 9,
    market: 6,
    title: 'Весенний пересмотр бюджета',
    text: 'Базовые цены на 5% выше, чем в сентябре.',
  },
  {
    inflation: 1.05,
    savingsRate: 9,
    market: -4,
    title: 'Начало практики',
    text: 'Навыки сегодня — возможности завтра.',
  },
  {
    inflation: 1.05,
    savingsRate: 8,
    market: 2,
    title: 'Предложения повсюду',
    text: 'Проверяй источник доходности и риски.',
  },
  {
    inflation: 1.06,
    savingsRate: 8,
    market: 5,
    title: 'Экзамены и возможности',
    text: 'Базовые цены на 6% выше сентябрьских.',
  },
  {
    inflation: 1.06,
    savingsRate: 7,
    market: -2,
    title: 'Летний ритм',
    text: 'Сверь финансовый план со своим ресурсом.',
  },
  {
    inflation: 1.06,
    savingsRate: 7,
    market: 3,
    title: 'Время подвести итоги',
    text: 'Оцени капитал, устойчивость и качество решений.',
  },
];

export const INITIAL: GameState = {
  cash: 26000,
  savings: 12000,
  fund: 0,
  education: 72,
  energy: 78,
  skills: 0,
  safety: 5,
  loans: [],
  pending: [],
  deficits: 0,
};

export function initialState(difficulty: DifficultyId = 'balance'): GameState {
  const settings = DIFFICULTIES[difficultyId(difficulty)];
  return { ...clone(INITIAL), cash: settings.cash, savings: settings.savings };
}

export function macroFor(month: number, difficulty: DifficultyId = 'balance') {
  const baseMonth = MACRO[Math.min(11, Math.max(0, month))];
  const settings = DIFFICULTIES[difficultyId(difficulty)];
  const inflation =
    1 + Math.round((baseMonth.inflation - 1) * settings.inflationFactor * 10000) / 10000;
  return {
    ...baseMonth,
    inflation,
    market: Math.round(baseMonth.market * settings.marketFactor * 100) / 100,
    title: baseMonth.title.startsWith('Расходы выросли')
      ? `Расходы выросли на ${percent((inflation - 1) * 100)}`
      : baseMonth.title,
    text: baseMonth.text.replace(
      /Базовые цены на \d+%/,
      `Базовые цены на ${percent((inflation - 1) * 100)}`,
    ),
  };
}
