import type { CharacterId } from '@/lib/character';
import { downloadCsv } from '@/lib/csv';
import {
  DEVELOPMENT,
  DIFFICULTIES,
  GOALS,
  HOUSING,
  MONTHS,
  ROOM_ITEMS,
  capital,
  debt,
  evaluate,
  getScenario,
  planScenario,
  replay,
  rub,
  type Solo,
} from '@/lib/game';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  Flag,
  GitBranch,
  History,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { CapitalChart } from './CapitalChart';
import { HardcoreRules } from './HardcoreRules';
import { HistoryList } from './History';
import { FinalRoom } from './PlayerRoom';
import { Badge, Meter } from './shared';
export function Results({
  data,
  onBack,
  onRestart,
}: {
  data: Solo & { character?: CharacterId };
  onBack: () => void;
  onRestart: () => void;
}) {
  const [comparisonMonth, setComparisonMonth] = useState(0);
  const [alternativeChoice, setAlternativeChoice] = useState('');
  const [alternativeResult, setAlternativeResult] = useState<ReturnType<typeof replay> | null>(
    null,
  );
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'history'>('overview');
  const yearComplete = data.month >= 12;
  const stats = evaluate(
    data.state,
    data.goal,
    data.plans.at(-1),
    Math.max(0, data.month - 1),
    data.difficulty,
  );
  const compareChoice = () => {
    try {
      setAlternativeResult(
        replay(data.reports, comparisonMonth, alternativeChoice, data.goal, data.difficulty),
      );
      setError('');
    } catch (e) {
      setAlternativeResult(null);
      setError(e instanceof Error ? e.message : 'Этот вариант требует другого плана времени.');
    }
  };
  const exportReport = () =>
    downloadCsv('na-sebe-report.csv', [
      ['Сложность', DIFFICULTIES[data.difficulty].name],
      [],
      [
        'Месяц',
        'Решение',
        'Деньги на руках',
        'Накопления',
        'Фонд',
        'Долг',
        'Капитал',
        'Учёба',
        'Ресурс',
        'Навыки',
        'Баллы',
        'Жильё',
        'Покупки в комнату',
        'Вещи из ситуаций',
        'Помощь комнаты: учёба',
        'Помощь комнаты: ресурс',
        'Развитие',
        'Навыки от развития',
      ],
      ...data.reports.map((report) => [
        MONTHS[report.month],
        [
          planScenario(report.plan, report.month).options.find(
            (option) => option.id === report.plan.choice,
          )?.title,
          ...(report.extras || []).map(
            (e) => getScenario(e.scenario)?.options.find((option) => option.id === e.choice)?.title,
          ),
        ]
          .filter(Boolean)
          .join(' / '),
        report.after.cash,
        report.after.savings,
        report.after.fund,
        debt(report.after),
        capital(report.after),
        report.after.education,
        report.after.energy,
        report.after.skills,
        report.score,
        HOUSING.find((h) => h.id === report.plan.housing)?.name || '',
        (report.room?.purchased || []).map((id) => ROOM_ITEMS[id].name).join(' / '),
        (report.room?.gifted || []).map((id) => ROOM_ITEMS[id].name).join(' / '),
        report.room?.education || 0,
        report.room?.energy || 0,
        report.development ? DEVELOPMENT[report.development.action].name : '',
        report.development?.skillsGained || 0,
      ]),
    ]);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {yearComplete ? 'ТВОЙ ПЕРВЫЙ ГОД / ИТОГИ' : 'ТВОЯ СТРАТЕГИЯ / ПРОМЕЖУТОЧНЫЙ РЕЗУЛЬТАТ'}
          </span>
          <h1>
            {yearComplete ? 'Итоги года' : 'Промежуточные итоги'}
            <span className="lime-dot">.</span>
          </h1>
          <p>
            {data.name} · {DIFFICULTIES[data.difficulty].name} · {GOALS[data.goal].name} ·{' '}
            {data.month} из 12 месяцев
          </p>
        </div>
        <div className="heading-actions">
          {!yearComplete && (
            <button className="button secondary" onClick={onBack}>
              <ArrowLeft size={16} />К игре
            </button>
          )}
          <button
            className="button secondary"
            disabled={!data.reports.length}
            onClick={exportReport}
          >
            <Download size={16} />
            Отчёт
          </button>
        </div>
      </div>
      <div className="tab-bar">
        <button className={tab === 'overview' ? 'selected' : ''} onClick={() => setTab('overview')}>
          <Flag size={17} />
          Мой результат
        </button>
        <button className={tab === 'history' ? 'selected' : ''} onClick={() => setTab('history')}>
          <History size={17} />
          Вся история
        </button>
      </div>
      {tab === 'history' ? (
        <HistoryList reports={data.reports} />
      ) : (
        <>
          <section className="results-hero">
            <div>
              <Badge tone="green">
                {yearComplete
                  ? stats.achieved
                    ? 'Цель достигнута'
                    : 'Год завершён'
                  : 'История продолжается'}
              </Badge>
              <h2>
                {stats.total >= 80
                  ? 'Высокий результат'
                  : stats.total >= 60
                    ? 'Есть что улучшить'
                    : 'План стоит пересмотреть'}
              </h2>
              <p>
                {yearComplete
                  ? 'Посмотри, какие решения помогли, а какие потребовали пересмотра.'
                  : 'Это промежуточные баллы. Дальнейшие решения ещё изменят результат.'}
              </p>
              <div className="results-main-values">
                <div>
                  <span>Твой капитал</span>
                  <b>{rub(capital(data.state))}</b>
                </div>
                <div>
                  <span>Чистый запас базовых расходов</span>
                  <b>{stats.reserveMonths.toFixed(1)} мес.</b>
                </div>
              </div>
            </div>
            <div className="score-circle">
              <svg viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="67" fill="none" stroke="#38506d" strokeWidth="10" />
                <circle
                  cx="80"
                  cy="80"
                  r="67"
                  fill="none"
                  stroke="#d6f67c"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(stats.total / 100) * 421} 421`}
                  transform="rotate(-90 80 80)"
                />
              </svg>
              <div>
                <strong>{stats.total}</strong>
                <span>из 100 баллов</span>
              </div>
            </div>
          </section>
          <div className="results-grid">
            <section className="panel score-parts">
              <h2>Из чего сложился результат</h2>
              {stats.parts.map((p) => (
                <div key={p.name}>
                  <div>
                    <span>{p.name}</span>
                    <b>
                      {p.value}
                      <small> / {p.max}</small>
                    </b>
                  </div>
                  <Meter value={(p.value / p.max) * 100} />
                </div>
              ))}
            </section>
            <section className="panel results-goal">
              <Flag size={26} />
              <span className="eyebrow">{GOALS[data.goal].name}</span>
              <h2>
                {stats.goalProgress}%<span> пути к цели</span>
              </h2>
              <Meter value={stats.goalProgress} />
              <div className="goal-checks">
                {[
                  {
                    ok: capital(data.state) >= GOALS[data.goal].target,
                    text: `Капитал от ${rub(GOALS[data.goal].target)}`,
                  },
                  {
                    ok: data.state.education >= (data.difficulty === 'hardcore' ? 65 : 60),
                    text: `Учёба от ${data.difficulty === 'hardcore' ? 65 : 60} баллов`,
                  },
                  {
                    ok: data.state.energy >= (data.difficulty === 'hardcore' ? 45 : 35),
                    text: `Ресурс от ${data.difficulty === 'hardcore' ? 45 : 35} баллов`,
                  },
                  { ok: data.state.cash >= 0, text: 'Без дефицита на финише' },
                  ...(data.difficulty === 'hardcore'
                    ? [
                        {
                          ok: !data.state.hardcoreFailures?.length && data.state.deficits === 0,
                          text: 'Ни одного критического месяца',
                        },
                        {
                          ok:
                            debt(data.state) < 0.01 &&
                            !data.state.pending.some((event) => (event.cash || 0) < 0),
                          text: 'Без долгов и будущих платежей',
                        },
                        { ok: stats.reserveMonths >= 1, text: 'Резерв от одного месяца' },
                        { ok: data.state.safety >= 8, text: 'Безопасность от 8' },
                      ]
                    : []),
                  ...(data.goal === 'career'
                    ? [{ ok: data.state.skills >= 4, text: 'Не меньше 4 навыков' }]
                    : []),
                ].map((x, i) => (
                  <div key={i} className={x.ok ? 'checked' : ''}>
                    <span>{x.ok ? <Check size={12} /> : <span />}</span>
                    {x.text}
                  </div>
                ))}
              </div>
            </section>
          </div>
          {data.difficulty === 'hardcore' && (
            <HardcoreRules state={data.state} month={Math.min(11, data.month)} />
          )}
          <section className="panel">
            <div className="section-label">
              <h2>Капитал по месяцам</h2>
              <Badge>{data.month} месяцев</Badge>
            </div>
            <CapitalChart
              reports={data.reports}
              alternative={alternativeResult?.reports}
              difficulty={data.difficulty}
            />
          </section>
          {yearComplete && (
            <FinalRoom
              state={data.state}
              housing={data.plans.at(-1)?.housing || 'dorm'}
              character={data.character || 'boy'}
            />
          )}
          {data.reports.length > 0 && (
            <section className="panel counterfactual">
              <div className="section-label">
                <div>
                  <span className="eyebrow">
                    <GitBranch size={15} />
                    СРАВНЕНИЕ РЕШЕНИЙ
                  </span>
                  <h2>А что, если решить иначе?</h2>
                </div>
                <RotateCcw size={24} />
              </div>
              <p>
                Измени решение в первой ситуации выбранного месяца. Остальные ситуации, события
                рынка и планы останутся теми же. Если денег на последующие переводы не хватит, они
                сократятся; потребуется больше времени или покупка окажется повторной после другого
                решения — сравнение остановится с пояснением.
              </p>
              <div className="counter-controls">
                <label className="field">
                  Какой месяц
                  <select
                    value={comparisonMonth}
                    onChange={(e) => {
                      setComparisonMonth(Number(e.target.value));
                      setAlternativeChoice('');
                      setAlternativeResult(null);
                      setError('');
                    }}
                  >
                    {data.reports.map((report) => (
                      <option key={report.month} value={report.month}>
                        {MONTHS[report.month]} — {planScenario(report.plan, report.month).title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Что попробовать
                  <select
                    value={alternativeChoice}
                    onChange={(e) => {
                      setAlternativeChoice(e.target.value);
                      setAlternativeResult(null);
                      setError('');
                    }}
                  >
                    <option value="">Выбери другой вариант</option>
                    {planScenario(data.reports[comparisonMonth].plan, comparisonMonth)
                      .options.filter(
                        (option) => option.id !== data.reports[comparisonMonth]?.plan.choice,
                      )
                      .map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.title}
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  className="button primary"
                  disabled={!alternativeChoice}
                  onClick={compareChoice}
                >
                  Сравнить
                  <ArrowUpRight size={17} />
                </button>
              </div>
              {error && (
                <div className="alert orange">
                  <TriangleAlert size={17} />
                  {error}
                </div>
              )}
              {alternativeResult && (
                <>
                  <div className="comparison-results">
                    <div>
                      <span>Твой исходный капитал</span>
                      <b>{rub(capital(data.state))}</b>
                      <small>
                        Учёба {data.state.education} · ресурс {data.state.energy}
                      </small>
                    </div>
                    <ArrowRight size={22} />
                    <div>
                      <span>При другом решении</span>
                      <b>{rub(capital(alternativeResult.state))}</b>
                      <small>
                        Учёба {alternativeResult.state.education} · ресурс{' '}
                        {alternativeResult.state.energy}
                      </small>
                    </div>
                    <div className="comparison-delta">
                      <span>Разница капитала</span>
                      <b
                        className={
                          capital(alternativeResult.state) >= capital(data.state)
                            ? 'green-text'
                            : 'red-text'
                        }
                      >
                        {capital(alternativeResult.state) > capital(data.state) ? '+' : ''}
                        {rub(capital(alternativeResult.state) - capital(data.state))}
                      </b>
                      <small>
                        {alternativeResult.trimmed
                          ? `Переводы скорректированы на ${rub(alternativeResult.trimmed)}`
                          : 'Остальные денежные планы сохранены'}
                      </small>
                    </div>
                  </div>
                  <p className="soft-note">
                    Пересчитано только одно решение при фиксированных внешних событиях.
                  </p>
                </>
              )}
            </section>
          )}
          {yearComplete && (
            <div className="restart-row">
              <p>Можно начать заново с другой целью или сложностью.</p>
              <button className="button primary" onClick={onRestart}>
                Начать новую игру
                <ArrowUpRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
