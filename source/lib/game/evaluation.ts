import { GOALS } from './config';
import { capital, debt, essential } from './finance';
import { defaultPlan } from './planning';
import type { DifficultyId, GameState, GoalId, Plan } from './types';
import { clamp, roundMoney } from './utils';

export function evaluate(
  state: GameState,
  goal: GoalId,
  plan?: Plan,
  month = 11,
  difficulty: DifficultyId = 'balance',
) {
  const goalSettings = GOALS[goal];
  const monthlyExpenses = essential(plan || defaultPlan(), month, difficulty);
  const goalProgress =
    clamp(capital(state) / goalSettings.target, 0, 1) *
    (goalSettings.skills ? Math.min(1, state.skills / goalSettings.skills) : 1);
  const liquidReserve = Math.max(
    0,
    state.cash +
      state.savings -
      debt(state) +
      state.pending.reduce((total, pending) => total + Math.min(0, pending.cash || 0), 0),
  );
  const reserveRatio = liquidReserve / (monthlyExpenses * 2);
  const hardcoreFinish =
    difficulty !== 'hardcore' ||
    (!state.hardcoreFailures?.length &&
      state.deficits === 0 &&
      state.education >= 65 &&
      state.energy >= 45 &&
      state.safety >= 8 &&
      debt(state) < 0.01 &&
      liquidReserve >= monthlyExpenses &&
      !state.pending.some((event) => (event.cash || 0) < 0));
  const parts = [
    {
      name: 'Достижение цели',
      value: Math.round(goalProgress * 35) * (hardcoreFinish ? 1 : 0),
      max: 35,
    },
    {
      name: 'Запас и обязательства',
      value: Math.round(clamp(reserveRatio, 0, 1) * 25 * Math.max(0, 1 - state.deficits * 0.12)),
      max: 25,
    },
    { name: 'Учёба', value: Math.round((state.education / 100) * 20), max: 20 },
    { name: 'Личный ресурс', value: Math.round((state.energy / 100) * 10), max: 10 },
    { name: 'Безопасность', value: Math.round(clamp(state.safety / 10, 0, 1) * 10), max: 10 },
  ];
  return {
    total: parts.reduce((a, x) => a + x.value, 0),
    parts,
    goalProgress: Math.round(goalProgress * 100),
    reserveMonths: roundMoney(liquidReserve / monthlyExpenses),
    achieved:
      goalProgress >= 1 &&
      state.education >= 60 &&
      state.energy >= 35 &&
      state.cash >= 0 &&
      hardcoreFinish,
  };
}
