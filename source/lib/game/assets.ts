import { HOUSING, macroFor } from './config';
import { skillsForWork } from './development';
import { roundMoney } from './utils';
import type { DifficultyId, GameState, Ledger, Plan, ProjectAction } from './types';

export const CARS = {
  compact: {
    name: 'Подержанный хэтчбек',
    cost: 220000,
    value: 200000,
    monthly: 4500,
    hoursSaved: 8,
  },
  family: { name: 'Универсал', cost: 340000, value: 310000, monthly: 6500, hoursSaved: 10 },
} as const;
export const PROJECTS: Record<
  ProjectAction,
  { name: string; cost: number; hours: number; energy: number }
> = {
  none: { name: 'Без изменений', cost: 0, hours: 0, energy: 0 },
  pilot: { name: 'Проверить идею', cost: 6000, hours: 12, energy: 4 },
  launch: { name: 'Запустить своё дело', cost: 40000, hours: 24, energy: 8 },
  expand: { name: 'Расширить дело', cost: 60000, hours: 20, energy: 7 },
  pause: { name: 'Приостановить работу', cost: 0, hours: 2, energy: 0 },
  resume: { name: 'Вернуться к работе', cost: 0, hours: 4, energy: 2 },
  close: { name: 'Закрыть дело', cost: 0, hours: 4, energy: 2 },
};
export const businessValue = (state: GameState) =>
  state.business ? (state.business.level === 1 ? 24000 : 54000) : 0;
export const depositValue = (state: GameState) =>
  (state.deposits || []).reduce((sum, deposit) => sum + deposit.value, 0);
export const assetValue = (state: GameState) =>
  (state.car?.value || 0) + businessValue(state) + depositValue(state);

export function businessMonth(state: GameState, month: number, difficulty: DifficultyId) {
  if (!state.business) return { revenue: 0, cost: 0, hours: 0, energy: 0 };
  if (state.business.paused) return { revenue: 0, cost: 1000, hours: 0, energy: 0 };
  const demand = [1.05, 1.15, 1, 1.35, 0.65, 0.9, 1.1, 1.2, 1, 0.7, 0.55, 0.8][month % 12];
  const large = state.business.level === 2;
  const revenue = Math.round(
    ((large ? 25000 : 13000) + skillsForWork(state, month) * (large ? 600 : 350)) * demand,
  );
  const cost = Math.round((large ? 14000 : 7000) * macroFor(month, difficulty).inflation);
  return { revenue, cost, hours: large ? 20 : 12, energy: large ? 9 : 6 };
}
export function transportHours(plan: Plan, state?: GameState) {
  const housing = HOUSING.find((item) => item.id === plan.housing) || HOUSING[0];
  return Math.max(0, housing.hours - (state?.car ? CARS[state.car.model].hoursSaved : 0));
}
export function transportCost(
  state: GameState,
  plan: Plan,
  month: number,
  difficulty: DifficultyId,
) {
  const amount = state.car
    ? CARS[state.car.model].monthly
    : (HOUSING.find((item) => item.id === plan.housing) || HOUSING[0]).transport;
  return Math.round(amount * macroFor(month, difficulty).inflation);
}
export const carPlanHours = (plan: Plan) =>
  plan.carAction === 'sell'
    ? 4
    : plan.carAction === 'compact' || plan.carAction === 'family'
      ? 6
      : 0;

