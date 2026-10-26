import { SCENARIOS } from './situations/core';
import { NEW_SITUATIONS } from './situations/extended';
import { EXTRA_SITUATIONS } from './situations/legacy';
import type { Plan, Scenario } from './types';

/** Stable ids are stored with each plan so history and replays survive a new shuffle. */
export const SITUATION_IDS = [
  ...SCENARIOS.map((_, m) => `main-${m}`),
  ...Object.keys(EXTRA_SITUATIONS),
  ...Object.keys(NEW_SITUATIONS),
];

export function getScenario(id: string): Scenario | undefined {
  if (/^main-(?:[0-9]|1[01])$/.test(id)) return SCENARIOS[Number(id.slice(5))];
  if (Object.hasOwn(EXTRA_SITUATIONS, id)) return EXTRA_SITUATIONS[id].scenario;
  if (Object.hasOwn(NEW_SITUATIONS, id)) return NEW_SITUATIONS[id];
  return undefined;
}

export function planScenario(plan: Pick<Plan, 'scenario'>, month: number): Scenario {
  return (plan.scenario && getScenario(plan.scenario)) || SCENARIOS[month];
}

export function planSituationIds(plan: Plan, month: number): string[] {
  return [plan.scenario || `main-${month}`, ...(plan.extras || []).map((event) => event.scenario)];
}

export function extraSituationIds(month: number, seed: number, count: number = 1): string[] {
  const pair = [`${month}-0`, `${month}-1`];
  if (((seed >>> 0) ^ (Math.imul(month + 1, 2654435761) >>> 0)) & 1) pair.reverse();
  return pair.slice(0, Math.max(0, Math.min(2, count)));
}

export function selectedExtraOptions(plan: Plan, _month: number) {
  return (plan.extras || []).map((event) => {
    const scenario = getScenario(event.scenario);
    return {
      event,
      scenario,
      option: scenario?.options.find((option) => option.id === event.choice),
    };
  });
}
