import { GOALS, JOBS, MONTHS } from './config';
import { skillsForWork } from './development';
import type { CampaignYears, GameState, GoalId } from './types';

export const campaignYears = (state?: Pick<GameState, 'years'>): CampaignYears =>
  state?.years === 2 || state?.years === 3 ? state.years : 1;
export const campaignMonths = (state?: Pick<GameState, 'years'>) => campaignYears(state) * 12;
export const yearNumber = (month: number) => Math.floor(month / 12) + 1;
export const monthLabel = (month: number, withYear = month >= 12) =>
  MONTHS[month % 12] + (withYear ? ` · год ${yearNumber(month)}` : '');

export function campaignGoal(goal: GoalId, years: CampaignYears = 1) {
  const amounts = {
    capital: [100000, 260000, 500000],
    career: [70000, 200000, 400000],
    freedom: [140000, 360000, 700000],
  };
  return { ...GOALS[goal], target: amounts[goal][years - 1], skills: GOALS[goal].skills * years };
}

const SPECIALIST = {
  id: 'specialist',
  name: 'Работа по специальности',
  income: 28000,
  hours: 48,
  fatigue: 18,
  education: -1,
};
export const jobSettings = (id: string) => [...JOBS, SPECIALIST].find((job) => job.id === id)!;
export const jobsForMonth = (state: GameState, month: number) =>
  month >= 12 && skillsForWork(state, month) >= 4 ? [...JOBS, SPECIALIST] : JOBS;
