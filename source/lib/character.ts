import type { Solo } from './game';

export type CharacterId = 'boy' | 'girl';
export type PlayerSolo = Solo & {
  character: CharacterId;
  eventsPerMonth?: 1 | 2 | 3;
  storySeed?: number;
  storySchedule?: string[][];
};
export const characterId = (value: unknown): CharacterId => (value === 'girl' ? 'girl' : 'boy');
export const CHARACTERS = {
  boy: {
    label: 'Мальчик',
    note: 'Синий джемпер, белый воротничок и кеды',
    color: '#315fdf',
    background: '#e9eefb',
  },
  girl: {
    label: 'Девочка',
    note: 'Синий кардиган, короткое каре и кеды',
    color: '#315fdf',
    background: '#edf0ff',
  },
} as const;
