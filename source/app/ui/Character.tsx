import { CHARACTERS, type CharacterId } from '@/lib/character';
import { Check } from 'lucide-react';
import { memo } from 'react';

import boyHappy from '../../assets/characters/boy-happy.webp';
import boyNeutral from '../../assets/characters/boy-neutral.webp';
import boyThinking from '../../assets/characters/boy-thinking.webp';
import girlHappy from '../../assets/characters/girl-happy.webp';
import girlNeutral from '../../assets/characters/girl-neutral.webp';
import girlThinking from '../../assets/characters/girl-thinking.webp';

export type CharacterEmotion = 'neutral' | 'happy' | 'thinking';
type CharacterFrame = { source: string; viewBox: string; width: number; height: number };
const frames: Record<CharacterId, Record<CharacterEmotion, CharacterFrame>> = {
  boy: {
    neutral: { source: boyNeutral, viewBox: '51 12 280 526', width: 384, height: 544 },
    happy: { source: boyHappy, viewBox: '33 12 310 526', width: 384, height: 544 },
    thinking: { source: boyThinking, viewBox: '40 12 300 526', width: 384, height: 544 },
  },
  girl: {
    neutral: { source: girlNeutral, viewBox: '20 10 300 486', width: 352, height: 496 },
    happy: { source: girlHappy, viewBox: '17 10 310 486', width: 352, height: 496 },
    thinking: { source: girlThinking, viewBox: '30 10 310 486', width: 368, height: 496 },
  },
};
const emotions = { neutral: 'спокойствие', happy: 'радость', thinking: 'размышление' };
/** Each lossless frame includes the SVG viewport margins, preserving the original crop. */
export const CharacterFigure = memo(function CharacterFigure({
  character,
  emotion = 'neutral',
  reaction = 0,
}: {
  character: CharacterId;
  emotion?: CharacterEmotion;
  reaction?: number;
}) {
  const frame = frames[character][emotion];
  return (
    <g className="character-figure" data-character={character} data-emotion={emotion}>
      <g className="character-idle">
        <g className={`character-pose pose-${emotion}`} key={`${character}-${emotion}-${reaction}`}>
          <svg
            x="0"
            y="0"
            width="220"
            height="320"
            viewBox={frame.viewBox}
            preserveAspectRatio="xMidYMax meet"
            overflow="hidden"
          >
            <image href={frame.source} x="0" y="0" width={frame.width} height={frame.height} />
          </svg>
        </g>
      </g>
    </g>
  );
});
export const CharacterArt = memo(function CharacterArt({
  character,
  portrait = false,
  emotion = 'neutral',
}: {
  character: CharacterId;
  portrait?: boolean;
  emotion?: CharacterEmotion;
}) {
  return (
    <svg
      className={`character-art ${portrait ? 'portrait' : ''}`}
      viewBox={portrait ? '20 0 180 160' : '0 0 220 320'}
      role="img"
      aria-label={`Персонаж: ${CHARACTERS[character].label.toLowerCase()}, ${emotions[emotion]}`}
    >
      <CharacterFigure character={character} emotion={emotion} />
    </svg>
  );
});

export function CharacterPicker({
  value,
  onChange,
}: {
  value: CharacterId;
  onChange: (id: CharacterId) => void;
}) {
  return (
    <fieldset className="character-picker">
      <legend>Кем проживёшь этот год?</legend>
      <p>Выбери своего персонажа. Правила и стартовые условия одинаковые.</p>
      <div className="character-options">
        {(Object.keys(CHARACTERS) as CharacterId[]).map((id) => (
          <label className={`character-option ${value === id ? 'chosen' : ''}`} key={id}>
            <input
              type="radio"
              name="character"
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
            />
            <div className="character-preview" style={{ background: CHARACTERS[id].background }}>
              <span className="character-backdrop" />
              <CharacterArt character={id} emotion={value === id ? 'happy' : 'neutral'} />
              <span className="character-selected">
                {value === id ? <Check size={15} /> : null}
              </span>
            </div>
            <div className="character-option-label">
              <b>{CHARACTERS[id].label}</b>
              <span>{value === id ? 'Выбран' : 'Выбрать'}</span>
            </div>
          </label>
        ))}
      </div>
      <span className="character-picker-note">
        Сменить внешность можно и во время игры — прогресс сохранится.
      </span>
    </fieldset>
  );
}
