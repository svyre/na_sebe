import {
  CARS,
  PROJECTS,
  businessMonth,
  businessValue,
  campaignMonths,
  campaignYears,
  capital,
  depositValue,
  macroFor,
  monthLabel,
  monthRules,
  planHours,
  projectError,
  rub,
  transportHours,
  type DifficultyId,
  type GameState,
  type Plan,
  type ProjectAction,
  type Report,
} from '@/lib/game';
import { StoryObject } from './StoryObjects';
import { Numeric } from './shared';

export function ProjectsPanel({
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
  onChange: <K extends keyof Plan>(key: K, value: Plan[K]) => void;
}) {
  const business = businessMonth(state, month, difficulty);
  const actions: ProjectAction[] = state.business
    ? state.business.paused
      ? ['resume', 'close']
      : state.business.level === 1
        ? ['expand', 'pause', 'close']
        : ['pause', 'close']
    : state.pilotDone
      ? ['launch']
      : ['pilot'];
  const car = state.car ? CARS[state.car.model] : null;
  return (
    <div className="projects-panel">
      <section className="panel project-business">
        <div className="project-heading">
          <div>
            <h2>Своё дело</h2>
            <p>Небольшой сервис для местных компаний. Ты продаёшь услуги и отвечаешь за расходы.</p>
          </div>
          <svg viewBox="0 0 180 130" aria-hidden="true">
            <StoryObject kind="portfolio" />
          </svg>
        </div>
        {state.business ? (
          <>
            <p>
              {state.business.level === 1 ? 'Небольшой сервис' : 'Расширенный сервис'}
              {state.business.paused ? ' · на паузе' : ' · работает'}
            </p>
            <dl className="project-numbers">
              <div>
                <dt>Выручка в этом месяце</dt>
                <dd>{rub(business.revenue)}</dd>
              </div>
              <div>
                <dt>Расходы</dt>
                <dd>{rub(business.cost)}</dd>
              </div>
              <div>
                <dt>Твоя работа</dt>
                <dd>
                  {business.hours} ч, ресурс −{business.energy}
                </dd>
              </div>
            </dl>
            <p className="project-note">
              Выручка меняется по сезону, расходы растут вместе с ценами. Клиентские ситуации могут
              добавить заказы или расходы.
            </p>
          </>
        ) : (
          <p>
            {state.pilotDone
              ? 'Идея проверена. Для запуска нужны 3 навыка, 40 000 ₽ и 24 часа.'
              : 'Сначала проверь спрос: 6 000 ₽ и 12 часов. Если решишь запускать сервис, понадобятся ещё 40 000 ₽ и 3 навыка.'}
          </p>
        )}
        <fieldset className="project-options">
          <legend>Действие на этот месяц</legend>
          <label>
            <input
              type="radio"
              name="project"
              value="none"
              checked={!plan.project || plan.project === 'none'}
              onChange={() => onChange('project', 'none')}
            />
            <span>Без изменений</span>
          </label>
          {actions.map((id) => {
            const item = PROJECTS[id],
              reason = projectError(
                { ...plan, project: id, carAction: 'keep', termDeposit: 0 },
                state,
                month,
              );
            return (
              <label key={id} className={reason ? 'unavailable' : ''}>
                <input
                  type="radio"
                  name="project"
                  value={id}
                  checked={plan.project === id}
                  disabled={!!reason}
                  onChange={() => onChange('project', id)}
                />
                <span>
                  <b>{item.name}</b>
                  <small>
                    {item.cost ? `${rub(item.cost)} · ` : ''}
                    {item.hours} ч{item.energy ? ` · ресурс −${item.energy}` : ''}
                    {id === 'close' ? ` · возврат ${rub(businessValue(state))}` : ''}
                  </small>
                  {reason && <small>{reason}</small>}
                </span>
              </label>
            );
          })}
        </fieldset>
        <p className="project-note">
          Запуск, расширение и пауза действуют со следующего месяца. Текущие выручка, расходы и часы
          уже учтены в плане. При закрытии вернётся стоимость оборудования, а не вся сумма вложений.
        </p>
      </section>
      <section className="panel project-car">
        <div className="project-heading">
          <div>
            <h2>Машина</h2>
            <p>
              {car
                ? car.name
                : 'Покупка уменьшает доступный запас. После неё каждый месяц нужны деньги на содержание.'}
            </p>
          </div>
          <svg viewBox="0 0 180 130" aria-hidden="true">
            <StoryObject kind="car" />
          </svg>
        </div>
        {car && state.car && (
          <dl className="project-numbers">
            <div>
              <dt>Цена продажи в конце месяца</dt>
              <dd>{rub(Math.round(state.car.value * 0.99 * 100) / 100)}</dd>
            </div>
            <div>
              <dt>Расходы в этом месяце</dt>
              <dd>{rub(Math.round(car.monthly * macroFor(month, difficulty).inflation))}</dd>
            </div>
            <div>
              <dt>Дорога в плане</dt>
              <dd>{transportHours(plan, state)} ч</dd>
            </div>
          </dl>
        )}
        <label className="field">
          План на машину
          <select
            aria-label="План на машину"
            value={plan.carAction || 'keep'}
            onChange={(e) => onChange('carAction', e.target.value as Plan['carAction'])}
          >
            <option value="keep">{car ? 'Оставить машину' : 'Не покупать'}</option>
            {car ? (
              <option value="sell">Продать в конце месяца · 4 ч</option>
            ) : (
              Object.entries(CARS).map(([id, item]) => (
                <option key={id} value={id}>
                  {item.name} · {rub(item.cost)} · 6 ч
                </option>
              ))
            )}
          </select>
        </label>
        {!car && (
          <div className="car-comparison">
            {Object.entries(CARS).map(([id, item]) => (
              <div key={id}>
                <b>{item.name}</b>
                <span>{rub(item.cost)} при покупке</span>
                <span>
                  {rub(Math.round(item.monthly * macroFor(month + 1, difficulty).inflation))} в
                  месяц по ценам следующего месяца
                </span>
                <span>До {item.hoursSaved} ч меньше на дорогу</span>
              </div>
            ))}
          </div>
        )}
        <p className="project-note">
          Топливо, страховка и обслуживание заменяют обычную оплату транспорта. Время в пути не
          может стать отрицательным. Машина дешевеет на 1% каждый месяц. После покупки её расчётная
          цена уже ниже уплаченной суммы.
        </p>
        {(plan.carAction === 'compact' || plan.carAction === 'family') && (
          <p className="project-selected">
            Покупка в конце месяца. Машина появится{' '}
            {month + 1 < campaignMonths(state)
              ? monthLabel(month + 1).toLowerCase()
              : 'после завершения игры'}
            .
          </p>
        )}
      </section>
      <p className="project-total">
        Весь план: {planHours(plan, month, state)} из {monthRules(difficulty, month).hours} ч.
        Деньги на проекты списываются при завершении месяца; пополнение накоплений считается после
        них.
      </p>
    </div>
  );
}

