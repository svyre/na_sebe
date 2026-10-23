'use client';

import { Check, Clock3, Wallet } from 'lucide-react';
import { DIFFICULTIES, rub, percent, type DifficultyId } from '@/lib/game';

export function DifficultyBars({level}:{level:DifficultyId}) {
  const count=level==='first'?1:level==='balance'?2:3;
  return <span className="difficulty-bars" aria-hidden="true">{[1,2,3].map(n=><i className={n<=count?'filled':''} key={n}/>)}</span>;
}

export function DifficultyPicker({value,onChange,classroom=false}:{value:DifficultyId;onChange:(d:DifficultyId)=>void;classroom?:boolean}) {
  const selected=DIFFICULTIES[value];
  return <>
    <fieldset className="difficulty-picker">
      <legend>Сложность</legend>
      <p>{classroom?'Одинаковые условия для всех команд в комнате.':'Выбери условия для своего года. Сложность сохраняется до финала.'}</p>
      <div className="difficulty-options">
        {(Object.entries(DIFFICULTIES) as [DifficultyId,typeof selected][]).map(([id,d])=><label className={'difficulty-option '+(value===id?'selected':'')} key={id}>
          <input type="radio" name="difficulty" value={id} checked={value===id} onChange={()=>onChange(id)}/>
          <span className="difficulty-option-head"><DifficultyBars level={id}/><span className="difficulty-check">{value===id&&<Check size={12}/>}</span></span>
          <strong>{d.name}</strong><span className="difficulty-label">{d.label}</span>
          <small>{rub(d.cash+d.savings)} на старте</small>
        </label>)}
      </div>
    </fieldset>
    <div className="starting-pack difficulty-details" aria-live="polite">
      <div className="difficulty-description"><b>{selected.name}</b><span>{selected.description}</span></div>
      <div className="difficulty-facts">
        <div><Wallet size={16}/><span>Деньги на руках<b>{rub(selected.cash)}</b></span></div>
        <div><Wallet size={16}/><span>В резерве<b>{rub(selected.savings)}</b></span></div>
        <div><Wallet size={16}/><span>Поддержка в месяц<b>{rub(selected.support)}</b></span></div>
        <div><Clock3 size={16}/><span>Время в месяц<b>{selected.hours} часов</b></span></div>
      </div>
      <p>Стипендия до 3 000 ₽. Рост базовых цен к августу: {percent(6*selected.inflationFactor)}. {value==='first'?'Колебания фонда мягче на 25%.':value==='challenge'?'Колебания фонда сильнее на 50%.':'Базовые колебания фонда.'}</p>
    </div>
  </>;
}
