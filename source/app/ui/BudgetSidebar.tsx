import type { Report } from '@/lib/game';
import { GOALS, capital, evaluate, macroFor, percent, rub, type Plan, type Solo } from '@/lib/game';
import {
  ArrowRight,
  ChevronDown,
  Flag,
  GraduationCap,
  Heart,
  Info,
  Landmark,
  Lightbulb,
  LockKeyhole,
  Newspaper,
  TriangleAlert,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Badge, Meter } from './shared';
export function BudgetSidebar({
  data,
  plan,
  report,
  error,
  forecastError,
  canCommit,
  onCommit,
}: {
  data: Solo;
  plan: Plan;
  report: Report | null;
  error: string | null;
  forecastError: string;
  canCommit: boolean;
  onCommit: (plan: Plan) => void;
}) {
  const state = data.state;
  const monthIndex = data.month;
  const monthlyConditions = macroFor(monthIndex, data.difficulty);
  const score = evaluate(state, data.goal, plan, monthIndex, data.difficulty);
  const [showDetails, setShowDetails] = useState(false);
  const income =
    report?.ledger
      .filter((entry) => entry.kind === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0) || 0;
  const expenses =
    report?.ledger
      .filter((entry) => entry.kind === 'expense')
      .reduce((sum, entry) => sum - entry.amount, 0) || 0;
  return (
    <aside className="budget-sidebar">
      <section className="budget-card">
        <div className="budget-heading">
          <span className="budget-icon">
            <Wallet size={19} />
          </span>
          <div>
            <h3>Бюджет месяца</h3>
            <span>Прогноз до принятия решения</span>
          </div>
        </div>
        <div className="budget-lines">
          <div>
            <span>В начале месяца</span>
            <b>{rub(state.cash)}</b>
          </div>
          <div>
            <span>
              <i className="ledger-dot income" />
              Доходы
            </span>
            <b className="green-text">+{rub(income)}</b>
          </div>
          <div>
            <span>
              <i className="ledger-dot expense" />
              Расходы
            </span>
            <b>−{rub(expenses)}</b>
          </div>
          {report?.ledger
            .filter((x) => x.kind === 'transfer')
            .map((x, i) => (
              <div className="transfer-line" key={x.label + i}>
                <span>{x.label}</span>
                <b>
                  {x.amount > 0 ? '+' : '−'}
                  {rub(Math.abs(x.amount))}
                </b>
              </div>
            ))}
        </div>
        <button className="budget-details" onClick={() => setShowDetails(!showDetails)}>
          Все операции
          <ChevronDown size={15} className={showDetails ? 'rotated' : ''} />
        </button>
        {showDetails && report && (
          <div className="forecast-ledger">
            {report.ledger.map((l, i) => (
              <div key={l.label + i}>
                <span>{l.label}</span>
                <b>
                  {l.amount > 0 ? '+' : ''}
                  {rub(l.amount)}
                </b>
              </div>
            ))}
          </div>
        )}
        <div className="budget-total">
          <span>Останется на руках</span>
          <strong className={report && report.after.cash < 0 ? 'red-text' : ''}>
            {report ? rub(report.after.cash) : '—'}
          </strong>
          <small>Скрытые последствия ситуаций не включены.</small>
        </div>
        {(error || forecastError) && (
          <div
            className={/^Выбери решение/.test(error || '') ? 'budget-hint' : 'budget-error'}
            role="status"
          >
            {/^Выбери решение/.test(error || '') ? <Info size={17} /> : <TriangleAlert size={17} />}
            {error || forecastError}
          </div>
        )}
        {report && report.after.cash < 0 && (
          <div className="budget-error">
            <TriangleAlert size={17} />
            Появится дефицит. Можно пересмотреть расходы или использовать резерв.
          </div>
        )}
        {data.difficulty === 'hardcore' && report && (
          <p className="budget-hint">
            После месяца: учёба {report.after.education}, ресурс {report.after.energy}.
          </p>
        )}
        {data.difficulty === 'hardcore' &&
          report &&
          (report.after.hardcoreFailures?.length || 0) > (state.hardcoreFailures?.length || 0) && (
            <div className="budget-error" role="alert">
              <TriangleAlert size={17} />
              Этот план нарушит условия хардкора: {report.after.hardcoreFailures?.at(-1)}.
              Пересмотри нагрузку, отдых и бюджет до завершения месяца.
            </div>
          )}
        <button
          className="button primary full"
          disabled={!canCommit}
          onClick={() => onCommit(plan)}
        >
          {'Завершить месяц'}
          <ArrowRight size={18} />
        </button>
        <div className="budget-foot">
          <LockKeyhole size={12} />
          {'Решение сохранится в истории'}
        </div>
      </section>{' '}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <span>На руках</span>
            <Wallet size={18} />
          </div>
          <strong className={state.cash < 0 ? 'red-text' : ''}>{rub(state.cash)}</strong>
          <small>Деньги для текущих расходов</small>
        </div>
        <div className="stat-card">
          <div>
            <span>Накопления и фонд</span>
            <Landmark size={18} />
          </div>
          <strong>{rub(state.savings + state.fund)}</strong>
          <small>
            {state.fund > 0 ? `${rub(state.fund)} — в фонде` : 'Резерв на следующие шаги'}
          </small>
        </div>
        <div className="stat-card">
          <div>
            <span>Учёба</span>
            <GraduationCap size={19} />
          </div>
          <strong>
            {state.education}
            <span> / 100</span>
          </strong>
          <div className="stat-bottom">
            <Meter value={state.education} tone="purple" />
            <small>
              Навыки: {state.skills} → +{rub(state.skills * 700)} при подработке
            </small>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <span>Личный ресурс</span>
            <Heart size={18} />
          </div>
          <strong>
            {state.energy}
            <span> / 100</span>
          </strong>
          <div className="stat-bottom">
            <Meter value={state.energy} tone={state.energy < 35 ? 'orange' : 'green'} />
            <small>{state.energy < 35 ? 'Нужен отдых' : 'Есть силы'}</small>
          </div>
        </div>
      </div>
      <section className="panel goal-card">
        <div className="section-label">
          <span className="eyebrow">ТВОЯ ЦЕЛЬ</span>
          <Flag size={17} />
        </div>
        <h3>{GOALS[data.goal].name}</h3>
        <div className="goal-amount">
          <b>{rub(capital(state))}</b>
          <span>/ {rub(GOALS[data.goal].target)}</span>
        </div>
        <Meter value={score.goalProgress} />
        <div className="goal-footer">
          <span>
            {data.goal === 'career' ? `${state.skills} из 4 навыков` : 'Капитал с учётом долгов'}
          </span>
          <b>{score.goalProgress}%</b>
        </div>
        <small>
          {data.difficulty === 'hardcore'
            ? 'Для финала: учёба ≥ 65, ресурс ≥ 45, безопасность ≥ 8, без долгов и нарушений хардкора.'
            : 'Для финала: учёба ≥ 60, ресурс ≥ 35 и отсутствие дефицита.'}
        </small>
      </section>
      <div className="news-strip">
        <span className="news-icon">
          <Newspaper size={18} />
        </span>
        <div>
          <b>{monthlyConditions.title}</b>
          <span>{monthlyConditions.text}</span>
        </div>
        <Badge>Цены: +{percent((monthlyConditions.inflation - 1) * 100)} к старту</Badge>
      </div>
      <div className="sidebar-tip">
        <span>
          <Lightbulb size={17} />
          На что обратить внимание
        </span>
        <p>
          {monthIndex < 4
            ? 'Небольшой платёж может скрывать большую общую стоимость. Сравни все условия.'
            : monthIndex < 8
              ? 'Перед завершением месяца проверь остаток денег и свободных часов.'
              : 'Важен не только итоговый капитал, но и то, с каким запасом сил ты к нему придёшь.'}
        </p>
      </div>
    </aside>
  );
}