export function TermDeposits({
  state,
  plan,
  month,
  onChange,
}: {
  state: GameState;
  plan: Plan;
  month: number;
  onChange: (amount: number) => void;
}) {
  return (
    <section className="panel term-deposits">
      <h2>Срочный вклад</h2>
      <p>
        14% годовых на 6 месяцев с ежемесячным начислением процентов. Деньги нельзя снять раньше
        срока. Возврат с процентами произойдёт автоматически.
      </p>
      <Numeric
        label="Открыть вклад на сумму"
        value={plan.termDeposit || 0}
        onChange={onChange}
        max={1000000}
        step={1000}
        hint="От 10 000 ₽. 0 ₽ — не открывать новый вклад."
      />
      {!!plan.termDeposit && (
        <p>
          Возврат:{' '}
          {month + 6 < campaignMonths(state)
            ? monthLabel(month + 6, true)
            : 'после завершения прохождения'}
          . До этого сумма остаётся в капитале, но недоступна для расходов.
        </p>
      )}
      {!!state.deposits?.length && (
        <div className="deposits-list">
          {state.deposits.map((deposit, i) => (
            <div key={`${deposit.due}-${i}`}>
              <span>
                {rub(deposit.value)}
                <small>Внесено {rub(deposit.principal)}</small>
              </span>
              <span>
                {deposit.due <= month
                  ? 'Возврат в этом месяце'
                  : deposit.due < campaignMonths(state)
                    ? monthLabel(deposit.due, true)
                    : 'После завершения игры'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AssetsOverview({ state }: { state: GameState }) {
  if (!state.car && !state.business && !state.deposits?.length) return null;
  return (
    <section className="panel assets-overview">
      <h2>Что у тебя есть</h2>
      {state.car && (
        <p>
          {CARS[state.car.model].name}: расчётная цена продажи {rub(state.car.value)}.
        </p>
      )}
      {state.business && (
        <p>
          Своё дело: {state.business.paused ? 'на паузе' : 'работает'}, оборудование{' '}
          {rub(businessValue(state))}.
        </p>
      )}
      {!!state.deposits?.length && (
        <p>
          Срочные вклады: {rub(depositValue(state))}. Возврат привязан к сроку, сумма не входит в
          доступный резерв.
        </p>
      )}
    </section>
  );
}
export function ProjectSummary({ report }: { report: Report }) {
  const changedProject = report.plan.project && report.plan.project !== 'none';
  const changedCar = report.plan.carAction && report.plan.carAction !== 'keep';
  if (
    !report.assets ||
    (!report.before.car &&
      !report.before.business &&
      !report.before.deposits?.length &&
      !changedProject &&
      !changedCar &&
      !report.plan.termDeposit)
  )
    return null;
  const { assets, plan } = report;
  return (
    <section className="development-summary project-summary">
      <h4>Проекты и имущество</h4>
      {plan.project && plan.project !== 'none' && (
        <p>
          {PROJECTS[plan.project].name}.{' '}
          {plan.project === 'close' ? 'Дело закрыто.' : 'Изменение учтено на следующий месяц.'}
        </p>
      )}
      {report.before.business && (
        <p>
          Результат своего дела после обычных расходов: {rub(assets.businessNet)}. Работа:{' '}
          {assets.businessHours} ч. Дополнительные клиентские ситуации показаны отдельно.
        </p>
      )}
      {report.before.car && (
        <p>
          Содержание машины: {rub(assets.carCost)}. Снижение стоимости: {rub(assets.depreciation)}.
        </p>
      )}
      {plan.carAction && plan.carAction !== 'keep' && (
        <p>
          {plan.carAction === 'sell'
            ? 'Машина продана по цене после месячного снижения стоимости.'
            : 'Машина куплена. Содержание и экономия времени начнутся со следующего месяца.'}
        </p>
      )}
      {!!plan.termDeposit && <p>На срочный вклад отправлено {rub(plan.termDeposit)}.</p>}
      {!!assets.depositInterest && (
        <p>Начислено процентов по срочным вкладам: {rub(assets.depositInterest)}.</p>
      )}
    </section>
  );
}
export function AnnualReview({ report }: { report: Report }) {
  const year = Math.floor(report.month / 12) + 1;
  return (
    <section className="annual-review">
      <h3>Год {year} завершён</h3>
      <dl>
        <div>
          <dt>Капитал</dt>
          <dd>{rub(capital(report.after))}</dd>
        </div>
        <div>
          <dt>Навыки</dt>
          <dd>{report.after.skills}</dd>
        </div>
        <div>
          <dt>Учёба / ресурс</dt>
          <dd>
            {report.after.education} / {report.after.energy}
          </dd>
        </div>
      </dl>
      {year < campaignYears(report.after) ? (
        <p>
          Впереди год {year + 1}. Поддержка семьи уменьшится, цены продолжат расти.{' '}
          {year === 1
            ? 'Откроются проекты, машина и срочные вклады. Четыре навыка дают доступ к работе по специальности.'
            : 'Ситуации станут сложнее: крупные заказы, вложения и долгие обязательства.'}
        </p>
      ) : (
        <p>Все месяцы пройдены. Подробные итоги и сравнение решений — на экране результатов.</p>
      )}
    </section>
  );
}
