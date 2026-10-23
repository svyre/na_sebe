'use client';
import { ArrowUpRight, CreditCard, Landmark, ShieldCheck } from 'lucide-react';
import { rub } from '@/lib/game';
import { bankLogo } from './bank-brand';

export function BankIdentity({cash,savings}:{cash:number;savings:number}) {
 return <section className="bank-identity" aria-label="Газпромбанк: учебный игровой банк">
  <div className="bank-identity-intro"><img src={bankLogo} alt="Газпромбанк"/><span className="bank-demo-label">Твой учебный банк</span><h2>Деньги под твоим управлением.</h2><p>Здесь твоя игровая карта, резерв и будущие платежи. Попробуй пополнение, снятие и сравнение полной стоимости кредита.</p><div className="bank-balance-note"><ShieldCheck size={18}/><span>Учебная модель. Все ставки и условия вымышлены; реальные счета и переводы не подключены.</span></div></div>
  <div className="gpb-game-card"><img src={bankLogo} alt="Газпромбанк"/><svg className="card-swoosh" viewBox="0 0 360 210" aria-hidden="true"><path d="M66 190C133 154 130 40 229 34h106C225 88 230 169 157 190Z" fill="#e8a45e"/><path d="M66 190C136 161 147 67 225 61h59C229 112 214 177 157 190Z" fill="#a2c8ee"/></svg><span className="card-chip" aria-hidden="true"><i/><i/><i/></span><span className="card-funds-label">Игровые деньги на руках</span><b className="gpb-card-balance">{rub(cash)}</b><div className="card-bottom"><span>на себе</span><span>Учебная карта</span><CreditCard size={20}/></div></div>
  <div className="bank-reserve-overview"><span><Landmark size={18}/>В резерве</span><b>{rub(savings)}</b><small>Резерв хранится отдельно от денег на текущие расходы.</small></div>
 </section>;
}

export function BankStoryBanner({onOpen}:{onOpen:()=>void}) {
 return <button type="button" className="bank-story-banner" onClick={onOpen}>
  <img src={bankLogo} alt="Газпромбанк"/><span><b>Мой учебный банк</b><small>Карта, накопления и финансовые решения</small></span><ArrowUpRight size={19}/>
 </button>;
}
