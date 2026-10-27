import type { CharacterId } from '@/lib/character';
import {
  HOUSING,
  jobSettings,
  campaignMonths,
  ROOM_ITEMS,
  macroFor,
  roomEffects,
  roomGifts,
  roomInventory,
  rub,
  type DifficultyId,
  type GameState,
  type Plan,
  type RoomItemId,
} from '@/lib/game';
import {
  Armchair,
  ArrowRight,
  BedDouble,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Flower2,
  GraduationCap,
  House,
  LampDesk,
  Landmark,
  LibraryBig,
  ListChecks,
  Moon,
  Pause,
  Play,
  Plus,
  ShoppingBag,
  Sun,
  Smartphone,
  Table2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { RoomInterior } from './PlayerRoomArt';
import { useSceneMotion } from './useSceneMotion';

export type RoomAction =
  | 'phone'
  | 'study'
  | 'work'
  | 'rest'
  | 'events'
  | 'bank'
  | 'housing'
  | 'furniture'
  | 'development'
  | 'projects';
const actions = [
  { id: 'events', name: 'Ситуации месяца', place: 'Доска планов', icon: ListChecks, x: 66, y: 27 },
  { id: 'study', name: 'Учёба', place: 'Рабочий стол', icon: BookOpen, x: 25, y: 53 },
  { id: 'work', name: 'Работа', place: 'Ноутбук', icon: BriefcaseBusiness, x: 30, y: 38 },
  { id: 'rest', name: 'Отдых', place: 'Кровать', icon: BedDouble, x: 74, y: 65 },
  { id: 'bank', name: 'Мой банк', place: 'Банковское приложение', icon: Landmark, x: 41, y: 48 },
  { id: 'phone', name: 'Сообщения', place: 'Телефон', icon: Smartphone, x: 49, y: 78 },
  { id: 'furniture', name: 'Обустройство', place: 'Мебель и уют', icon: Armchair, x: 87, y: 56 },
  { id: 'housing', name: 'Жильё', place: 'Сменить жильё', icon: House, x: 89, y: 29 },
] as const;
export const roomIcons = {
  lamp: LampDesk,
  desk: Table2,
  chair: Armchair,
  mattress: BedDouble,
  shelf: LibraryBig,
  plant: Flower2,
};

export function PlayerRoom({
  state,
  plan,
  currentHousing,
  month,
  difficulty,
  character,
  remaining,
  total,
  onAction,
  onClear,
  arrival = false,
  canMove = true,
  roommateName,
}: {
  state: GameState;
  plan: Plan;
  currentHousing: string;
  month: number;
  difficulty: DifficultyId;
  character: CharacterId;
  remaining: number;
  total: number;
  onAction: (action: RoomAction) => void;
  onClear: () => void;
  arrival?: boolean;
  canMove?: boolean;
  roommateName?: string;
}) {
  const [night, setNight] = useState(() => {
    try {
      return localStorage.getItem('na-sebe-room-light') === 'night';
    } catch {
      return false;
    }
  });
  const motion = useSceneMotion();
  const housing = HOUSING.find((h) => h.id === currentHousing) || HOUSING[0];
  const movingTo =
    canMove && plan.housing !== housing.id ? HOUSING.find((h) => h.id === plan.housing) : undefined;
  const owned = useMemo(() => roomInventory(state), [state.roomItems]);
  const effects = roomEffects(state);
  const planned = useMemo(() => {
    const gifts = roomGifts(plan, month).filter((id) => !owned.includes(id));
    return [...new Set([...(plan.roomBuy || []), ...gifts])];
  }, [plan.scenario, plan.choice, plan.extras, plan.roomVersion, plan.roomBuy, month, owned]);
  const toggleLight = () => {
    const next = !night;
    setNight(next);
    try {
      localStorage.setItem('na-sebe-room-light', next ? 'night' : 'day');
    } catch {
      // При запрете записи свет всё равно меняется до перезагрузки страницы.
    }
  };
  const note = (id: RoomAction) =>
    id === 'phone'
      ? 'Разговоры, друзья и переезд'
      : id === 'events'
        ? `${total - remaining} из ${total} решений`
        : id === 'study'
          ? `${plan.study} ч в плане`
          : id === 'work'
            ? jobSettings(plan.job).name
            : id === 'rest'
              ? `${rub(plan.leisure)} в плане`
              : id === 'bank'
                ? 'Резерв, фонд и платежи'
                : id === 'housing'
                  ? `${rub(Math.round(housing.cost * macroFor(month, difficulty).inflation))} в месяц`
                  : `${owned.length} из 6 улучшений`;
  return (
    <section className="player-room" aria-labelledby="player-room-title">
      <header className="player-room-heading">
        <div>
          <span>{housing.name}</span>
          <h2 id="player-room-title">Твоя комната</h2>
          {roommateName && <p className="roommate-name">Вместе с тобой: {roommateName}</p>}
          {movingTo && (
            <p role="status">
              После завершения {month === campaignMonths(state) - 1 ? 'игры' : 'месяца'}:{' '}
              {movingTo.name.toLowerCase()}.
            </p>
          )}
        </div>
        <div className="room-scene-controls">
          <button
            type="button"
            onClick={toggleLight}
            aria-label={night ? 'Включить дневной свет' : 'Включить вечерний свет'}
            title={night ? 'Дневной свет' : 'Вечерний свет'}
          >
            {night ? <Moon size={16} /> : <Sun size={16} />}
            <span>{night ? 'Вечер' : 'День'}</span>
          </button>
          <button
            type="button"
            className="room-motion-toggle"
            disabled={motion.reduced}
            aria-pressed={motion.enabled}
            aria-label={
              motion.reduced
                ? 'Анимация отключена настройками устройства'
                : motion.enabled
                  ? 'Остановить анимацию'
                  : 'Включить анимацию'
            }
            onClick={motion.toggle}
          >
            {motion.enabled ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      </header>
      <div
        ref={motion.sceneRef}
        className={`player-room-canvas ${night ? 'room-night' : ''}`}
        data-motion={motion.mode}
      >
        <RoomInterior
          housing={housing.id}
          owned={owned}
          planned={planned}
          character={character}
          energy={state.energy}
          night={night}
          ready={!remaining}
          arrival={arrival}
        />
        <div className="room-hotspots" role="group" aria-label="Предметы в твоей комнате">
          {actions.map(({ id, place, icon: Icon, x, y }) => (
            <button
              type="button"
              key={id}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`room-hotspot hotspot-${id}`}
              aria-label={`${place}: ${id === 'events' ? 'открыть ситуации месяца' : id === 'furniture' ? 'обустроить комнату' : `открыть раздел «${place === 'Телефон' ? 'Мой банк' : actions.find((a) => a.id === id)!.name}»`}`}
              onClick={() => onAction(id)}
            >
              <span>
                <Icon size={17} />
                {id === 'events' && remaining > 0 && <i>{remaining}</i>}
              </span>
              <b>{place}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="room-month-prompt">
        <span className={remaining ? 'room-progress-ring' : 'room-progress-ring complete'}>
          {remaining ? <ListChecks size={22} /> : <Check size={22} />}
        </span>
        <div>
          <b>
            {remaining
              ? `${remaining === 1 ? 'Осталась' : 'Осталось'} ${remaining} ${remaining === 1 ? 'ситуация' : 'ситуации'}`
              : 'Решения месяца собраны'}
          </b>
          <p>
            {remaining
              ? 'Открой доску планов и выбери, как поступить.'
              : 'Проверь бюджет, время и покупки перед завершением месяца.'}
          </p>
        </div>
        <button type="button" onClick={() => onAction(remaining ? 'events' : 'housing')}>
          {remaining ? 'К ситуациям' : 'Проверить план'}
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="room-actions" aria-label="Действия из комнаты">
        {month >= 12 && (
          <button type="button" onClick={() => onAction('projects')}>
            <BriefcaseBusiness size={20} />
            <span>
              <b>Проекты</b>
              <small>
                {state.business ? 'Своё дело' : 'Запуск своего дела'}
                {state.car ? ' и твоя машина' : ' и покупка машины'}
              </small>
            </span>
            <ArrowRight size={14} />
          </button>
        )}
        <button type="button" onClick={() => onAction('development')}>
          <GraduationCap size={20} />
          <span>
            <b>Развитие</b>
            <small>Обучение, курс или стажировка</small>
          </span>
          <ArrowRight size={14} />
        </button>
        {actions
          .filter((a) => a.id !== 'events')
          .map(({ id, name, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className={id === 'phone' ? 'room-phone-button' : undefined}
              onClick={() => onAction(id)}
            >
              <Icon size={20} />
              <span>
                <b>{name}</b>
                <small>{note(id)}</small>
              </span>
              <ArrowRight size={14} />
            </button>
          ))}
      </div>
      <footer className="room-state-note">
        <div>
          <b>
            {owned.length ? 'Комната помогает каждый месяц' : 'Базовая мебель уже включена в жильё'}
          </b>
          <span>
            {owned.length
              ? `Учёба +${effects.education} · ресурс +${effects.energy}. Улучшения переезжают вместе с тобой.`
              : 'Нажимай на предметы или используй кнопки под комнатой.'}
          </span>
        </div>
        {planned.length > 0 && (
          <div className="room-planned-note">
            <ShoppingBag size={16} />
            <span>
              Появится после закрытия месяца:{' '}
              {planned.map((id) => ROOM_ITEMS[id].name.toLowerCase()).join(', ')}.
            </span>
            {!!plan.roomBuy?.length && (
              <button type="button" onClick={onClear}>
                Убрать покупки
              </button>
            )}
          </div>
        )}
      </footer>
    </section>
  );
}

export function RoomShop({
  state,
  plan,
  month,
  onChange,
  onClose,
}: {
  state: GameState;
  plan: Plan;
  month: number;
  onChange: (items: RoomItemId[]) => void;
  onClose: () => void;
}) {
  const owned = roomInventory(state);
  const selected = plan.roomBuy || [];
  const gifts = roomGifts(plan, month);
  const cost = selected.reduce((sum, id) => sum + ROOM_ITEMS[id].cost, 0);
  const hours = selected.reduce((sum, id) => sum + ROOM_ITEMS[id].hours, 0);
  return (
    <section className="room-shop panel" aria-labelledby="room-shop-title">
      <header>
        <div>
          <span>Мебель</span>
          <h2 id="room-shop-title">Обустройство комнаты</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Закрыть обустройство"
        >
          <X size={20} />
        </button>
      </header>
      <p>
        Покупки войдут в бюджет этого месяца. На установку нужно время, а помощь учёбе и
        восстановлению начнётся со следующего месяца.
      </p>
      <div className="room-shop-grid">
        {(Object.keys(ROOM_ITEMS) as RoomItemId[]).map((id) => {
          const item = ROOM_ITEMS[id];
          const Icon = roomIcons[id];
          const bought = owned.includes(id);
          const inPlan = selected.includes(id);
          const gift = gifts.includes(id) && !bought;
          return (
            <article
              key={id}
              className={`room-shop-item ${inPlan ? 'in-plan' : ''} ${bought ? 'owned' : ''}`}
              data-item={id}
            >
              <div className="room-item-symbol">
                <Icon size={29} />
                {bought && (
                  <span>
                    <Check size={13} />
                  </span>
                )}
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <span className="room-item-effect">
                {item.education ? `Учёба +${item.education}` : `Ресурс +${item.energy}`} / месяц
              </span>
              <div className="room-item-price">
                <b>{rub(item.cost)}</b>
                <small>{item.hours} ч на установку</small>
              </div>
              <button
                type="button"
                disabled={bought || (gift && !inPlan)}
                aria-pressed={inPlan}
                aria-label={
                  bought
                    ? `${item.name}: уже в комнате`
                    : gift && !inPlan
                      ? `${item.name}: появится из ситуации`
                      : inPlan
                        ? `Убрать из плана: ${item.name}`
                        : `Добавить в план: ${item.name}`
                }
                onClick={() =>
                  onChange(inPlan ? selected.filter((x) => x !== id) : [...selected, id])
                }
              >
                {bought ? (
                  <>
                    <Check size={15} />В комнате
                  </>
                ) : inPlan ? (
                  <>
                    <X size={15} />
                    Убрать из плана
                  </>
                ) : gift ? (
                  'Из ситуации'
                ) : (
                  <>
                    <Plus size={15} />В план
                  </>
                )}
              </button>
            </article>
          );
        })}
      </div>
      <div className="room-shop-summary">
        <div>
          <span>Запланировано на комнату</span>
          <b>
            {rub(cost)}
            <small>{hours} ч</small>
          </b>
        </div>
        <p>
          Оплата — при завершении месяца. Стоимость мебели считается расходом и не добавляется к
          капиталу.
        </p>
      </div>
    </section>
  );
}

export function FinalRoom({
  state,
  housing,
  character,
}: {
  state: GameState;
  housing: string;
  character: CharacterId;
}) {
  const owned = roomInventory(state);
  const motion = useSceneMotion();
  return (
    <section
      className="player-room final-player-room"
      aria-label="Твоя комната в конце прохождения"
    >
      <header className="player-room-heading">
        <div>
          <span>{HOUSING.find((h) => h.id === housing)?.name}</span>
          <h2>Комната в конце прохождения</h2>
          <p>
            {owned.length
              ? `${owned.length} из 6 улучшений за время прохождения.`
              : 'Дополнительную мебель не покупали.'}
          </p>
        </div>
      </header>
      <div ref={motion.sceneRef} className="player-room-canvas" data-motion={motion.mode}>
        <RoomInterior
          housing={housing}
          owned={owned}
          character={character}
          energy={state.energy}
          ready
        />
      </div>
      <footer className="room-final-items">
        {owned.length ? (
          owned.map((id) => {
            const Icon = roomIcons[id];
            return (
              <span key={id}>
                <Icon size={15} />
                {ROOM_ITEMS[id].name}
              </span>
            );
          })
        ) : (
          <p>
            Базовая мебель была включена в стоимость жилья. Все покупки и их последствия видны в
            истории.
          </p>
        )}
      </footer>
    </section>
  );
}
