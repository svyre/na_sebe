import type { GameState, Plan, RoomItemId } from './types';

export const ROOM_ITEMS = {
  lamp: {
    name: 'Настольная лампа',
    cost: 1200,
    hours: 1,
    education: 1,
    energy: 0,
    description: 'Свет для вечерних занятий',
  },
  desk: {
    name: 'Удобный стол',
    cost: 6500,
    hours: 4,
    education: 2,
    energy: 0,
    description: 'Больше места для учебных проектов',
  },
  chair: {
    name: 'Рабочее кресло',
    cost: 3500,
    hours: 2,
    education: 0,
    energy: 2,
    description: 'Комфортнее проводить время за столом',
  },
  mattress: {
    name: 'Хороший матрас',
    cost: 4800,
    hours: 1,
    education: 0,
    energy: 3,
    description: 'Удобнее восстанавливаться после нагрузки',
  },
  shelf: {
    name: 'Книжный стеллаж',
    cost: 2200,
    hours: 2,
    education: 1,
    energy: 0,
    description: 'Материалы для занятий под рукой',
  },
  plant: {
    name: 'Растение',
    cost: 900,
    hours: 1,
    education: 0,
    energy: 1,
    description: 'Немного уюта в своём пространстве',
  },
} as const satisfies Record<
  RoomItemId,
  {
    name: string;
    cost: number;
    hours: number;
    education: number;
    energy: number;
    description: string;
  }
>;

export function roomInventory(state: Pick<GameState, 'roomItems'>): RoomItemId[] {
  return Array.isArray(state.roomItems)
    ? [...new Set(state.roomItems.filter((id): id is RoomItemId => Object.hasOwn(ROOM_ITEMS, id)))]
    : [];
}

export function roomEffects(state: Pick<GameState, 'roomItems'>) {
  return roomInventory(state).reduce(
    (sum, id) => ({
      education: sum.education + ROOM_ITEMS[id].education,
      energy: sum.energy + ROOM_ITEMS[id].energy,
    }),
    { education: 0, energy: 0 },
  );
}

/** Versioning keeps completed pre-room plans reproducible. Gifts are not applied retroactively. */
export function roomGifts(plan: Plan, month: number): RoomItemId[] {
  if (plan.roomVersion !== 1) return [];
  const decisions = [
    { scenario: plan.scenario || `main-${month % 12}`, choice: plan.choice },
    ...(plan.extras || []),
  ];
  const gifts: RoomItemId[] = [];
  for (const decision of decisions) {
    if (decision.scenario === 'desk' && (decision.choice === 'a' || decision.choice === 'b'))
      gifts.push('desk');
    if (decision.scenario === 'parcel' && decision.choice === 'c') gifts.push('lamp');
  }
  return [...new Set(gifts)];
}
