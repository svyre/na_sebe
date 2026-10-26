export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const rubleFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

export const rub = (value: number) => rubleFormatter.format(Math.round(value)) + ' ₽';

export const percent = (value: number) => percentFormatter.format(value) + '%';

export const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const clamp = (value: number, minimum = 0, maximum = 100) =>
  Math.min(maximum, Math.max(minimum, value));
