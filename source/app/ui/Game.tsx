import { CHARACTERS, type CharacterId } from '@/lib/character';
import {
  DIFFICULTIES,
  MONTHS,
  ROOM_ITEMS,
  SHORT_MONTHS,
  defaultPlan,
  getScenario,
  planScenario,
  roomGifts,
  roomInventory,
  rub,
  settle,
  validatePlan,
  type Plan,
  type Solo,
} from '@/lib/game';
import { extraStory } from '@/lib/story-presentation';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Flag,
  History,
  House,
  Landmark,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { BankStoryBanner } from './BankIdentity';
import { BankPanel } from './BankPanel';
import { BudgetSidebar } from './BudgetSidebar';
import { CharacterArt } from './Character';
import { DevelopmentPanel } from './DevelopmentPanel';
import { HardcoreRules } from './HardcoreRules';
import { HistoryList } from './History';
import { PlanPanel } from './PlanPanel';
import { PlayerRoom, RoomShop, type RoomAction } from './PlayerRoom';
import { Badge } from './shared';
import { StoryScene } from './StoryScene';
export function Game({
  data,
  situationIds,
  character = 'boy',
  onCharacter,
  onCommit,
  onHistory,
}: {
  data: Solo;
  situationIds?: string[];
  character?: CharacterId;
  onCharacter?: () => void;
  onCommit: (p: Plan) => void;
  onHistory: () => void;
}) {
  const monthIndex = data.month;
  const state = data.state;
  const difficultySettings = DIFFICULTIES[data.difficulty];
  const [plan, setPlan] = useState<Plan>(() => {
    const previousPlan = data.plans.at(-1);
    return {
      ...defaultPlan(monthIndex),
      roomVersion: 1,
      choice: '',
      ...(situationIds?.length
        ? {
            scenario: situationIds[0],
            extras: situationIds.slice(1).map((scenario) => ({ scenario, choice: '' })),
          }
        : {}),
      ...(previousPlan
        ? {
            housing: previousPlan.housing,
            job: previousPlan.job,
            study: previousPlan.study,
            leisure: previousPlan.leisure,
          }
        : {}),
    };
  });
  const [tab, setTab] = useState<
    'room' | 'decisions' | 'plan' | 'development' | 'bank' | 'history'
  >('room');
  const [activeSituation, setActiveSituation] = useState(0);
  const [isShopOpen, setShopOpen] = useState(false);
  const updatePlan = useCallback(<K extends keyof Plan>(key: K, value: Plan[K]) => {
    setPlan((current) => (Object.is(current[key], value) ? current : { ...current, [key]: value }));
  }, []);
  const scenario = planScenario(plan, monthIndex);
  const eventCount = 1 + (plan.extras?.length || 0);
  const remainingDecisions =
    (plan.choice ? 0 : 1) + (plan.extras || []).filter((event) => !event.choice).length;
  const nextUnansweredSituation = !plan.choice
    ? 0
    : (plan.extras || []).findIndex((event) => !event.choice) + 1;
  const currentExtra = activeSituation > 0 ? plan.extras?.[activeSituation - 1] : undefined;
  const situationId = currentExtra?.scenario || plan.scenario || `main-${monthIndex}`;
  const sceneScenario = currentExtra ? getScenario(currentExtra.scenario)! : scenario;
  const replaceDesk = situationId === 'desk' && roomInventory(state).includes('desk');
  const sceneStory = useMemo(() => {
    const story = extraStory(situationId, monthIndex);
    if (replaceDesk) {
      story.line =
        'У тебя уже есть удобный стол. Появились варианты замены или доработки рабочего места. Стоит ли тратиться ещё раз?';
    }
    return story;
  }, [situationId, monthIndex, replaceDesk]);
  const contextualScenario = useMemo(
    () =>
      replaceDesk
        ? {
            ...sceneScenario,
            document: {
              ...sceneScenario.document,
              text:
                sceneScenario.document.text +
                ' Удобный стол уже есть в твоей комнате. Эти варианты означают его замену или доработку. Повторный стол не увеличивает постоянную помощь комнаты.',
            },
          }
        : sceneScenario,
    [sceneScenario, replaceDesk],
  );
  const selectDecision = (value: string) => {
    if (activeSituation === 0) {
      updatePlan('choice', value);
      return;
    }
    updatePlan(
      'extras',
      (plan.extras || []).map((event, index) =>
        index === activeSituation - 1 ? { ...event, choice: value } : event,
      ),
    );
  };
  const validationError = useMemo(
    () => validatePlan(plan, state, monthIndex, false, data.difficulty),
    [plan, state, monthIndex, data.difficulty],
  );
  const forecast = useMemo(() => {
    try {
      return {
        report: settle(state, plan, monthIndex, data.goal, false, data.difficulty),
        error: '',
      };
    } catch (e) {
      return { report: null, error: e instanceof Error ? e.message : 'Проверь план.' };
    }
  }, [state, plan, monthIndex, data.goal, data.difficulty]);
  const report = forecast.report;
  const canCommit = !validationError && !forecast.error;
  const focusSection = (selector: string) =>
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const focusRoomPanel = (selector: string) =>
    requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(selector);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const control = target.matches('button,input,select')
        ? target
        : target.querySelector<HTMLElement>('button:not(:disabled),input,select') || target;
      if (control === target && !control.matches('button,input,select')) control.tabIndex = -1;
      control.focus({ preventScroll: true });
    });
  const openRoomAction = (action: RoomAction) => {
    if (action === 'development') {
      setTab('development');
      focusRoomPanel('.development-panel');
      return;
    }
    if (action === 'furniture') {
      setTab('room');
      setShopOpen(true);
      focusRoomPanel('.room-shop');
      return;
    }
    if (action === 'events') {
      setTab('decisions');
      setActiveSituation(nextUnansweredSituation);
      focusRoomPanel('.situations-nav');
      return;
    }
    if (action === 'bank') {
      setTab('bank');
      focusRoomPanel('.bank-identity');
      return;
    }
    setTab('plan');
    const planSections = {
      study: '.study-row',
      rest: '.leisure-control',
      work: 'select[aria-label=Подработка]',
      housing: 'select[aria-label=Жильё]',
    };
    focusRoomPanel(planSections[action]);
  };
  const handleMobileAction = () => {
    if (remainingDecisions) {
      setActiveSituation(nextUnansweredSituation);
      setTab('decisions');
      requestAnimationFrame(() => focusSection('.event-panel'));
      return;
    }
    if (!canCommit) {
      focusSection('.budget-card');
      return;
    }
    onCommit(plan);
  };
  return (
    <div className="game-experience">
      <div className="game-title-row">
        <div>
          <span className="eyebrow">{`ТВОЙ ГОД / ${data.name}`}</span>
          <h1>
            {MONTHS[monthIndex]}
            <span className="lime-dot">.</span>{' '}
            <span className="heading-light">
              {monthIndex === 0
                ? 'Первый месяц самостоятельности'
                : monthIndex === 11
                  ? 'Последние решения года'
                  : 'План на месяц'}
            </span>
          </h1>
        </div>
        <div className="game-title-right">
          {onCharacter && (
            <button
              type="button"
              className="game-character-button"
              onClick={onCharacter}
              aria-label="Сменить персонажа"
            >
              <CharacterArt
                character={character}
                portrait
                emotion={state.energy < 35 ? 'thinking' : 'neutral'}
              />
              <span>
                <small>Твой персонаж</small>
                <b>{CHARACTERS[character].label}</b>
              </span>
              <span className="character-edit-label">Изменить</span>
            </button>
          )}
          <Badge tone="difficulty">{difficultySettings.name}</Badge>
          <Badge>
            <span className="status-dot" />
            Прогресс сохранён
          </Badge>
        </div>
      </div>
      <div className="round-heading">
        <span>
          Раунд <b>{monthIndex + 1}</b> из 12
        </span>
        <span>{tab === 'room' ? 'Твоя комната и планы' : scenario.topic}</span>
      </div>
      {data.difficulty === 'hardcore' && <HardcoreRules state={state} month={monthIndex} />}
      <div className="month-track" aria-label={`Месяц ${monthIndex + 1} из 12`}>
        {SHORT_MONTHS.map((month, i) => (
          <div
            className={i === monthIndex ? 'current' : i < monthIndex ? 'complete' : ''}
            key={month}
          >
            <span>{i < monthIndex ? <Check size={12} /> : String(i + 1).padStart(2, '0')}</span>
            <b>{month}</b>
            {i < 11 && <i />}
          </div>
        ))}
      </div>

      {tab !== 'room' && (
        <BankStoryBanner
          onOpen={() => {
            setTab('bank');
            requestAnimationFrame(() => focusSection('.bank-identity'));
          }}
        />
      )}
      <div className="game-layout room-game-layout">
        <section className="game-main">
          <div className="tab-bar" role="tablist" aria-label="Разделы игры">
            {[
              { id: 'room' as const, name: 'Комната', icon: House },
              { id: 'decisions' as const, name: 'Ситуации', icon: Flag },
              { id: 'plan' as const, name: 'План', icon: BookOpen },
              { id: 'development' as const, name: 'Развитие', icon: BookOpen },
              { id: 'bank' as const, name: 'Мой банк', icon: Landmark },
              { id: 'history' as const, name: 'История', icon: History },
            ].map(({ id, name, icon: Icon }) => (
              <button
                role="tab"
                aria-selected={tab === id}
                key={id}
                className={tab === id ? 'selected' : ''}
                onClick={() => {
                  setTab(id);
                  if (id === 'development')
                    requestAnimationFrame(() => focusSection('.development-panel'));
                }}
              >
                <Icon size={17} />
                {name}
                {id === 'history' && data.reports.length > 0 && <span>{data.reports.length}</span>}
              </button>
            ))}
          </div>
          {tab !== 'room' && (
            <button
              type="button"
              className="room-return"
              onClick={() => {
                setTab('room');
                requestAnimationFrame(() => focusSection('.player-room'));
              }}
            >
              <House size={15} />
              Вернуться в комнату
              <ArrowRight size={15} />
            </button>
          )}
          {tab === 'room' && (
            <>
              <PlayerRoom
                state={state}
                plan={plan}
                currentHousing={data.plans.at(-1)?.housing || 'dorm'}
                month={monthIndex}
                difficulty={data.difficulty}
                character={character}
                remaining={remainingDecisions}
                total={eventCount}
                onAction={openRoomAction}
                onClear={() => {
                  updatePlan('roomBuy', []);
                }}
              />
              {isShopOpen && (
                <RoomShop
                  state={state}
                  plan={plan}
                  month={monthIndex}
                  onChange={(items) => updatePlan('roomBuy', items)}
                  onClose={() => setShopOpen(false)}
                />
              )}
            </>
          )}
          {tab === 'decisions' && (
            <>
              <fieldset className="form-reset">
                <div className="situations-nav" aria-label="Ситуации этого месяца">
                  <div>
                    <b>
                      {eventCount - remainingDecisions} из {eventCount} решений
                    </b>
                    <span>Один бюджет на весь месяц</span>
                  </div>
                  <div
                    className="situation-tabs"
                    style={{ gridTemplateColumns: `repeat(${eventCount},minmax(0,1fr))` }}
                  >
                    {[
                      { title: scenario.title, choice: plan.choice },
                      ...(plan.extras || []).map((x) => ({
                        title: getScenario(x.scenario)!.title,
                        choice: x.choice,
                      })),
                    ].map((event, i) => (
                      <button
                        type="button"
                        key={i}
                        aria-pressed={activeSituation === i}
                        className={activeSituation === i ? 'active' : ''}
                        onClick={() => setActiveSituation(i)}
                      >
                        <span>{event.choice ? <Check size={14} /> : i + 1}</span>
                        <b>{event.title}</b>
                      </button>
                    ))}
                  </div>
                </div>
                <StoryScene
                  key={activeSituation}
                  character={character}
                  month={monthIndex}
                  chapter={activeSituation + 1}
                  scenarioId={currentExtra?.scenario || plan.scenario}
                  scenarioOverride={contextualScenario}
                  story={sceneStory}
                  selected={currentExtra ? currentExtra.choice : plan.choice}
                  onSelect={selectDecision}
                  energy={state.energy}
                />
                {roomGifts(plan, monthIndex).length > 0 && (
                  <div className="room-story-note">
                    <House size={17} />
                    <span>
                      Из выбранных ситуаций в комнате появится:{' '}
                      {roomGifts(plan, monthIndex)
                        .map((id) => ROOM_ITEMS[id].name.toLowerCase())
                        .join(', ')}
                      . Помощь начнётся со следующего месяца.
                    </span>
                    <button type="button" onClick={() => setTab('room')}>
                      В комнату
                    </button>
                  </div>
                )}
                {plan.extras?.length && activeSituation < plan.extras.length ? (
                  <button
                    type="button"
                    className="next-situation button secondary full"
                    onClick={() => {
                      setActiveSituation(activeSituation + 1);
                      requestAnimationFrame(() => focusSection('.situations-nav'));
                    }}
                  >
                    Следующая ситуация
                    <ArrowRight size={17} />
                  </button>
                ) : null}
              </fieldset>
              <button className="bank-prompt" onClick={() => setTab('bank')}>
                <Landmark size={20} />
                <div>
                  <b>Накопления и кредиты</b>
                  <span>Переводы, фонд и сравнение кредитов — в твоём банке.</span>
                </div>
                <ArrowUpRight size={22} />
              </button>
            </>
          )}
          {tab === 'plan' && (
            <fieldset className="form-reset">
              {' '}
              <PlanPanel
                state={state}
                plan={plan}
                currentHousing={data.plans.at(-1)?.housing || 'dorm'}
                month={monthIndex}
                difficulty={data.difficulty}
                onChange={updatePlan}
              />
            </fieldset>
          )}
          {tab === 'bank' && (
            <fieldset className="form-reset">
              <BankPanel
                state={state}
                plan={plan}
                onChange={updatePlan}
                month={monthIndex}
                difficulty={data.difficulty}
              />
            </fieldset>
          )}
          {tab === 'development' && (
            <DevelopmentPanel
              state={state}
              plan={plan}
              month={monthIndex}
              difficulty={data.difficulty}
              onChange={(id) => updatePlan('development', id)}
            />
          )}
          {tab === 'history' && (
            <>
              <HistoryList reports={data.reports} />
              {data.reports.length > 0 && (
                <button className="button secondary full" onClick={onHistory}>
                  Сравнить с другим решением
                  <ArrowUpRight size={18} />
                </button>
              )}
            </>
          )}
        </section>
        <BudgetSidebar
          data={data}
          plan={plan}
          report={report}
          error={validationError}
          forecastError={forecast.error}
          canCommit={canCommit}
          onCommit={onCommit}
        />
      </div>
      <div className="mobile-action-bar">
        <button
          className="mobile-balance"
          onClick={() => focusSection('.budget-card')}
          aria-label="Посмотреть бюджет месяца"
        >
          <span>Останется на руках</span>
          <b className={report && report.after.cash < 0 ? 'red-text' : ''}>
            {report ? rub(report.after.cash) : 'Проверь план'}
            <ChevronDown size={15} />
          </b>
        </button>
        <button className="button primary" onClick={handleMobileAction}>
          {remainingDecisions
            ? 'Выбрать решение'
            : !canCommit
              ? 'Проверить план'
              : 'Завершить месяц'}
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
