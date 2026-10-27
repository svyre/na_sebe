import { HOUSING, macroFor } from './game/config';
import { campaignMonths } from './game/campaign';
import { randomSource } from './game/schedule';
import { FRIEND_SITUATIONS } from './game/situations/friends';
import type { Plan, Solo } from './game/types';
import { rub } from './game/utils';
import { CAST, CHAPTERS } from './narrative/chapters';
import type { StoryMessage } from './narrative';

export type RoommateId = 'sasha' | 'lera';
export type HousingInvitation = {
  month: number;
  friend: RoommateId;
  accepted: boolean;
  chance: number;
  request: string;
  reply: string;
};
export type FriendsProgress = { version: 1; invitations: HousingInvitation[] };
type SocialGame = Solo & { storySeed?: number };
export const ROOMMATES = ['sasha', 'lera'] as const;
const isRoommate = (value: unknown): value is RoommateId => value === 'sasha' || value === 'lera';
export const firstFriends = (): FriendsProgress => ({ version: 1, invitations: [] });

export function normalizeFriends(value: unknown): FriendsProgress {
  const result = firstFriends();
  if (!value || typeof value !== 'object') return result;
  const raw = value as Partial<FriendsProgress>;
  if (!Array.isArray(raw.invitations)) return result;
  const months = new Set<number>();
  for (const invite of raw.invitations) {
    if (
      !invite ||
      !Number.isInteger(invite.month) ||
      invite.month < 0 ||
      invite.month > 35 ||
      months.has(invite.month) ||
      !isRoommate(invite.friend) ||
      typeof invite.accepted !== 'boolean' ||
      !Number.isFinite(invite.chance) ||
      invite.chance < 0 ||
      invite.chance > 100 ||
      typeof invite.request !== 'string' ||
      typeof invite.reply !== 'string'
    )
      continue;
    result.invitations.push({
      month: invite.month,
      friend: invite.friend,
      accepted: invite.accepted,
      chance: invite.chance,
      request: invite.request,
      reply: invite.reply,
    });
    months.add(invite.month);
  }
  result.invitations.sort((a, b) => a.month - b.month);
  return result;
}

export function invitationFor(game: Solo, month = game.month) {
  return normalizeFriends(game.friends).invitations.find((invite) => invite.month === month);
}

export function roommateFor(game: Solo): RoommateId | undefined {
  if (game.plans.at(-1)?.housing !== 'shared') return;
  let moved = game.plans.length - 1;
  while (moved > 0 && game.plans[moved - 1].housing === 'shared') moved--;
  return normalizeFriends(game.friends).invitations.find(
    (invite) => invite.month === moved && invite.accepted,
  )?.friend;
}

export function roommateChance(game: Solo, friend: RoommateId): number {
  const choices = game.narrative?.choices || {};
  const answered = Object.keys(choices).filter(
    (month) => Number(month) < game.month && CHAPTERS[Number(month)]?.from === friend,
  ).length;
  let trust = 0;
  for (const report of game.reports.filter((report) => report.month < game.month)) {
    for (const event of [
      { scenario: report.plan.scenario, choice: report.plan.choice },
      ...(report.plan.extras || []),
    ]) {
      const scene = event.scenario && FRIEND_SITUATIONS[event.scenario];
      if (scene && scene.from === friend)
        trust += scene.choices.find((choice) => choice.id === event.choice)?.trust || 0;
    }
  }
  // Keeping in touch helps either way; choosing to work alone is not a penalty.
  return Math.max(
    20,
    Math.min(
      90,
      (friend === 'sasha' ? 65 : 55) +
        Math.min(10, answered * 2) +
        Math.max(-15, Math.min(15, trust * 3)),
    ),
  );
}

export function proposeHousing(game: SocialGame, friend: RoommateId): FriendsProgress {
  const progress = normalizeFriends(game.friends);
  if (
    !isRoommate(friend) ||
    !Number.isInteger(game.month) ||
    game.month < 0 ||
    game.month >= campaignMonths(game.state) ||
    game.plans.at(-1)?.housing === 'shared' ||
    progress.invitations.some((invite) => invite.month === game.month)
  )
    return progress;
  const chance = roommateChance(game, friend);
  const random = randomSource(
    (game.storySeed ?? 42) ^
      Math.imul(game.month + 1, 2246822519) ^
      (friend === 'sasha' ? 0x51a5 : 0x1e2a),
  );
  const accepted = random() * 100 < chance;
  const share = Math.round(
    HOUSING.find((home) => home.id === 'shared')!.cost *
      macroFor(game.month, game.difficulty).inflation,
  );
  const reply =
    friend === 'sasha'
      ? accepted
        ? 'Я за. Давай снимать вместе. Скинь квартиру, вечером посмотрим'
        : 'Сейчас не смогу, извини. Я пока за общагу заплатил и с переездом не потяну'
      : accepted
        ? 'Давай попробуем. Только заранее договоримся про уборку и общие покупки, ладно?'
        : 'Я пока не готова переезжать. Мне сейчас удобнее остаться на своём месте';
  return {
    ...progress,
    invitations: [
      ...progress.invitations,
      {
        month: game.month,
        friend,
        chance,
        accepted,
        request: `Как насчёт снимать квартиру вместе? Моя доля выходит ${rub(share)} в месяц.`,
        reply,
      },
    ],
  };
}

export function housingApprovalError(game: Solo, plan: Pick<Plan, 'housing'>): string | null {
  if (plan.housing !== 'shared' || game.plans.at(-1)?.housing === 'shared') return null;
  const invite = invitationFor(game);
  if (!invite) return 'Предложи Саше или Лере снимать квартиру вместе в разделе «План».';
  if (!invite.accepted)
    return `${CAST[invite.friend].name} не может переехать в этом месяце. Выбери другое жильё; предложить снова можно в следующем месяце.`;
  return null;
}

export function friendReaction(game: Solo): StoryMessage | undefined {
  const report = game.reports.find((item) => item.month === game.month - 1);
  if (!report) return;
  const invite = invitationFor(game, report.month);
  if (
    invite?.accepted &&
    report.plan.housing === 'shared' &&
    (game.plans[report.month - 1]?.housing || 'dorm') !== 'shared'
  )
    return {
      from: invite.friend,
      text:
        invite.friend === 'sasha'
          ? 'Всё, переехали. Я на кухне продукты разложил. Твои пакеты пока не трогал'
          : 'Я свою часть вещей разложила. Вечером давай решим, что из общего ещё нужно купить',
    };
  const events = [
    { scenario: report.plan.scenario, choice: report.plan.choice },
    ...(report.plan.extras || []),
  ];
  for (const event of events.toReversed()) {
    const scene = event.scenario && FRIEND_SITUATIONS[event.scenario];
    const choice = scene && scene.choices.find((item) => item.id === event.choice);
    if (scene && choice) return { from: scene.from, text: choice.reply };
  }
}
