import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, House, MessageCircle, Send } from 'lucide-react';
import {
  CAST,
  type CastId,
  type StoryChoiceId,
  type StoryRecord,
  type epilogueFor,
} from '@/lib/narrative';
import { chapterFor, normalizeNarrative } from '@/lib/narrative';
import {
  invitationFor,
  normalizeFriends,
  roommateChance,
  roommateFor,
  ROOMMATES,
  type RoommateId,
} from '@/lib/friends';
import { FRIEND_SITUATIONS } from '@/lib/game/situations/friends';
import { SCENE_VOICES } from '@/lib/narrative/scene-voices';
import { campaignMonths, getScenario, monthLabel, type Plan, type Solo } from '@/lib/game';

export type PhoneView = 'inbox' | 'housing' | CastId;
export type PhoneEvent = { scenario: string; choice: string };
function Bubble({ from, children }: { from: CastId | 'you'; children: ReactNode }) {
  return (
    <div className={`phone-bubble ${from === 'you' ? 'phone-outgoing' : 'phone-incoming'}`}>
      <span className="sr-only">{from === 'you' ? 'Ты' : CAST[from].name}: </span>
      {children}
    </div>
  );
}
function RecordedConversation({ record, contact }: { record: StoryRecord; contact: CastId }) {
  const messages = record.messages.filter((message) => message.from === contact);
  const hasReply = record.messages.at(-1)?.from === contact && record.choice;
  if (!messages.length) return null;
  return (
    <details className="phone-past">
      <summary>
        {monthLabel(record.month, record.month >= 12)} · {record.title}
      </summary>
      {messages.map((message, index) => (
        <Bubble key={index} from={contact}>
          {message.text}
        </Bubble>
      ))}
      {hasReply && (
        <>
          <Bubble from="you">{record.choice!.label}</Bubble>
          <Bubble from={contact}>{record.choice!.reply}</Bubble>
        </>
      )}
    </details>
  );
}

