import {
  HOUSING,
  JOBS,
  STUDIES,
  macroFor,
  monthRules,
  planHours,
  rub,
  skillsForWork,
  type DifficultyId,
  type GameState,
  type Plan,
} from '@/lib/game';
import { BookOpen, BriefcaseBusiness, Clock3, Heart, House } from 'lucide-react';
import { Badge, Meter } from './shared';
export function PlanPanel({
  state,
  plan,
  currentHousing,
  month: monthIndex,
  difficulty,
  onChange: updatePlan,
}: {
  state: GameState;
  plan: Plan;
  currentHousing: string;
  month: number;
  difficulty: DifficultyId;
  onChange: <K extends keyof Plan>(key: K, value: Plan[K]) => void;
}) {
  const rules = monthRules(difficulty, monthIndex);
  const monthlyConditions = macroFor(monthIndex, difficulty);
  const hours = planHours(plan, monthIndex);
  return (
    <article className="panel rhythm-panel">
      <div className="section-label">
        <div>
          <span className="eyebrow">
            <span className="section-step">02</span>ПЛАН НА МЕСЯЦ
          </span>
          <h2>Работа, учёба и расходы</h2>
        </div>
        <Badge tone={hours > rules.hours ? 'orange' : ''}>
          <Clock3 size={13} />
          {hours} / {rules.hours} ч
        </Badge>
      </div>
      <div className="planning-row">
        <span className="planning-icon">
          <House size={20} />
        </span>
        <div>
          <b>Где жить</b>
          <small>
            {plan.housing === currentHousing
              ? 'Аренда и время на дорогу'
              : `Переезд после завершения ${monthIndex === 11 ? 'года' : 'месяца'}. Расходы учтены сейчас.`}
          </small>
        </div>
        <select
          aria-label="Жильё"
          value={plan.housing}
          onChange={(e) => updatePlan('housing', e.target.value)}
        >
          {HOUSING.map((housing) => (
            <option key={housing.id} value={housing.id}>
              {housing.name} · {rub(Math.round(housing.cost * monthlyConditions.inflation))}
            </option>
          ))}
        </select>
      </div>
      <div className="planning-row">
        <span className="planning-icon">
          <BriefcaseBusiness size={20} />
        </span>
        <div>
          <b>Как работать</b>
          <small>Каждый навык добавляет 700 ₽ к оплате</small>
        </div>
        <select
          aria-label="Подработка"
          value={plan.job}
          onChange={(e) => updatePlan('job', e.target.value)}
        >
          {JOBS.map((job) => (
            <option key={job.id} value={job.id}>
              {job.name} ·{' '}
              {rub(
                Math.round(
                  (job.income + (job.income ? skillsForWork(state, monthIndex) * 700 : 0)) *
                    (state.energy < 25 ? 0.7 : 1),
                ),
              )}{' '}
              · {job.hours} ч
            </option>
          ))}
        </select>
      </div>
      <div className="planning-row study-row">
        <span className="planning-icon">
          <BookOpen size={20} />
        </span>
        <div>
          <b>Время на учёбу</b>
          <small>Самостоятельная подготовка</small>
        </div>
        <div className="segment-control" role="group" aria-label="Время на самостоятельную учёбу">
          {STUDIES.map((study) => (
            <button
              key={study.hours}
              aria-pressed={plan.study === study.hours}
              className={plan.study === study.hours ? 'active' : ''}
              onClick={() => updatePlan('study', study.hours)}
              title={study.name}
            >
              {study.hours} ч
            </button>
          ))}
        </div>
      </div>
      <div className="leisure-control">
        <div>
          <span className="planning-icon">
            <Heart size={20} />
          </span>
          <div>
            <b>Отдых и личные траты</b>
            <small>Восстанавливают ресурс</small>
          </div>
          <label className="inline-number">
            <input
              aria-label="Расходы на отдых"
              type="number"
              inputMode="numeric"
              value={plan.leisure}
              min={0}
              max={15000}
              step={500}
              onChange={(e) =>
                updatePlan(
                  'leisure',
                  Math.max(0, Math.min(15000, Math.floor(Number(e.target.value) || 0))),
                )
              }
            />
            <span>₽</span>
          </label>
        </div>
        <input
          aria-label="Ползунок расходов на отдых"
          type="range"
          min={0}
          max={15000}
          step={500}
          value={plan.leisure}
          onChange={(e) => updatePlan('leisure', Number(e.target.value))}
        />
        <div className="range-labels">
          <span>0 ₽</span>
          <span>15 000 ₽</span>
        </div>
      </div>
      <div className="time-budget">
        <div>
          <b>Свободное время</b>
          <span className={hours > rules.hours ? 'red-text' : ''}>
            {hours > rules.hours
              ? 'Не хватает ' + (hours - rules.hours) + ' ч'
              : 'Остаётся ' + (rules.hours - hours) + ' ч'}
          </span>
        </div>
        <Meter
          value={(hours / rules.hours) * 100}
          tone={hours > rules.hours ? 'orange' : 'purple'}
        />
        <p>
          {rules.hours} часов после обязательных занятий и сна. Сюда входят дорога, работа,
          самостоятельная учёба, ситуации, развитие и установка покупок для комнаты.
        </p>
      </div>
    </article>
  );
}
