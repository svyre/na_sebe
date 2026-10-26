import {
  MACRO,
  MONTHS,
  OFFERS,
  SHORT_MONTHS,
  creditQuote,
  debt,
  macroFor,
  percent,
  rub,
  type DifficultyId,
  type GameState,
  type Plan,
} from '@/lib/game';
import { Banknote, Check, Info, Landmark, ShieldCheck, TrendingUp } from 'lucide-react';
import { BankIdentity } from './BankIdentity';
import { Badge, Numeric } from './shared';

export function BankPanel({
  state,
  plan,
  onChange: updatePlan,
  month,
  difficulty,
}: {
  state: GameState;
  plan: Plan;
  onChange: <K extends keyof Plan>(k: K, v: Plan[K]) => void;
  month: number;
  difficulty: DifficultyId;
}) {
  const comparisonAmount = plan.borrow || 20000;
  return (
    <>
      <BankIdentity cash={state.cash} savings={state.savings} />
      <section className="panel bank-account">
        <div className="section-label">
          <span className="account-symbol green-bg">
            <Landmark size={22} />
          </span>
          <Badge tone="green">{MACRO[month].savingsRate}% годовых · учебная ставка</Badge>
        </div>
        <span className="eyebrow">НАКОПИТЕЛЬНЫЙ СЧЁТ</span>
        <h2>{rub(state.savings)}</h2>
        <p>
          Резерв с доступом к деньгам. Процент начисляется ежемесячно на входящий остаток. Новое
          пополнение работает со следующего месяца.
        </p>
        <div className="bank-input-grid">
          <Numeric
            label="Пополнить в этом месяце"
            value={plan.save}
            onChange={(v) => updatePlan('save', v)}
            max={500000}
          />
          <Numeric
            label="Снять со счёта"
            value={plan.withdraw}
            onChange={(v) => updatePlan('withdraw', v)}
            max={Math.floor(state.savings)}
          />
        </div>
      </section>
      <section className="panel bank-account">
        <div className="section-label">
          <span className="account-symbol purple-bg">
            <TrendingUp size={22} />
          </span>
          <Badge tone="purple">Стоимость может снизиться</Badge>
        </div>
        <span className="eyebrow">УЧЕБНЫЙ ИНДЕКСНЫЙ ФОНД</span>
        <h2>{rub(state.fund)}</h2>
        <p>
          Вложение с изменяющейся стоимостью. Доход не гарантирован. Новые покупки начинают
          участвовать в изменении цены со следующего месяца.
        </p>
        <div className="market-history">
          <span>Известная история изменения цены</span>
          <div>
            {month === 0 ? (
              <small>Первый месяц. Истории пока нет.</small>
            ) : (
              MACRO.slice(0, month).map((_, i) => {
                const x = macroFor(i, difficulty);
                return (
                  <span key={i} className={x.market < 0 ? 'negative' : 'positive'}>
                    {SHORT_MONTHS[i]}
                    <b>
                      {x.market > 0 ? '+' : ''}
                      {percent(x.market)}
                    </b>
                  </span>
                );
              })
            )}
          </div>
        </div>
        <div className="bank-input-grid">
          <Numeric
            label="Купить долю фонда"
            value={plan.invest}
            onChange={(v) => updatePlan('invest', v)}
            max={500000}
          />
          <Numeric
            label="Продать по известной цене"
            value={plan.sell}
            onChange={(v) => updatePlan('sell', v)}
            max={Math.floor(state.fund)}
          />
        </div>
        <div className="soft-note">
          <Info size={15} />
          <span>
            Продажа идёт по цене начала месяца. События рынка для оставшейся доли раскроются после
            хода.
          </span>
        </div>
      </section>
      <section className="panel credit-panel">
        <div className="section-label">
          <div>
            <span className="eyebrow">СРАВНИ, ПРЕЖДЕ ЧЕМ ВЫБРАТЬ</span>
            <h2>Кредит под лупой</h2>
          </div>
          <Banknote size={24} />
        </div>
        <p className="muted">
          Сравни платежи и комиссии: рекламная ставка — только часть стоимости. Все условия в игре
          вымышлены и не относятся к продуктам банка.
        </p>
        <Numeric
          label="Сколько планируешь получить"
          value={plan.borrow}
          max={Math.min(40000, Math.max(0, Math.floor(90000 - debt(state))))}
          step={1000}
          onChange={(v) => updatePlan('borrow', v)}
          hint="0 ₽ — новый кредит не оформляется. Первый платёж со следующего месяца."
        />
        <div className="comparison-label">
          Сравнение на {rub(comparisonAmount)}{' '}
          {plan.borrow === 0 && (
            <button className="text-button" onClick={() => updatePlan('borrow', 20000)}>
              Добавить в план
              <span aria-hidden="true">+</span>
            </button>
          )}
        </div>
        <div className="credit-offers">
          {OFFERS.map((offer) => {
            const quote = creditQuote(comparisonAmount, offer.id);
            return (
              <label
                key={offer.id}
                className={'credit-offer ' + (plan.offer === offer.id ? 'chosen' : '')}
              >
                <input
                  type="radio"
                  name="credit-offer"
                  checked={plan.offer === offer.id}
                  onChange={() => updatePlan('offer', offer.id)}
                />
                <div>
                  <b>{offer.name}</b>
                  <span className="radio-visual">
                    {plan.offer === offer.id && <Check size={11} />}
                  </span>
                </div>
                <strong>
                  {offer.rate}
                  <span>%</span>
                </strong>
                <small>годовых · {offer.term} мес.</small>
                <dl>
                  <div>
                    <dt>В месяц</dt>
                    <dd>{rub(quote.payment)}</dd>
                  </div>
                  <div>
                    <dt>Разовая комиссия</dt>
                    <dd>{rub(offer.fee)}</dd>
                  </div>
                  <div>
                    <dt>Сервис в месяц</dt>
                    <dd>{rub(offer.monthlyFee)}</dd>
                  </div>
                </dl>
                <div className="credit-total">
                  <span>Всего вернёшь</span>
                  <b>{rub(quote.total)}</b>
                  <small>Сверх суммы кредита: {rub(quote.overpay)}</small>
                </div>
              </label>
            );
          })}
        </div>
        <div className="soft-note">
          <ShieldCheck size={15} />
          <span>
            Платёж рассчитан по аннуитетной формуле. Копеечное округление корректируется последним
            платежом. После августа оставшийся долг сохраняется в итогах.
          </span>
        </div>
      </section>
      {state.loans.length > 0 && (
        <section className="panel">
          <div className="section-label">
            <h2>Твои обязательства</h2>
            <Badge tone="orange">{rub(debt(state))}</Badge>
          </div>
          {state.loans.map((l) => (
            <div className="loan-row" key={l.id}>
              <div>
                <b>{l.name}</b>
                <small>
                  Ещё {l.remaining} платежей · {l.rate}% годовых
                </small>
              </div>
              <div>
                <b>{rub(l.payment + l.monthlyFee)} / мес.</b>
                <small>Остаток: {rub(l.balance)}</small>
              </div>
            </div>
          ))}
        </section>
      )}
      {state.pending.length > 0 && (
        <section className="panel">
          <h3>Уже запланировано</h3>
          {state.pending.map((p, i) => (
            <div className="loan-row" key={i}>
              <div>
                <b>{p.title}</b>
                <small>{MONTHS[p.due] || 'После конца игры'}</small>
              </div>
              <b>{p.cash ? rub(p.cash) : `+${p.skills} навык`}</b>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