export function projectError(plan: Plan, state: GameState, month: number): string | null {
  const action = plan.project || 'none',
    car = plan.carAction || 'keep',
    deposit = plan.termDeposit || 0;
  if (!Object.hasOwn(PROJECTS, action)) return 'Выбери действие для своего дела.';
  if (!['keep', 'compact', 'family', 'sell'].includes(car)) return 'Проверь выбор машины.';
  if (
    !Number.isInteger(plan.termDeposit ?? 0) ||
    deposit < 0 ||
    deposit > 1000000 ||
    (deposit > 0 && (deposit < 10000 || deposit % 1000 !== 0))
  )
    return 'Вклад: от 10 000 ₽, сумма кратна 1 000 ₽. Для отмены укажи 0.';
  if (month < 12 && (action !== 'none' || car !== 'keep' || deposit > 0))
    return 'Проекты, машина и срочный вклад доступны со второго года.';
  if (action === 'pilot' && state.pilotDone)
    return 'Идея уже проверена. Можно переходить к запуску.';
  if (
    action === 'launch' &&
    (!state.pilotDone || skillsForWork(state, month) < 3 || state.business)
  )
    return 'Для запуска нужны проверенная идея, 3 навыка и отсутствие другого дела.';
  if (
    action === 'expand' &&
    (!state.business || state.business.level !== 1 || state.business.paused)
  )
    return 'Расширить можно только работающее дело первого уровня.';
  if (action === 'pause' && (!state.business || state.business.paused))
    return 'Приостановить можно только работающее дело.';
  if (action === 'resume' && !state.business?.paused) return 'Дело не находится на паузе.';
  if (action === 'close' && !state.business) return 'Пока нет дела для закрытия.';
  if (car === 'sell' && !state.car) return 'Сначала нужно купить машину.';
  if ((car === 'compact' || car === 'family') && state.car)
    return 'Сначала продай нынешнюю машину. Новую можно купить в следующем месяце.';
  return null;
}

type RecordTransaction = (label: string, amount: number, kind?: Ledger['kind']) => void;
export function accrueAssets(
  input: GameState,
  state: GameState,
  month: number,
  record: RecordTransaction,
) {
  let depositInterest = 0;
  if (input.deposits?.length) {
    state.deposits = [];
    for (const deposit of input.deposits) {
      const interest = roundMoney((deposit.value * deposit.rate) / 1200);
      const value = roundMoney(deposit.value + interest);
      depositInterest += interest;
      if (deposit.due <= month) record('Срочный вклад: возврат с процентами', value, 'transfer');
      else state.deposits.push({ ...deposit, value });
    }
  }
  const depreciation = input.car ? roundMoney(input.car.value * 0.01) : 0;
  if (state.car) state.car.value = roundMoney(state.car.value - depreciation);
  return { depreciation, depositInterest: roundMoney(depositInterest) };
}
export function applyProjects(
  input: GameState,
  state: GameState,
  plan: Plan,
  month: number,
  record: RecordTransaction,
) {
  const project = PROJECTS[plan.project || 'none'];
  const car =
    plan.carAction === 'compact' || plan.carAction === 'family' ? CARS[plan.carAction] : undefined;
  // Продажи закрываются в конце месяца: текущие расходы и часы уже учтены.
  if (plan.carAction === 'sell' && state.car) {
    record('Продажа машины', state.car.value, 'transfer');
    delete state.car;
  }
  if (plan.project === 'close') {
    record('Продажа оборудования своего дела', businessValue(input), 'transfer');
    delete state.business;
  }
  const required = project.cost + (car?.cost || 0) + (plan.termDeposit || 0);
  if (required > Math.max(0, state.cash) + 0.01)
    throw new Error(
      'На проекты не хватает денег. Сними часть накоплений, продай долю фонда или уменьши покупки.',
    );
  if (project.cost) record(project.name, -project.cost);
  if (plan.project === 'pilot') state.pilotDone = true;
  if (plan.project === 'launch') state.business = { level: 1, paused: false, opened: month };
  if (plan.project === 'expand' && state.business) state.business.level = 2;
  if ((plan.project === 'pause' || plan.project === 'resume') && state.business)
    state.business.paused = plan.project === 'pause';
  if (car && (plan.carAction === 'compact' || plan.carAction === 'family')) {
    record('Покупка: ' + car.name, -car.cost);
    state.car = { model: plan.carAction, value: car.value, bought: month };
  }
  if (plan.termDeposit) {
    record('На срочный вклад', -plan.termDeposit, 'transfer');
    state.deposits = [
      ...(state.deposits || []),
      { principal: plan.termDeposit, value: plan.termDeposit, due: month + 6, rate: 14 },
    ];
  }
}
