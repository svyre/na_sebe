import { MONTHS, initialState } from './config';
import { validatePlan } from './planning';
import { settle } from './settlement';
import type { DifficultyId, GoalId, Report } from './types';
import { clone } from './utils';

export function replay(
  reports: Report[],
  changedMonth: number,
  choice: string,
  goal: GoalId,
  difficulty: DifficultyId = 'balance',
) {
  let state = initialState(difficulty);
  const result: Report[] = [];
  let trimmedTransfers = 0;
  for (let monthIndex = 0; monthIndex < reports.length; monthIndex++) {
    const plan = clone(reports[monthIndex].plan);
    if (monthIndex === changedMonth) plan.choice = choice;
    const oldWithdraw = plan.withdraw;
    const oldSell = plan.sell;
    plan.withdraw = Math.min(plan.withdraw, Math.floor(state.savings));
    plan.sell = Math.min(plan.sell, Math.floor(state.fund));
    trimmedTransfers += oldWithdraw - plan.withdraw + oldSell - plan.sell;
    const validationError = validatePlan(plan, state, monthIndex, false, difficulty);
    if (validationError) throw new Error(MONTHS[monthIndex] + ': ' + validationError);
    try {
      const report = settle(state, plan, monthIndex, goal, true, difficulty);
      state = report.after;
      result.push(report);
    } catch (e) {
      if (!(e instanceof Error) || !e.message.startsWith('На переводы')) throw e;
      const requested = plan.save + plan.invest;
      plan.save = 0;
      plan.invest = 0;
      const baselineReport = settle(state, plan, monthIndex, goal, true, difficulty);
      const availableCash = Math.max(0, Math.floor(baselineReport.after.cash));
      plan.save = Math.min(reports[monthIndex].plan.save, availableCash);
      plan.invest = Math.min(
        reports[monthIndex].plan.invest,
        Math.max(0, availableCash - plan.save),
      );
      trimmedTransfers += requested - plan.save - plan.invest;
      const report = settle(state, plan, monthIndex, goal, true, difficulty);
      state = report.after;
      result.push(report);
    }
  }
  return { state, reports: result, trimmed: trimmedTransfers };
}
