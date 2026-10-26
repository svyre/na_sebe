// Воспроизводимое расписание: 1–3 ситуации в месяц, без повторений за год.

import { SITUATION_IDS, getScenario, planSituationIds } from './situations';
import type { Plan } from './types';

export function randomSource(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function createStorySchedule(seed: number, completed: Plan[] = []): string[][] {
  const random = randomSource(seed);
  const completedMonths = completed.slice(0, 12).map(planSituationIds);
  const usedIds = new Set(completedMonths.flat());
  const availableIds = SITUATION_IDS.filter((id) => !usedIds.has(id));
  for (let i = availableIds.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [availableIds[i], availableIds[j]] = [availableIds[j], availableIds[i]];
  }
  const schedule = [...completedMonths];
  let offset = 0;
  for (let month = completedMonths.length; month < 12; month++) {
    const count = 1 + Math.floor(random() * 3);
    schedule.push(availableIds.slice(offset, offset + count));
    offset += count;
  }
  return schedule;
}

export function ensureStorySchedule(game: {
  storySeed?: number;
  storySchedule?: string[][];
  plans: Plan[];
}): string[][] {
  const schedule = game.storySchedule;
  const completedMonths = game.plans.slice(0, 12).map(planSituationIds);
  if (
    Array.isArray(schedule) &&
    schedule.length === 12 &&
    schedule.every(
      (ids, monthIndex) =>
        Array.isArray(ids) &&
        ids.length >= 1 &&
        ids.length <= 3 &&
        ids.every((id) => typeof id === 'string' && !!getScenario(id)) &&
        (monthIndex >= completedMonths.length ||
          JSON.stringify(ids) === JSON.stringify(completedMonths[monthIndex])),
    ) &&
    new Set(schedule.flat()).size === schedule.flat().length
  )
    return schedule;
  return createStorySchedule(game.storySeed ?? 42, game.plans);
}
