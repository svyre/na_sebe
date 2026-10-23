'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronRight, Flag, GraduationCap, LayoutDashboard, Menu, Plus, X } from 'lucide-react';
import { GOALS, MONTHS, ensureStorySchedule, createStorySchedule, planSituationIds, difficultyId, initialState, settle, type DifficultyId, type GoalId, type Plan, type Report } from '@/lib/game';
import { Modal, PartnerMark } from './shared';
import { Home } from './Home';
import { DifficultyPicker } from './DifficultyPicker';
import { Glossary, Guide } from './Info';
import { Game } from './Game';
import { Results, ReportView } from './Results';
import { characterId, type CharacterId, type PlayerSolo } from '@/lib/character';
import { CharacterPicker } from './Character';

type Page='home'|'play'|'glossary'|'guide'|'results';
const STORAGE='na-svoih-solo-v1';
function save(data:PlayerSolo) {try {localStorage.setItem(STORAGE,JSON.stringify(data));return true;}catch{return false;}}

export default function App() {
  const [page,setPage]=useState<Page>('home'),[solo,setSolo]=useState<PlayerSolo|null>(null),[run,setRun]=useState(0);
  const [modal,setModal]=useState<'setup'|'restart'|'character'|null>(null),[report,setReport]=useState<Report|null>(null);
  const [mobile,setMobile]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState(''),[toast,setToast]=useState('');
  const [name,setName]=useState(''),[goal,setGoal]=useState<GoalId>('capital'),[difficulty,setDifficulty]=useState<DifficultyId>('balance');
  const [character,setCharacter]=useState<CharacterId>('boy');
  const sidebar=useRef<HTMLElement>(null);

  useEffect(()=>{
    try {
      const raw=localStorage.getItem(STORAGE);
      if(raw){const x=JSON.parse(raw);if(x&&GOALS[x.goal as GoalId]&&x.state&&Array.isArray(x.reports)&&Array.isArray(x.plans)&&Number.isInteger(x.month)&&x.month>=0&&x.month<=12){const loaded:PlayerSolo={...x,difficulty:difficultyId(x.difficulty),character:characterId(x.character),storySeed:Number.isInteger(x.storySeed)?x.storySeed:42};loaded.storySchedule=ensureStorySchedule(loaded);setSolo(loaded);save(loaded);setCharacter(characterId(x.character));}}
    }catch{}
    setReady(true);
  },[]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),5000);return()=>clearTimeout(id);},[toast]);
  useEffect(()=>{
    if(!mobile)return;
    const before=document.activeElement as HTMLElement,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const items=()=>Array.from(sidebar.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],[tabindex="0"]')||[]).filter(e=>e.offsetParent!==null);
    items()[0]?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape')setMobile(false);
      if(e.key==='Tab'){
        const list=items(),first=list[0],last=list.at(-1);
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',key);
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);if(before?.isConnected)before.focus();};
  },[mobile]);

  const nav=(next:Page)=>{setPage(next);setMobile(false);setError('');window.scrollTo({top:0,behavior:'smooth'});};
  const configure=(level?:DifficultyId)=>{if(level)setDifficulty(level);if(solo)setCharacter(solo.character);setName('');setError('');setMobile(false);setModal('setup');};
  const resume=()=>{if(solo)nav(solo.month>=12?'results':'play');else configure();};
  const start=(e:React.FormEvent)=>{
    e.preventDefault();
    const storySeed=crypto.getRandomValues(new Uint32Array(1))[0];
    const data:PlayerSolo={character,storySeed,storySchedule:createStorySchedule(storySeed),name:name.trim()||'Моя стратегия',goal,difficulty,month:0,state:initialState(difficulty),reports:[],plans:[]};
    setSolo(data);setRun(value=>value+1);if(!save(data))setToast('Браузер не разрешил сохранение. Оставь эту вкладку открытой.');
    setReport(null);setModal(null);nav('play');
  };
  const commit=(plan:Plan)=>{
    if(!solo)return;
    try {
      const expected=ensureStorySchedule(solo)[solo.month];
      if(JSON.stringify(planSituationIds(plan,solo.month))!==JSON.stringify(expected))throw new Error('Список ситуаций изменился. Открой текущий месяц заново.');
      const result=settle(solo.state,plan,solo.month,solo.goal,true,solo.difficulty);
      const data={...solo,month:solo.month+1,state:result.after,reports:[...solo.reports,result],plans:[...solo.plans,plan]};
      setSolo(data);setError('');if(!save(data))setToast('Не удалось сохранить прогресс на устройстве.');
      setReport(result);if(data.month===12)nav('results');
    }catch(e){setError(e instanceof Error?e.message:'Проверь план.');}
  };
  const openCharacter=()=>{if(!solo)return;setCharacter(solo.character);setModal('character');};
  const applyCharacter=()=>{if(!solo)return;const updated={...solo,character};setSolo(updated);setModal(null);if(save(updated))setToast('Персонаж сохранён');else setToast('Персонаж изменён, но браузер не разрешил сохранить выбор.');};
  const title=page==='home'?'Обзор':page==='glossary'?'Финансовый словарь':page==='guide'?'Как играть':page==='results'?'Мой результат':'Моя стратегия';

  return <div className="app-shell">
    <aside id="app-navigation" ref={sidebar} role={mobile?'dialog':undefined} aria-modal={mobile?true:undefined} aria-label="Основная навигация" className={'sidebar '+(mobile?'sidebar-open':'')}>
      <button className="brand" onClick={()=>nav('home')} aria-label="на себе — главная"><img className="brand-mark" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSI+PHRpdGxlPtC90LAg0YHQtdCx0LU8L3RpdGxlPjxyZWN0IHg9IjgiIHk9IjEyIiB3aWR0aD0iMTQiIGhlaWdodD0iNDAiIHJ4PSI0IiBmaWxsPSIjMTMyZDUwIj48L3JlY3Q+PHJlY3QgeD0iNDIiIHk9IjEyIiB3aWR0aD0iMTQiIGhlaWdodD0iNDAiIHJ4PSI0IiBmaWxsPSIjMTMyZDUwIj48L3JlY3Q+PHBhdGggZD0iTTIyIDQyIEwyMiAzMCBMNDIgMjAgTDQyIDMyIFoiIGZpbGw9IiMyNzVmY2UiPjwvcGF0aD48Y2lyY2xlIGN4PSI0OSIgY3k9IjE5IiByPSI1IiBmaWxsPSIjZDZmNTgwIj48L2NpcmNsZT48L3N2Zz4K" alt="" width="40" height="40"/><span>на себе</span></button>
      <button className="sidebar-close icon-button" onClick={()=>setMobile(false)} aria-label="Закрыть меню"><X size={22}/></button>
      <span className="nav-caption">ТВОЁ ПРОСТРАНСТВО</span>
      <nav className="primary-nav">{[
        {id:'home' as Page,label:'Обзор',icon:LayoutDashboard},{id:'play' as Page,label:'Моя стратегия',icon:Flag},
        {id:'glossary' as Page,label:'Словарь',icon:BookOpen},{id:'guide' as Page,label:'Как играть',icon:GraduationCap},
      ].map(({id,label,icon:Icon})=><button key={id} aria-current={(page===id||id==='play'&&page==='results')?'page':undefined} className={(page===id||id==='play'&&page==='results')?'active':''} onClick={()=>id==='play'?resume():nav(id)}>
        <Icon size={19}/><span>{label}</span>{id==='play'&&solo&&<span className="nav-count">{Math.min(solo.month+1,12)}</span>}
      </button>)}</nav>
      <div className="sidebar-class"><div className="sidebar-class-icon"><Flag size={22}/></div><b>Твой год —<br/>твои решения</b><p>Выбирай свой темп.<br/>Возвращайся к стратегии.</p><button onClick={resume}>{solo?'Продолжить игру':'Начать свой год'}<ArrowRight size={16}/></button></div>
      <button className="sidebar-new-game button secondary" onClick={()=>configure()}><Plus size={17}/>Новая игра</button>
    </aside>
    {mobile&&<button className="sidebar-overlay" aria-label="Закрыть меню" onClick={()=>setMobile(false)}/>}
    <div className="workspace">
      <header className="topbar">
        <button className="mobile-brand" onClick={()=>nav('home')} aria-label="на себе — главная"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSI+PHRpdGxlPtC90LAg0YHQtdCx0LU8L3RpdGxlPjxyZWN0IHg9IjgiIHk9IjEyIiB3aWR0aD0iMTQiIGhlaWdodD0iNDAiIHJ4PSI0IiBmaWxsPSIjMTMyZDUwIj48L3JlY3Q+PHJlY3QgeD0iNDIiIHk9IjEyIiB3aWR0aD0iMTQiIGhlaWdodD0iNDAiIHJ4PSI0IiBmaWxsPSIjMTMyZDUwIj48L3JlY3Q+PHBhdGggZD0iTTIyIDQyIEwyMiAzMCBMNDIgMjAgTDQyIDMyIFoiIGZpbGw9IiMyNzVmY2UiPjwvcGF0aD48Y2lyY2xlIGN4PSI0OSIgY3k9IjE5IiByPSI1IiBmaWxsPSIjZDZmNTgwIj48L2NpcmNsZT48L3N2Zz4K" alt="" width="32" height="32"/><span>на себе</span></button>
        <nav className="desktop-nav" aria-label="Навигация сайта">{[
          {id:'home' as Page,label:'Главная'}, {id:'play' as Page,label:'Моя игра'}, {id:'guide' as Page,label:'Как играть'}, {id:'glossary' as Page,label:'Словарь'},
        ].map(({id,label})=><button key={id} aria-current={(page===id||id==='play'&&page==='results')?'page':undefined} onClick={()=>id==='play'?resume():nav(id)}>{label}</button>)}</nav>
        <div className="topbar-right"><span className="simulation-tag"><span className="status-dot"/>Прогресс на устройстве</span><span className="grade-badge">10—11 класс</span><button className="header-new-game" onClick={()=>configure()} aria-label="Настроить новую игру"><Plus size={17}/><span>Новая игра</span></button></div>
        <button className="mobile-menu icon-button" aria-label="Открыть меню" aria-expanded={mobile} aria-controls="app-navigation" onClick={()=>setMobile(true)}><Menu size={24}/></button>
      </header>
      <main>
        {error&&<div className="alert error" role="alert"><span>{error}</span><button className="icon-button" onClick={()=>setError('')} aria-label="Закрыть ошибку"><X size={16}/></button></div>}
        {page==='home'&&<Home solo={solo} onDifficulty={configure} onSolo={resume} onGuide={()=>nav('guide')} onResults={()=>nav('results')}/>}
        {page==='glossary'&&<Glossary/>}{page==='guide'&&<Guide/>}
        {page==='play'&&solo&&solo.month<12&&<Game key={'solo-'+run+'-'+solo.month+'-'+solo.difficulty} data={solo} situationIds={ensureStorySchedule(solo)[solo.month]} character={solo.character} onCharacter={openCharacter} room={null} pending={null} onCommit={commit} busy={false} online={true} onHistory={()=>nav('results')}/>}
        {(page==='results'||page==='play'&&solo?.month===12)&&solo&&<Results data={solo} onBack={()=>nav('play')} onRestart={()=>setModal('restart')}/>}
        {page==='results'&&!solo&&<div className="empty-state"><Flag size={40}/><h2>Начни свою историю</h2><p>После первого месяца здесь появится разбор твоей стратегии.</p><button className="button primary" onClick={()=>configure()}>Настроить игру<ArrowRight size={18}/></button></div>}
        <footer className="app-footer"><PartnerMark compact/><span>Все суммы, ставки и договоры — игровые.</span></footer>
      </main>
    </div>
    {modal&&<Modal wide={modal==='setup'||modal==='character'} title={modal==='character'?'Твой персонаж':modal==='setup'?'Твой первый год':'Начать новую историю?'} onClose={()=>{setModal(null);setError('');}}>
      {modal==='character'?<div className="change-character"><CharacterPicker value={character} onChange={setCharacter}/><button type="button" className="button primary full" onClick={applyCharacter}>Сохранить персонажа<Check size={17}/></button><p className="character-save-note">Деньги, решения и пройденные месяцы сохранятся.</p></div>:modal==='restart'?<><p className="muted">Новая история заменит текущую игру в этом браузере. Перед началом можно скачать отчёт.</p><div className="modal-actions"><button className="button secondary" onClick={()=>setModal(null)}>Остаться</button><button className="button primary" onClick={()=>configure()}>Новая игра<ArrowRight size={17}/></button></div></>:
      <form onSubmit={start}>
        <p className="modal-intro">Выбери персонажа и цель. Впереди 12 месяцев: в каждом случайно выпадет от 1 до 3 ситуаций из набора 60. За год истории не повторяются.</p>
        {solo&&<div className="alert">Новый старт заменит сохранённую одиночную игру.</div>}
        <CharacterPicker value={character} onChange={setCharacter}/>
        <label className="field">Название твоей стратегии<input value={name} onChange={e=>setName(e.target.value)} maxLength={32} placeholder="Например, Спокойно к своей цели"/></label>
        <label className="field">Цель года<select value={goal} onChange={e=>setGoal(e.target.value as GoalId)}>{Object.entries(GOALS).map(([id,g])=><option key={id} value={id}>{g.name}</option>)}</select><small>{GOALS[goal].description} Учёба от 60, ресурс от 35 и без дефицита в финале.</small></label>
        <DifficultyPicker value={difficulty} onChange={setDifficulty}/>
        <button className="button primary full" disabled={!ready} type="submit">Поехали<ArrowRight size={18}/></button>
      </form>}
    </Modal>}
    {report&&<Modal title={MONTHS[report.month]+': месяц закрыт'} wide onClose={()=>setReport(null)}><ReportView report={report}/><button className="button primary full" onClick={()=>{setReport(null);window.scrollTo({top:0,behavior:'smooth'});}}>{report.month===11?'Посмотреть итог года':'К следующему месяцу'}<ArrowRight size={18}/></button></Modal>}
    {toast&&<div className="toast" role="status"><Check size={18}/>{toast}</div>}
  </div>;
}
