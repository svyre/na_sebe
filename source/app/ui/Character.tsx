'use client';
import { Check } from 'lucide-react';
import { CHARACTERS, type CharacterId } from '@/lib/character';

import sprites from '../../assets/characters.png';

export type CharacterEmotion = 'neutral' | 'happy' | 'thinking';
const frames:Record<CharacterId,Record<CharacterEmotion,string>>={
 boy:{neutral:'195 12 280 526',happy:'625 12 310 526',thinking:'1080 12 300 526'},
 girl:{neutral:'180 538 300 486',happy:'625 538 310 486',thinking:'1070 538 310 486'},
};
const emotions={neutral:'спокойствие',happy:'радость',thinking:'размышление'};
/** A single embedded sheet keeps identity consistent across all six poses. */
export function CharacterFigure({character,emotion='neutral',reaction=0}:{character:CharacterId;emotion?:CharacterEmotion;reaction?:number}) {
 return <g className="character-figure" data-character={character} data-emotion={emotion}>
  <g className="character-idle"><g className={`character-pose pose-${emotion}`} key={`${character}-${emotion}-${reaction}`}>
  <svg x="0" y="0" width="220" height="320" viewBox={frames[character][emotion]} preserveAspectRatio="xMidYMax meet" overflow="hidden">
   <image href={sprites} x="0" y="0" width="1536" height="1024"/>
  </svg>
  </g></g>
 </g>;
}
export function CharacterArt({character,portrait=false,emotion='neutral'}:{character:CharacterId;portrait?:boolean;emotion?:CharacterEmotion}) {
 return <svg className={`character-art ${portrait?'portrait':''}`} viewBox={portrait?'20 0 180 160':'0 0 220 320'} role="img" aria-label={`Персонаж: ${CHARACTERS[character].label.toLowerCase()}, ${emotions[emotion]}`}><CharacterFigure character={character} emotion={emotion}/></svg>;
}

export function CharacterPicker({value,onChange}:{value:CharacterId;onChange:(id:CharacterId)=>void}) {
 return <fieldset className="character-picker"><legend>Кем проживёшь этот год?</legend><p>Выбери своего персонажа. Правила и стартовые условия одинаковые.</p><div className="character-options">{(Object.keys(CHARACTERS) as CharacterId[]).map(id=><label className={`character-option ${value===id?'chosen':''}`} key={id}>
  <input type="radio" name="character" value={id} checked={value===id} onChange={()=>onChange(id)}/><div className="character-preview" style={{background:CHARACTERS[id].background}}><span className="character-backdrop"/><CharacterArt character={id} emotion={value===id?'happy':'neutral'}/><span className="character-selected">{value===id?<Check size={15}/>:null}</span></div><div className="character-option-label"><b>{CHARACTERS[id].label}</b><span>{value===id?'Выбран':'Выбрать'}</span></div>
 </label>)}</div><span className="character-picker-note">Сменить внешность можно и во время игры — прогресс сохранится.</span></fieldset>;
}
