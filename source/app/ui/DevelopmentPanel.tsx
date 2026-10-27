import {
  DEVELOPMENT,
  monthLabel,
  campaignMonths,
  monthRules,
  planHours,
  rub,
  skillsForWork,
  type DevelopmentId,
  type DifficultyId,
  type GameState,
  type Plan,
  type Report,
} from '@/lib/game';
import { BookOpen, BriefcaseBusiness, Clock3, GraduationCap } from 'lucide-react';

const icons = { self: BookOpen, course: GraduationCap, internship: BriefcaseBusiness };

export function DevelopmentPanel({
  state,
  plan,
  month,
  difficulty,
  onChange,
}: {
  state: GameState;
  plan: Plan;
  month: number;
  difficulty: DifficultyId;
  onChange: (id: DevelopmentId) => void;
}) {
  const availableSkills = skillsForWork(state, month);
  const remainingHours = monthRules(difficulty, month).hours - planHours(plan, month, state);
  const progress = state.developmentProgress === 1 ? 1 : 0;
  return (
    <section className="panel development-panel" aria-labelledby="development-title">
      <header className="development-heading">
        <div>
          <h2 id="development-title">Развитие</h2>
          <p>Выбери одно занятие на месяц. Время и расходы войдут в общий план.</p>
        </div>
        <span>
          <Clock3 size={16} />{' '}
          {remainingHours < 0 ? `Не хватает ${-remainingHours}` : `Осталось ${remainingHours}`} ч
        </span>
      </header>
      <div className="development-skills">
        <GraduationCap size={24} />
        <div>
          <b>Навыки: {state.skills}</b>
          <p>+{rub(state.skills * 700)} в месяц при подработке.</p>
          {availableSkills > state.skills && (
            <p>
              К работе в этом месяце: {availableSkills} навыков, +{rub(availableSkills * 700)} к
              оплате.
            </p>
          )}
        </div>
      </div>
      <fieldset className="development-options">
        <legend className="sr-only">Занятие на месяц</legend>
        {(['self', 'course', 'internship'] as const).map((id) => {
          const option = DEVELOPMENT[id];
          const Icon = icons[id];
          return (
            <label
              className={`development-option ${plan.development === id ? 'selected' : ''}`}
              key={id}
            >
              <input
                type="radio"
                name="development"
                value={id}
                checked={plan.development === id}
                onChange={() => onChange(id)}
              />
              <Icon size={24} />
              <div>
                <b>{option.name}</b>
                <p>{option.result}</p>
                {id === 'self' && <small>Пройдено: {progress} из 2 месяцев</small>}
                {id !== 'self' && <small>Навык увеличит оплату со следующего месяца.</small>}
              </div>
              <div className="development-cost">
                <b>
                  {option.cost
                    ? rub(option.cost)
                    : option.income
                      ? `+${rub(option.income)}`
                      : 'Бесплатно'}
                </b>
                <span>
                  {option.hours} ч · ресурс −{option.energy}
                </span>
              </div>
            </label>
          );
        })}
        <label className="development-skip">
          <input
            type="radio"
            name="development"
            value="none"
            checked={!plan.development || plan.development === 'none'}
            onChange={() => onChange('none')}
          />{' '}
          В этом месяце без дополнительных занятий
        </label>
      </fieldset>
      {(plan.development === 'course' ||
        plan.development === 'internship' ||
        (plan.development === 'self' && progress === 1)) && (
        <p className="development-timing">
          Новый навык поможет с оплатой:{' '}
          {month + 1 < campaignMonths(state) ? monthLabel(month + 1) : 'после завершения игры'}.
          Доход текущего месяца за счёт нового навыка не увеличится.
        </p>
      )}
      {state.pending.some((event) => event.development === 'course') && (
        <div className="development-pending">
          <h3>Обучение в процессе</h3>
          {state.pending
            .filter((event) => event.development === 'course')
            .map((event, index) => (
              <p key={`${event.due}-${index}`}>
                Практический курс · +1 навык · завершение:{' '}
                {event.due <= month
                  ? 'в этом месяце'
                  : event.due < campaignMonths(state)
                    ? monthLabel(event.due)
                    : 'после завершения игры'}
              </p>
            ))}
        </div>
      )}
    </section>
  );
}

export function DevelopmentSummary({ report }: { report: Report }) {
  const development = report.development;
  if (!development) return null;
  return (
    <section className="development-summary">
      <h4>Развитие</h4>
      {development.action !== 'none' && (
        <p>
          {DEVELOPMENT[development.action].name}
          {development.action === 'self'
            ? development.selfProgress === 0
              ? ' · цикл завершён'
              : ` · прогресс ${development.selfProgress} из 2`
            : ''}
          .
        </p>
      )}
      {development.action === 'course' && (
        <p>
          Курс оплачен. Завершение:{' '}
          {report.month + 1 < campaignMonths(report.before)
            ? monthLabel(report.month + 1)
            : 'после завершения игры'}
          .
        </p>
      )}
      {development.completedCourses > 0 && (
        <p>
          Завершено курсов: {development.completedCourses}. Их навыки уже учтены в оплате этого
          месяца.
        </p>
      )}
      {development.skillsGained > development.completedCourses && (
        <p>
          Занятия принесли +{development.skillsGained - development.completedCourses} навык. Он
          поможет в подработке со следующего месяца.
        </p>
      )}
      <p>
        Навыки: {report.before.skills} → {report.after.skills}.
      </p>
    </section>
  );
}
