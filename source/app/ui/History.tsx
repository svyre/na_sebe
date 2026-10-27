import {
  monthLabel,
  campaignYears,
  debt,
  getScenario,
  planScenario,
  rub,
  type Report,
} from '@/lib/game';
import { ChevronDown, History, Lightbulb, TriangleAlert } from 'lucide-react';
import type { StoryRecord } from '@/lib/narrative';
import { StoryRecap } from './MonthStory';
import { MonthlyReview } from './MonthlyReview';
import { Empty } from './shared';

export function ReportView({ report: r, story }: { report: Report; story?: StoryRecord }) {
  return (
    <div className="report-view">
      <div className="report-summary">
        <div>
          <span>На руках</span>
          <b>{rub(r.after.cash)}</b>
        </div>
        <div>
          <span>Капитал за месяц</span>
          <b className={r.net >= 0 ? 'green-text' : 'red-text'}>
            {r.net > 0 ? '+' : ''}
            {rub(r.net)}
          </b>
        </div>
        <div>
          <span>Учёба / ресурс</span>
          <b>
            {r.after.education} / {r.after.energy}
          </b>
        </div>
      </div>
      <div className="report-explanation">
        <Lightbulb size={23} />
        <div>
          <b>{planScenario(r.plan, r.month).options.find((o) => o.id === r.plan.choice)?.title}</b>
          <p>{r.explanation}</p>
        </div>
      </div>
      {r.extras?.map((event, i) => (
        <div className="report-extra-event" key={event.scenario}>
          <span>
            Ситуация {i + 2}: {getScenario(event.scenario)?.title}
          </span>
          <b>{getScenario(event.scenario)?.options.find((o) => o.id === event.choice)?.title}</b>
          <p>{event.explanation}</p>
        </div>
      ))}
      {r.warnings.map((w, i) => (
        <div className="alert orange" key={i}>
          <TriangleAlert size={17} />
          <span>{w}</span>
        </div>
      ))}
      <StoryRecap record={story} />
      <MonthlyReview report={r} />
      <details className="ledger-details">
        <summary>
          Операции месяца
          <ChevronDown size={16} />
        </summary>
        <div className="report-ledger">
          {r.ledger.map((l, i) => (
            <div key={i}>
              <span>{l.label}</span>
              <b className={l.kind === 'income' ? 'green-text' : ''}>
                {l.amount > 0 ? '+' : ''}
                {rub(l.amount)}
              </b>
            </div>
          ))}
          <div>
            <span>Проценты на счёте</span>
            <b className="green-text">+{rub(r.interest)}</b>
          </div>
          <div>
            <span>Изменение стоимости фонда</span>
            <b className={r.market >= 0 ? 'green-text' : 'red-text'}>
              {r.market > 0 ? '+' : ''}
              {rub(r.market)}
            </b>
          </div>
          <div>
            <span>Остаток кредитов</span>
            <b>{rub(debt(r.after))}</b>
          </div>
        </div>
      </details>
      <div className="discussion-note">
        <span className="eyebrow">ВОПРОС ДЛЯ ОБСУЖДЕНИЯ</span>
        <p>{planScenario(r.plan, r.month).discussion}</p>
      </div>
    </div>
  );
}

export function HistoryList({
  reports,
  journal = [],
}: {
  reports: Report[];
  journal?: StoryRecord[];
}) {
  return reports.length ? (
    <div className="history-list">
      {[...reports].reverse().map((r) => (
        <details className="panel history-item" key={r.month}>
          <summary>
            <span className="history-month">{String(r.month + 1).padStart(2, '0')}</span>
            <div>
              <b>{monthLabel(r.month, campaignYears(r.before) > 1)}</b>
              <small>{planScenario(r.plan, r.month).title}</small>
            </div>
            <span className={r.net >= 0 ? 'green-text' : 'red-text'}>
              {r.net > 0 ? '+' : ''}
              {rub(r.net)}
            </span>
            <ChevronDown size={17} />
          </summary>
          <ReportView report={r} story={journal.find((item) => item.month === r.month)} />
        </details>
      ))}
    </div>
  ) : (
    <div className="panel">
      <Empty icon={History} title="История только начинается">
        Заверши первый месяц — здесь появятся твои решения, все операции и их последствия.
      </Empty>
    </div>
  );
}
