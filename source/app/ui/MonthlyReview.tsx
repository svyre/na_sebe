import { Check, Compass, Lightbulb, TriangleAlert } from 'lucide-react';
import { MONTHS, type Report } from '@/lib/game';
import { reviewMonth } from '@/lib/month-review';
import { bankLogo } from './bank-brand';

export function MonthlyReview({report:r}:{report:Report}) {
 const review=reviewMonth(r);
 return <section className="monthly-review" aria-label={`Разбор решений: ${MONTHS[r.month]}`}>
  <header className="review-header"><span className="review-badge"><Compass size={22}/></span><div><span>{MONTHS[r.month]} позади</span><h3>Что получилось за этот месяц?</h3></div><span className="review-completed">Глава {r.month+1} / 12</span></header>
  <div className="review-columns"><section className="review-good"><h4><Check size={18}/>Что получилось</h4>{review.good.length?review.good.map(item=><div className="review-item" key={item.title}><span><Check size={13}/></span><div><b>{item.title}</b><p>{item.text}</p></div></div>):<p className="review-empty">Этот месяц дал опыт. Посмотри на последствия выбранного хода и найди, что изменить в следующем плане.</p>}</section>
  <section className="review-improve"><h4><TriangleAlert size={17}/>Что стоит пересмотреть</h4>{review.improve.length?review.improve.map(item=><div className="review-item" key={item.title}><span>!</span><div><b>{item.title}</b><p>{item.text}</p></div></div>):<p className="review-empty">В этом месяце модель не отметила явных рисков. Это не гарантирует будущий результат — продолжай проверять условия.</p>}</section></div>
  <div className="review-next"><Lightbulb size={20}/><div><b>{r.month===11?'Что взять с собой дальше':'Идея на следующий месяц'}</b><p>{review.next}</p></div></div>
  <footer className="review-footer"><img src={bankLogo} alt="Газпромбанк"/><span>Финансовый разбор игровой стратегии.<br/>Последствия зависят от всего плана, а не только от цены покупки.</span></footer>
 </section>;
}