export function Phone({
  data,
  plan,
  events = [],
  initialView = 'inbox',
  onStoryChoice,
  onDecision,
  onHousingInvite,
  onHousingChange,
  onOpenScene,
  readOnly = false,
  ending,
}: {
  data: Solo;
  plan?: Plan;
  events?: PhoneEvent[];
  initialView?: PhoneView;
  onStoryChoice?: (choice: StoryChoiceId) => void;
  onDecision?: (index: number, choice: string) => void;
  onHousingInvite?: (friend: RoommateId) => void;
  onHousingChange?: (housing: string) => void;
  onOpenScene?: (index: number) => void;
  readOnly?: boolean;
  ending?: ReturnType<typeof epilogueFor>;
}) {
  const [view, setView] = useState<PhoneView>(initialView);
  const [editing, setEditing] = useState<string | null>(null);
  const screen = useRef<HTMLDivElement>(null);
  const progress = normalizeNarrative(data.narrative);
  const friends = normalizeFriends(data.friends);
  const active = data.month < campaignMonths(data.state);
  const chapter = active && !readOnly ? chapterFor(data) : null;
  const invitation = invitationFor(data);
  const roommate = roommateFor(data);
  const currentHousing = data.plans.at(-1)?.housing || 'dorm';
  const contact = view !== 'inbox' && view !== 'housing' ? view : null;
  const owner = chapter?.messages.at(-1)?.from;
  const selected = chapter?.choices.find((item) => item.id === progress.choices[data.month]);
  const eventContact = (event: PhoneEvent) =>
    FRIEND_SITUATIONS[event.scenario]?.from || SCENE_VOICES[event.scenario]?.from;
  const preview = (person: CastId) => {
    const finalMessage = ending?.messages.find((message) => message.from === person);
    if (finalMessage) return finalMessage.text;
    if (invitation?.friend === person) return invitation.reply;
    const event = events.find((event) => eventContact(event) === person && !event.choice);
    if (event) return getScenario(event.scenario)!.title;
    return (
      chapter?.messages.find((message) => message.from === person)?.text || 'Открыть переписку'
    );
  };
  const currentMessages = chapter?.messages.filter((message) => message.from === contact) || [];
  useLayoutEffect(() => {
    const viewport = screen.current;
    if (!viewport) return;
    const current = viewport.querySelector<HTMLElement>(
      '.phone-month-story,.phone-situation,.phone-move-result,.phone-move-offer,.phone-ending',
    );
    viewport.scrollTop = contact ? (current ? current.offsetTop - 12 : viewport.scrollHeight) : 0;
    setEditing(null);
  }, [view, data.month]);
  useLayoutEffect(() => {
    if (invitation?.friend !== contact || !screen.current) return;
    const result = screen.current.querySelector<HTMLElement>('.phone-move-result');
    if (result) screen.current.scrollTop = result.offsetTop - 12;
  }, [invitation?.month, contact]);
  return (
    <div className="player-phone">
      <div className="phone-island" aria-hidden="true" />
      <header className="phone-heading">
        {view !== 'inbox' && (
          <button type="button" onClick={() => setView('inbox')} aria-label="К списку контактов">
            <ArrowLeft size={20} />
          </button>
        )}
        {contact && (
          <span className={`chapter-avatar cast-${contact}`} aria-hidden="true">
            {CAST[contact].initial}
          </span>
        )}
        <div>
          <h2>
            {contact ? CAST[contact].name : view === 'housing' ? 'С кем переехать?' : 'Сообщения'}
          </h2>
          <span>
            {contact
              ? roommate === contact
                ? 'Снимаете квартиру вместе'
                : CAST[contact].role
              : monthLabel(
                  Math.min(data.month, campaignMonths(data.state) - 1),
                  campaignMonths(data.state) > 12,
                )}
          </span>
        </div>
      </header>
      <div className="phone-screen" ref={screen}>
        {view === 'inbox' && (
          <>
            <nav className="phone-contacts" aria-label="Контакты">
              {(Object.keys(CAST) as CastId[]).map((person) => {
                const unread =
                  ending?.messages.some((message) => message.from === person) ||
                  (owner === person && !selected) ||
                  events.some((event) => eventContact(event) === person && !event.choice);
                return (
                  <button key={person} type="button" onClick={() => setView(person)}>
                    <span className={`chapter-avatar cast-${person}`} aria-hidden="true">
                      {CAST[person].initial}
                    </span>
                    <span>
                      <b>{CAST[person].name}</b>
                      <small>{preview(person)}</small>
                    </span>
                    {unread && <span className="phone-unread" aria-label="Есть сообщение" />}
                  </button>
                );
              })}
            </nav>
            {active && onHousingInvite && (
              <button
                className="phone-housing-link"
                type="button"
                onClick={() => setView('housing')}
              >
                <House size={19} />
                <span>
                  Обсудить совместную аренду
                  <small>
                    {currentHousing === 'shared'
                      ? roommate
                        ? `Сейчас вы живёте вместе: ${CAST[roommate].name}`
                        : 'Вы уже снимаете квартиру с друзьями'
                      : 'Предложить Саше или Лере переехать'}
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            )}
            <p className="phone-service">
              {readOnly
                ? 'Здесь сохранена переписка завершённых месяцев.'
                : 'Разговоры прошлых месяцев остаются в контактах. Ответы на ситуации меняют твой план до завершения месяца.'}
            </p>
          </>
        )}
        {view === 'housing' && (
          <section className="phone-housing">
            {currentHousing === 'shared' ? (
              <p>
                {roommate
                  ? `Вы с ${roommate === 'sasha' ? 'Сашей' : 'Лерой'} уже снимаете квартиру.`
                  : 'Вы уже снимаете квартиру с друзьями.'}{' '}
                Пока вы остаётесь здесь, договариваться о переезде каждый месяц не нужно.
              </p>
            ) : (
              <>
                <p>Кому предложишь снимать квартиру вместе?</p>
                {ROOMMATES.map((person) => (
                  <button
                    key={person}
                    type="button"
                    className="phone-friend-offer"
                    onClick={() => setView(person)}
                  >
                    <span className={`chapter-avatar cast-${person}`} aria-hidden="true">
                      {CAST[person].initial}
                    </span>
                    <span>
                      <b>{CAST[person].name}</b>
                      <small>
                        {invitation
                          ? invitation.friend === person
                            ? invitation.accepted
                              ? 'Согласие получено'
                              : 'В этом месяце не получится'
                            : 'Можно обсудить в следующем месяце'
                          : `Шанс согласия — ${roommateChance(data, person)}%`}
                      </small>
                    </span>
                    <MessageCircle size={18} />
                  </button>
                ))}
                <p className="phone-service">
                  Один разговор о переезде в месяц. Шанс зависит от общения и выполненных
                  договорённостей. У друзей есть и свои планы: отказ возможен при любых отношениях.
                </p>
              </>
            )}
          </section>
        )}
        {contact && (
          <div className="phone-thread" aria-label={`Переписка: ${CAST[contact].name}`}>
            {progress.journal.map((record) => (
              <RecordedConversation key={record.month} record={record} contact={contact} />
            ))}
            {data.reports.map((report) => {
              const pastEvents = [
                {
                  scenario: report.plan.scenario || `main-${report.month % 12}`,
                  choice: report.plan.choice,
                },
                ...(report.plan.extras || []),
              ];
              const messages = pastEvents.filter((event) => eventContact(event) === contact);
              if (!messages.length) return null;
              return (
                <details className="phone-past" key={`events-${report.month}`}>
                  <summary>
                    {monthLabel(report.month, campaignMonths(data.state) > 12)} · Ситуации
                  </summary>
                  {messages.map((event) => {
                    const social = FRIEND_SITUATIONS[event.scenario];
                    const voice = SCENE_VOICES[event.scenario];
                    return (
                      <div key={event.scenario}>
                        <p className="phone-divider">{getScenario(event.scenario)!.title}</p>
                        <Bubble from={contact}>{social?.scenario.lead || voice?.line}</Bubble>
                        <Bubble from="you">
                          {social?.choices.find((option) => option.id === event.choice)?.say ||
                            voice?.replies[event.choice]}
                        </Bubble>
                        {social && (
                          <Bubble from={contact}>
                            {social.choices.find((option) => option.id === event.choice)?.reply}
                          </Bubble>
                        )}
                      </div>
                    );
                  })}
                </details>
              );
            })}
            {friends.invitations
              .filter((invite) => invite.friend === contact && invite.month < data.month)
              .map((invite) => (
                <details className="phone-past" key={`move-${invite.month}`}>
                  <summary>
                    {monthLabel(invite.month, invite.month >= 12)} · Предложение о переезде
                  </summary>
                  <Bubble from="you">{invite.request}</Bubble>
                  <Bubble from={contact}>{invite.reply}</Bubble>
                </details>
              ))}
            {chapter && currentMessages.length > 0 && (
              <section className="phone-month-story month-story">
                <p className="phone-divider">
                  {monthLabel(data.month, campaignMonths(data.state) > 12)} · {chapter.title}
                </p>
                {chapter.recall && owner === contact && (
                  <p className="phone-service">{chapter.recall}</p>
                )}
                {currentMessages.map((message, index) => (
                  <Bubble key={index} from={contact}>
                    {message.text}
                  </Bubble>
                ))}
                {selected && owner === contact && (
                  <>
                    <Bubble from="you">{selected.label}</Bubble>
                    <Bubble from={contact}>{selected.reply}</Bubble>
                  </>
                )}
                {owner === contact && onStoryChoice && (!selected || editing === 'chapter') && (
                  <div className="phone-replies" role="group" aria-label="Ответ в разговоре">
                    {chapter.choices.map((choice) => (
                      <button
                        type="button"
                        key={choice.id}
                        aria-pressed={selected?.id === choice.id}
                        onClick={() => {
                          onStoryChoice(choice.id);
                          setEditing(null);
                        }}
                      >
                        {choice.label}
                        <Send size={13} />
                      </button>
                    ))}
                  </div>
                )}
                {selected && owner === contact && onStoryChoice && editing !== 'chapter' && (
                  <button
                    className="phone-scene-link"
                    type="button"
                    onClick={() => setEditing('chapter')}
                  >
                    Изменить ответ
                  </button>
                )}
              </section>
            )}
            {events.map((event, index) => {
              if (eventContact(event) !== contact) return null;
              const scenario = getScenario(event.scenario)!;
              const social = FRIEND_SITUATIONS[event.scenario];
              const voice = SCENE_VOICES[event.scenario];
              const say = (id: string) =>
                social?.choices.find((option) => option.id === id)?.say || voice?.replies[id] || '';
              return (
                <section
                  className="phone-situation"
                  data-scenario={event.scenario}
                  key={event.scenario}
                >
                  <p className="phone-divider">{scenario.title}</p>
                  <Bubble from={contact}>
                    {social ? scenario.lead : voice?.line || scenario.lead}
                  </Bubble>
                  <details className="phone-terms">
                    <summary>Условия и расходы</summary>
                    <p>{scenario.document.text}</p>
                  </details>
                  {event.choice && (
                    <>
                      <Bubble from="you">{say(event.choice)}</Bubble>
                      <p className="phone-service">В плане · можно изменить до завершения месяца</p>
                    </>
                  )}
                  {onDecision && (!event.choice || editing === event.scenario) && (
                    <div
                      className="phone-replies"
                      role="group"
                      aria-label={`Ответ: ${scenario.title}`}
                    >
                      {scenario.options.map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          aria-pressed={event.choice === option.id}
                          onClick={() => {
                            onDecision(index, option.id);
                            setEditing(null);
                          }}
                        >
                          <span>
                            {say(option.id)}
                            <small>{option.description}</small>
                          </span>
                          <Send size={13} />
                        </button>
                      ))}
                    </div>
                  )}
                  {event.choice && onDecision && editing !== event.scenario && (
                    <button
                      className="phone-scene-link"
                      type="button"
                      onClick={() => setEditing(event.scenario)}
                    >
                      Изменить решение
                    </button>
                  )}
                  {onOpenScene && (
                    <button
                      type="button"
                      className="phone-scene-link"
                      onClick={() => onOpenScene(index)}
                    >
                      Открыть сцену
                      <ArrowUpRight size={14} />
                    </button>
                  )}
                </section>
              );
            })}
            {invitation?.friend === contact && (
              <section className="phone-move-result" aria-live="polite">
                <p className="phone-divider">Совместная аренда</p>
                <Bubble from="you">{invitation.request}</Bubble>
                <Bubble from={contact}>{invitation.reply}</Bubble>
                {invitation.accepted ? (
                  <>
                    <p className="phone-service">
                      {plan?.housing === 'shared'
                        ? 'Переезд в плане. Комната сменится после завершения месяца.'
                        : 'Можно добавить переезд в план этого месяца. До подтверждения вы остаётесь на прежнем месте.'}
                    </p>
                    {onHousingChange && plan?.housing !== 'shared' && (
                      <button
                        type="button"
                        className="button primary full"
                        onClick={() => onHousingChange('shared')}
                      >
                        Запланировать переезд
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="phone-service">
                      Ответ сохранён. Предложить снова можно в следующем месяце.
                    </p>
                    {onHousingChange && plan?.housing === 'shared' && (
                      <button
                        type="button"
                        className="button secondary full"
                        onClick={() => onHousingChange(currentHousing)}
                      >
                        Остаться на прежнем месте
                      </button>
                    )}
                  </>
                )}
              </section>
            )}
            {active &&
              onHousingInvite &&
              ROOMMATES.includes(contact as RoommateId) &&
              currentHousing !== 'shared' &&
              !invitation && (
                <section className="phone-move-offer">
                  <p>Предложить снимать квартиру вместе?</p>
                  <small>Шанс согласия — {roommateChance(data, contact as RoommateId)}%</small>
                  <button
                    type="button"
                    className="button primary full"
                    onClick={() => onHousingInvite(contact as RoommateId)}
                  >
                    Отправить предложение
                    <Send size={15} />
                  </button>
                </section>
              )}
            {active &&
              invitation &&
              invitation.friend !== contact &&
              ROOMMATES.includes(contact as RoommateId) && (
                <p className="phone-service">
                  Предложение в этом месяце уже отправлено. К переезду можно вернуться в следующем.
                </p>
              )}
            {!currentMessages.length &&
              !ending?.messages.some((message) => message.from === contact) &&
              !events.some((event) => eventContact(event) === contact) &&
              !progress.journal.some((record) =>
                record.messages.some((message) => message.from === contact),
              ) && <p className="phone-service">Новых сообщений пока нет.</p>}
            {ending && (
              <section className="phone-ending">
                <p className="phone-divider">После последнего месяца</p>
                {ending.messages
                  .filter((message) => message.from === contact)
                  .map((message, index) => (
                    <Bubble from={contact} key={index}>
                      {message.text}
                    </Bubble>
                  ))}
              </section>
            )}
          </div>
        )}
      </div>
      <div className="phone-home-indicator" aria-hidden="true" />
    </div>
  );
}
