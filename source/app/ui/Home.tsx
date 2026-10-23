'use client';

import { useState, type CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, CheckCheck, ChevronDown, Clock3, Flag, GitBranch, GraduationCap, House, MoveUpRight, Play, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { DIFFICULTIES, difficultyId, rub, type DifficultyId, type Solo } from '@/lib/game';

type HomeProps = { solo: Solo | null; onSolo: () => void; onDifficulty: (d: DifficultyId) => void; onGuide: () => void; onResults: () => void; };
const levelNames: Record<DifficultyId, string> = {first: 'Спокойный старт', balance: 'Золотая середина', challenge: 'Больше самостоятельности'};

export function Home({solo, onSolo, onDifficulty, onGuide, onResults}: HomeProps) {
  const [preview, setPreview] = useState<DifficultyId>(difficultyId(solo?.difficulty));
  const level = DIFFICULTIES[preview];
  const total = level.cash + level.savings;
  const [reserve, setReserve] = useState(level.savings);
  const choosePreview = (id: DifficultyId) => {setPreview(id); setReserve(DIFFICULTIES[id].savings);};
  const begin = () => solo ? onSolo() : onDifficulty(preview);
  const startLabel = solo ? solo.month === 12 ? 'Посмотреть результат' : 'Продолжить свой год' : 'Начать свой год';

  return <div className="new-home">
    <section className="intro" aria-labelledby="intro-title">
      <div className="intro-copy">
        <span className="intro-tag"><span className="intro-tag-dot"/>Можно попробовать взрослую жизнь</span>
        <h1 id="intro-title">Твой год.<br/>Твои деньги.<br/>Твои решения.</h1>
        <p className="intro-description">Съехать от родителей, найти подработку, не потратить всё в сентябре. Проживи первый самостоятельный год: случайные ситуации, решения и последствия — пока в игре.</p>
        <div className="intro-actions">
          <button className="button primary" onClick={begin}>{startLabel}<ArrowUpRight size={20}/></button>
          <button className="intro-guide" onClick={onGuide}><span><Play size={13} fill="currentColor"/></span>Как играть</button>
        </div>
        <div className="intro-facts"><span><Clock3 size={16}/>В своём темпе</span><span><Flag size={16}/>12 месяцев · 60 историй</span><span><ShieldCheck size={16}/>Деньги виртуальные</span></div>
        {solo && <button className="resume-strip" onClick={onSolo}><CheckCheck size={19}/><span>Твоя стратегия сохранена<small>{solo.month === 12 ? 'Год завершён. Посмотри свой результат.' : `Пройдено ${solo.month} из 12 месяцев. Продолжим?`}</small></span><ArrowRight size={18}/></button>}
      </div>
      <div className="budget-playground">
        <div className="playground-head"><span><Sparkles size={16}/>Твой первый бюджет</span><span className="demo-pill">Попробуй</span></div>
        <div className="preview-tabs" role="group" aria-label="Сложность пробного бюджета">{(Object.keys(DIFFICULTIES) as DifficultyId[]).map(id=><button key={id} aria-pressed={id===preview} onClick={()=>choosePreview(id)}>{DIFFICULTIES[id].name}</button>)}</div>
        <div className="budget-receipt">
          <div className="receipt-head"><span className="receipt-symbol"><Wallet size={23}/></span><div><b>Всё начинается здесь</b><span>Сентябрь. Первый месяц</span></div><span className="receipt-index">1 / 12</span></div>
          <span className="receipt-label">Твой стартовый бюджет</span>
          <div className="receipt-amount" aria-live="polite">{rub(total)}</div>
          <div className="allocation-bar" aria-hidden="true"><span style={{width:`${(total-reserve)/total*100}%`}}/><span style={{width:`${reserve/total*100}%`}}/></div>
          <dl className="allocation-values"><div><dt><i/>На жизнь</dt><dd>{rub(total-reserve)}</dd></div><div><dt><i/>В резерв</dt><dd>{rub(reserve)}</dd></div></dl>
          <div className="reserve-control">
            <div><label htmlFor="demo-reserve">Сколько отложишь?</label><span>Подвигай ползунок</span></div>
            <input id="demo-reserve" type="range" min="0" max={total} step="1000" value={reserve} onChange={e=>setReserve(Number(e.target.value))} aria-valuetext={`${rub(reserve)} в резерве`} style={{'--range-progress':`${reserve/total*100}%`} as CSSProperties}/>
            <div className="range-labels"><span>Всё на жизнь</span><span>Всё в резерв</span></div>
          </div>
          <div className="receipt-message" aria-live="polite"><ShieldCheck size={17}/><span>{reserve===0 ? 'Без резерва любой сюрприз меняет планы.' : reserve===total ? 'Резерв есть. А на что жить в этом месяце?' : 'Решать тебе. Найди свой баланс.'}</span></div>
        </div>
        <div className="playground-caption"><span className="demo-cursor"><MoveUpRight size={18}/></span><span>Здесь можно пробовать.<br/><b>В игре — увидеть последствия.</b></span></div>
        <span className="paper-note">Можно<br/>ошибаться.<span>Это и есть опыт.</span></span>
      </div>
    </section>
    <div className="learning-strip">
      <span className="strip-intro">Навыки, которые<br/><b>останутся с тобой</b></span>
      {[{icon:Wallet,title:'Дружить с бюджетом',text:'Расходы, накопления и кредиты'}, {icon:ShieldCheck,title:'Замечать подвох',text:'Договоры, предложения и риски'}, {icon:GitBranch,title:'Видеть последствия',text:'Один выбор — разные истории'}].map(({icon:Icon,title,text})=><div className="learning-item" key={title}><Icon size={23}/><div><b>{title}</b><span>{text}</span></div></div>)}
    </div>
    <section className="levels-section" aria-labelledby="levels-title">
      <div className="new-section-head"><div><span className="section-caption">Сложность выбираешь ты</span><h2 id="levels-title">У каждого свой старт.</h2></div><p>События одни и те же. Меняются деньги,<br className="desktop-break"/> поддержка и время на твои планы.</p></div>
      <div className="new-level-grid">{(Object.entries(DIFFICULTIES) as [DifficultyId,typeof level][]).map(([id,d])=><article className={`new-level level-${id}`} key={id}>
        <div className="new-level-top"><span className="level-symbol" aria-hidden="true">{id==='first'?<House size={25}/>:id==='balance'?<Wallet size={25}/>:<Flag size={25}/>}</span><span className="level-character">{levelNames[id]}</span></div>
        <h3>{d.name}</h3><p>{d.description}</p>
        <div className="level-start"><span>На старте</span><b>{rub(d.cash+d.savings)}</b></div>
        <dl><div><dt>Поддержка в месяц</dt><dd>{rub(d.support)}</dd></div><div><dt>Время в месяц</dt><dd>{d.hours} ч</dd></div></dl>
        <button className="level-start-button" onClick={()=>onDifficulty(id)}>Выбрать «{d.name}»<ArrowUpRight size={18}/></button>
      </article>)}</div>
    </section>
    <section className="how-section" aria-labelledby="how-title">
      <div className="how-intro"><span className="section-caption">Маленькие решения. Целый год.</span><h2 id="how-title">Всё как в жизни.<br/>Только с правом<br/>попробовать ещё.</h2><p>В конце увидишь свою историю и сможешь сравнить её с другим решением.</p><button className="text-button" onClick={solo&&solo.month>0?onResults:onGuide}>Посмотреть, как устроена игра<ArrowUpRight size={17}/></button><div className="month-ribbon" aria-label="12 месяцев игры">{['Сен','Окт','Ноя','Дек','Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг'].map((month,i)=><span key={month} className={i===0?'month-start':''}>{month}</span>)}</div></div>
      <div className="how-steps">{[
        {title:'Разберись в ситуации',text:'Каждый месяц случайно выпадает от 1 до 3 ситуаций без повторов за год: жильё, работа, покупки или неожиданное предложение. Прочитай условия и выбери, как поступить.',icon:BookOpen},
        {title:'Собери свой план',text:'Распредели деньги и время между работой, учёбой и отдыхом. Бюджет покажет, сколько останется на руках до принятия решения.',icon:Wallet},
        {title:'Узнай, к чему всё привело',text:'Заверши месяц, посмотри операции и последствия. Измени стратегию в следующем месяце, а в финале сравни альтернативный выбор.',icon:GitBranch}
      ].map(({title,text,icon:Icon},i)=><details className="how-step" key={title} open={i===0?true:undefined}><summary><span className="step-number">{i+1}</span><h3>{title}</h3><ChevronDown size={20}/></summary><div className="step-body"><p>{text}</p><Icon size={28}/></div></details>)}</div>
    </section>
    <section className="closing-start"><div><span><GraduationCap size={19}/>Тренировка перед самостоятельностью</span><h2>А какой год получится у тебя?</h2><p>Понадобятся любопытство и немного смелости. Остальное — по ходу.</p></div><button className="button" onClick={begin}>{startLabel}<ArrowUpRight size={21}/></button></section>
    <div className="home-footnote"><ShieldCheck size={15}/><span>Прогресс сохраняется в этом браузере. Все суммы и предложения — условия игровой модели.</span></div>
  </div>;
}
