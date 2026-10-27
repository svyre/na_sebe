// Воспроизводимое расписание: 1–3 ситуации в месяц, без повторений за прохождение.

import { SITUATION_IDS, getScenario, planSituationIds } from './situations';
import { campaignMonths } from './campaign';
import { CAMPAIGN_STORIES, campaignStoryAvailable } from './situations/campaign';
import type { GameState, Plan } from './types';

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
  state?: GameState;
  month?: number;
}): string[][] {
  if (campaignMonths(game.state) > 12 && game.state)
    return campaignSchedule(game as typeof game & { state: GameState });
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
        ids.every((id) => typeof id === 'string' && SITUATION_IDS.includes(id)) &&
        (monthIndex >= completedMonths.length ||
          JSON.stringify(ids) === JSON.stringify(completedMonths[monthIndex])),
    ) &&
    new Set(schedule.flat()).size === schedule.flat().length
  )
    return schedule;
  return createStorySchedule(game.storySeed ?? 42, game.plans);
}

/** Future years are drawn only when the month starts, using the current budget and assets. */
function campaignSchedule(game: {
  storySeed?: number;
  storySchedule?: string[][];
  plans: Plan[];
  state: GameState;
  month?: number;
}) {
  const firstYear = ensureStorySchedule({
    storySeed: game.storySeed,
    storySchedule: game.storySchedule?.slice(0, 12),
    plans: game.plans.slice(0, 12),
  });
  const months = campaignMonths(game.state);
  const schedule = Array.from({ length: months }, (_, month) =>
    month < 12 ? firstYear[month] : ([] as string[]),
  );
  for (let month = 12; month < Math.min(game.plans.length, months); month++)
    schedule[month] = planSituationIds(game.plans[month], month);
  const month = game.month ?? game.plans.length;
  if (month < 12 || month >= months) return schedule;
  const used = new Set(schedule.flat());
  const saved = game.storySchedule?.[month];
  if (
    saved?.length &&
    saved.length <= 3 &&
    new Set(saved).size === saved.length &&
    saved.every(
      (id) =>
        typeof id === 'string' &&
        !used.has(id) &&
        getScenario(id) &&
        campaignStoryAvailable(id, game.state, month),
    )
  ) {
    schedule[month] = saved;
    return schedule;
  }
  const random = randomSource((game.storySeed ?? 42) ^ Math.imul(month + 1, 2654435761));
  const candidates = [...SITUATION_IDS, ...Object.keys(CAMPAIGN_STORIES)].filter(
    (id) => !used.has(id) && campaignStoryAvailable(id, game.state, month),
  );
  const count = 1 + Math.floor(random() * 3);
  for (let n = 0; n < count && candidates.length; n++) {
    const weights = candidates.map((id) => storyWeight(id, game.state));
    let cursor = random() * weights.reduce((a, b) => a + b, 0);
    let index = weights.length - 1;
    for (let i = 0; i < weights.length; i++) {
      cursor -= weights[i];
      if (cursor <= 0) {
        index = i;
        break;
      }
    }
    schedule[month].push(candidates.splice(index, 1)[0]);
  }
  if (!schedule[month].length) throw new Error('Не удалось подобрать ситуации для нового месяца.');
  return schedule;
}

function storyWeight(id: string, state: GameState) {
  const story = CAMPAIGN_STORIES[id];
  if (!story) return 1;
  const available =
    state.cash +
    state.savings +
    state.fund -
    state.loans.reduce((sum, loan) => sum + loan.balance, 0);
  const band =
    available < 25000
      ? 'tight'
      : available < 100000
        ? 'steady'
        : available < 250000
          ? 'growth'
          : 'wealthy';
  if (story.requires) return 5;
  if (story.budget === band) return 10;
  if ((band === 'tight' || band === 'steady') && story.budget === 'wealthy') return 0.2;
  return 2;
}
