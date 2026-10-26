import { HOUSING, JOBS, OFFERS, STUDIES, monthRules } from './config';
import { DEVELOPMENT, developmentFor } from './development';
import { debt } from './finance';
import { ROOM_ITEMS, roomGifts, roomInventory } from './furniture';
import { getScenario, planScenario, selectedExtraOptions } from './situations';
import { SCENARIOS } from './situations/core';
import { EXTRA_SITUATIONS } from './situations/legacy';
import type { DifficultyId, GameState, Plan } from './types';

export function defaultPlan(month = 0): Plan {
  return {
    housing: 'dorm',
    job: 'flex',
    study: 32,
    leisure: 2500,
    save: 0,
    withdraw: 0,
    invest: 0,
    sell: 0,
    borrow: 0,
    offer: 'clear',
    choice: SCENARIOS[month]?.options[SCENARIOS[month].options.length - 1].id || 'keep',
  };
}

export function planHours(plan: Plan, month: number) {
  return (
    (HOUSING.find((x) => x.id === plan.housing)?.hours || 0) +
    (JOBS.find((x) => x.id === plan.job)?.hours || 0) +
    plan.study +
    (planScenario(plan, month).options.find((x) => x.id === plan.choice)?.hours || 0) +
    selectedExtraOptions(plan, month).reduce((sum, x) => sum + (x.option?.hours || 0), 0) +
    (plan.roomBuy || []).reduce((sum, id) => sum + (ROOM_ITEMS[id]?.hours || 0), 0) +
    (developmentFor(plan)?.hours || 0)
  );
}

export function validatePlan(
  plan: Plan,
  state: GameState,
  month: number,
  allowEmptyChoice = false,
  difficulty: DifficultyId = 'balance',
): string | null {
  if (!plan || !Number.isInteger(month) || month < 0 || month > 11)
    return 'Этот раунд уже завершён.';
  if (
    !HOUSING.some((x) => x.id === plan.housing) ||
    !JOBS.some((x) => x.id === plan.job) ||
    !STUDIES.some((x) => x.hours === plan.study) ||
    !OFFERS.some((x) => x.id === plan.offer)
  )
    return 'Выбери все параметры плана.';
  if (plan.scenario && !getScenario(plan.scenario)) return 'Неизвестная первая ситуация месяца.';
  if (
    !planScenario(plan, month).options.some((x) => x.id === plan.choice) &&
    !(allowEmptyChoice && plan.choice === '')
  )
    return 'Выбери решение для события месяца.';
  if (plan.extras !== undefined) {
    if (
      !Array.isArray(plan.extras) ||
      plan.extras.length > 2 ||
      new Set([plan.scenario || `main-${month}`, ...plan.extras.map((x) => x?.scenario)]).size !==
        plan.extras.length + 1
    )
      return 'Проверь список ситуаций месяца.';
    for (const event of plan.extras) {
      const scenario = event && getScenario(event.scenario);
      if (!scenario) return 'Неизвестная ситуация в плане.';
      if (!plan.scenario && EXTRA_SITUATIONS[event.scenario]?.month !== month)
        return 'Эта ситуация не относится к текущему месяцу.';
      if (
        !scenario.options.some((o) => o.id === event.choice) &&
        !(allowEmptyChoice && event.choice === '')
      )
        return 'Выбери решение для каждой ситуации месяца.';
    }
  }
  if (plan.roomVersion !== undefined && plan.roomVersion !== 1)
    return 'Неизвестная версия комнаты.';
  if (
    plan.development !== undefined &&
    (typeof plan.development !== 'string' || !Object.hasOwn(DEVELOPMENT, plan.development))
  )
    return 'Выбери одно действие в разделе «Развитие».';
  if (plan.roomBuy !== undefined) {
    if (
      !Array.isArray(plan.roomBuy) ||
      plan.roomBuy.length > 6 ||
      new Set(plan.roomBuy).size !== plan.roomBuy.length ||
      plan.roomBuy.some((id) => typeof id !== 'string' || !Object.hasOwn(ROOM_ITEMS, id))
    )
      return 'Проверь список покупок для комнаты.';
    if (plan.roomBuy.some((id) => roomInventory(state).includes(id)))
      return 'Такое улучшение уже есть в комнате.';
    if (plan.roomBuy.some((id) => roomGifts(plan, month).includes(id)))
      return 'Это улучшение появится из ситуации. Убери повторную покупку в комнате.';
  }
  for (const key of ['leisure', 'save', 'withdraw', 'invest', 'sell', 'borrow'] as const)
    if (
      !Number.isFinite(plan[key]) ||
      plan[key] < 0 ||
      plan[key] > 1000000 ||
      !Number.isInteger(plan[key])
    )
      return 'Суммы должны быть целыми неотрицательными числами.';
  if (plan.leisure > 15000) return 'На отдых можно запланировать до 15 000 ₽.';
  if (plan.withdraw > Math.floor(state.savings))
    return 'На накопительном счёте недостаточно денег для снятия.';
  if (plan.sell > Math.floor(state.fund)) return 'Нельзя продать больше текущей стоимости фонда.';
  if (plan.borrow > 40000 || debt(state) + plan.borrow > 90000)
    return 'Лимит нового кредита — 40 000 ₽, всех кредитов — 90 000 ₽.';
  const availableHours = monthRules(difficulty, month).hours;
  if (planHours(plan, month) > availableHours)
    return `Плану не хватает времени. Уменьши нагрузку: доступно ${availableHours} часов.`;
  return null;
}
