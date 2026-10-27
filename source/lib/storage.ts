import { characterId, type PlayerSolo } from './character';
import { campaignMonths, difficultyId, ensureStorySchedule, GOALS } from './game';

// Keep this key stable so an updated HTML page can resume an existing game.
export const SAVE_KEY = 'na-svoih-solo-v1';
type GameStorage = Pick<Storage, 'getItem' | 'setItem'>;

function isSavedGame(value: unknown): value is PlayerSolo {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.goal === 'string' &&
    Object.hasOwn(GOALS, data.goal) &&
    !!data.state &&
    typeof data.state === 'object' &&
    Array.isArray(data.reports) &&
    Array.isArray(data.plans) &&
    Number.isInteger(data.month) &&
    Number(data.month) >= 0 &&
    Number(data.month) <= campaignMonths(data.state as PlayerSolo['state']) &&
    (!Object.hasOwn(data.state, 'years') ||
      [1, 2, 3].includes((data.state as PlayerSolo['state']).years!))
  );
}

export function loadGame(storage?: GameStorage): PlayerSolo | null {
  try {
    const raw = (storage ?? localStorage).getItem(SAVE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!isSavedGame(data)) return null;

    const game: PlayerSolo = {
      ...data,
      difficulty: difficultyId(data.difficulty),
      character: characterId(data.character),
      storySeed: Number.isInteger(data.storySeed) ? data.storySeed : 42,
    };
    game.storySchedule = ensureStorySchedule(game);
    return game;
  } catch {
    // Private mode, blocked storage or a broken save should not prevent opening the game.
    return null;
  }
}

export function saveGame(game: PlayerSolo, storage?: GameStorage): boolean {
  try {
    (storage ?? localStorage).setItem(SAVE_KEY, JSON.stringify(game));
    return true;
  } catch {
    return false;
  }
}
