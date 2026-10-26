import type { DevelopmentId, GameState, Plan } from './types';

export const DEVELOPMENT: Record<
  DevelopmentId,
  { name: string; cost: number; hours: number; income: number; energy: number; result: string }
> = {
  none: {
    name: 'Без занятий',
    cost: 0,
    hours: 0,
    income: 0,
    energy: 0,
    result: 'Оставить время для других планов',
  },
  self: {
    name: 'Самостоятельное обучение',
    cost: 0,
    hours: 16,
    income: 0,
    energy: 3,
    result: '+1 навык после двух месяцев занятий. Перерыв сохраняет прогресс.',
  },
  course: {
    name: 'Практический курс',
    cost: 5000,
    hours: 20,
    income: 0,
    energy: 5,
    result: '+1 навык в начале следующего месяца',
  },
  internship: {
    name: 'Стажировка',
    cost: 0,
    hours: 24,
    income: 2000,
    energy: 10,
    result: '+1 навык к концу месяца и 2 000 ₽ за практику',
  },
};

export function developmentFor(plan: Pick<Plan, 'development'>) {
  return DEVELOPMENT[plan.development ?? 'none'];
}

export function skillsForWork(state: GameState, month: number) {
  return (
    state.skills +
    state.pending.reduce((sum, event) => sum + (event.due <= month ? event.skills || 0 : 0), 0)
  );
}
