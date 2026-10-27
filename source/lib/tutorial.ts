export type GameSection =
  | 'room'
  | 'decisions'
  | 'plan'
  | 'development'
  | 'projects'
  | 'bank'
  | 'history';
export const TUTORIAL_STEPS = [
  {
    id: 'story',
    title: 'Первый вечер',
    tab: 'room',
    target: '.room-phone-button',
    text: 'Открой телефон в комнате. Там сообщения от Саши, Леры и Ильи: можно отвечать, обсуждать ситуации и предложить кому-нибудь снимать квартиру вместе. Старые разговоры остаются в контактах. Закрой телефон, чтобы продолжить обучение.',
  },
  {
    id: 'room',
    title: 'Твоя комната',
    tab: 'room',
    target: '.player-room',
    text: 'Нажимай на предметы или кнопки под комнатой. С доски открываются ситуации месяца, со стола — учёба. Остальные разделы доступны во вкладках над комнатой.',
  },
  {
    id: 'decisions',
    title: 'Попробуй выбрать',
    tab: 'decisions',
    target: '.story-event',
    text: 'Открой условия и выбери один вариант — нажми на предмет или карточку. Это только план: его можно менять до завершения месяца. Другие ситуации этого месяца отмечены сверху.',
  },
  {
    id: 'plan',
    title: 'Работа, учёба и отдых',
    tab: 'plan',
    target: '.rhythm-panel',
    text: 'Попробуй изменить нагрузку и посмотри на свободные часы. Работа приносит деньги, но забирает силы. Учёба нужна для стипендии, отдых — для восстановления. Все занятия делят один запас времени.',
  },
  {
    id: 'development',
    title: 'Навыки на будущее',
    tab: 'development',
    target: '.development-panel',
    text: 'Здесь можно выбрать дополнительное занятие или ничего не добавлять. Навыки повышают оплату подработки. Обычную учёбу они не заменяют, а часы и расходы входят в тот же план.',
  },
  {
    id: 'bank',
    title: 'Накопления и платежи',
    tab: 'bank',
    target: '.bank-account',
    text: 'Со счёта можно снимать деньги и пополнять его. Стоимость фонда может упасть. Ниже есть сравнение кредитов: смотри всю сумму возврата. Пока сумма нового кредита равна нулю, он не оформляется.',
  },
  {
    id: 'furniture',
    title: 'Обустройство',
    tab: 'room',
    target: '.room-shop',
    text: 'Мебель можно добавить в план и убрать из него. Оплата и установка произойдут при завершении месяца. Помогать учёбе и восстановлению покупка начнёт со следующего месяца; при переезде вещи останутся с тобой.',
  },
  {
    id: 'history',
    title: 'Где искать результат',
    tab: 'history',
    target: '.tutorial-history',
    text: 'После первого месяца здесь появятся операции, изменения показателей и разговоры. Отчёт сразу откроется и после завершения месяца. Позже можно будет сравнить результат с другим финансовым решением.',
  },
  {
    id: 'future',
    title: 'Что откроется дальше',
    tab: 'room',
    target: '.player-room',
    text: 'В прохождениях на два и три года со второго года доступны своё дело, машина и срочные вклады. Для работы по специальности нужны четыре навыка. Сейчас начни с текущих расходов и времени.',
  },
  {
    id: 'budget',
    title: 'Перед завершением месяца',
    tab: 'room',
    target: '.budget-card',
    text: 'Проверь остаток денег, свободное время, учёбу и ресурс. Если где-то не хватает — поправь план. Обучение само не завершает месяц: когда будешь готов, нажми «Завершить месяц» и посмотри отчёт.',
  },
] as const satisfies readonly {
  id: string;
  title: string;
  tab: GameSection;
  target: string;
  text: string;
}[];
export type TutorialStepId = (typeof TUTORIAL_STEPS)[number]['id'];
export type TutorialProgress = { status: 'active' | 'completed' | 'skipped'; step: TutorialStepId };
export const firstTutorial = (): TutorialProgress => ({ status: 'active', step: 'story' });
export function normalizeTutorial(value: unknown): TutorialProgress | undefined {
  if (!value || typeof value !== 'object') return;
  const data = value as Partial<TutorialProgress>;
  if (!['active', 'completed', 'skipped'].includes(data.status || '')) return;
  return {
    status: data.status!,
    step: TUTORIAL_STEPS.some((step) => step.id === data.step) ? data.step! : 'story',
  };
}
export function nextTutorial(progress: TutorialProgress, hasDecision: boolean): TutorialProgress {
  if (progress.status !== 'active' || (progress.step === 'decisions' && !hasDecision))
    return progress;
  const index = TUTORIAL_STEPS.findIndex((step) => step.id === progress.step);
  if (index === TUTORIAL_STEPS.length - 1) return { ...progress, status: 'completed' };
  return { ...progress, step: TUTORIAL_STEPS[index + 1].id };
}
