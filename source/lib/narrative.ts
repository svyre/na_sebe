import { campaignGoal, campaignYears, campaignMonths } from './game/campaign';
import { capital } from './game/finance';
import { ROOM_ITEMS } from './game/furniture';
import type { Solo } from './game/types';
import { CAST, CHAPTERS, type CastId } from './narrative/chapters';
import { friendReaction } from './friends';
export { CAST };
export type { CastId };
export type StoryChoiceId = 'together' | 'independent';
export type StoryMessage = { from: CastId; text: string };
export type StoryChoice = { id: StoryChoiceId; label: string; reply: string };
export type Chapter = {
  month: number;
  title: string;
  setting: string;
  recall?: string;
  messages: StoryMessage[];
  choices: StoryChoice[];
};
export type StoryRecord = Omit<Chapter, 'choices'> & { choice?: StoryChoice };
export type NarrativeProgress = { choices: Record<string, StoryChoiceId>; journal: StoryRecord[] };
const isChoice = (value: unknown): value is StoryChoiceId =>
  value === 'together' || value === 'independent';
const isCast = (value: unknown): value is CastId =>
  typeof value === 'string' && Object.hasOwn(CAST, value);

export function normalizeNarrative(value: unknown): NarrativeProgress {
  const data = value && typeof value === 'object' ? (value as Partial<NarrativeProgress>) : {};
  const choices: NarrativeProgress['choices'] = {};
  if (data.choices && typeof data.choices === 'object' && !Array.isArray(data.choices)) {
    for (const [key, choice] of Object.entries(data.choices))
      if (/^(?:[0-9]|[12][0-9]|3[0-5])$/.test(key) && isChoice(choice)) choices[key] = choice;
  }
  const journal = new Map<number, StoryRecord>();
  if (Array.isArray(data.journal))
    for (const record of data.journal) {
      if (
        !record ||
        !Number.isInteger(record.month) ||
        record.month < 0 ||
        record.month > 35 ||
        typeof record.title !== 'string' ||
        typeof record.setting !== 'string' ||
        !Array.isArray(record.messages)
      )
        continue;
      if (
        !record.messages.length ||
        !record.messages.every((m) => m && isCast(m.from) && typeof m.text === 'string')
      )
        continue;
      const choice =
        record.choice &&
        isChoice(record.choice.id) &&
        typeof record.choice.label === 'string' &&
        typeof record.choice.reply === 'string'
          ? { ...record.choice }
          : undefined;
      journal.set(record.month, {
        month: record.month,
        title: record.title,
        setting: record.setting,
        ...(typeof record.recall === 'string' ? { recall: record.recall } : {}),
        messages: record.messages.map((m) => ({ ...m })),
        ...(choice ? { choice } : {}),
      });
    }
  return { choices, journal: [...journal.values()].sort((a, b) => a.month - b.month) };
}

function lastMonthEcho(game: Solo): string | undefined {
  const past = game.reports.filter((report) => report.month < game.month);
  const last = past.at(-1);
  if (!last) return;
  const previousHousing = game.plans[game.month - 2]?.housing || 'dorm';
  if (last.plan.housing !== previousHousing) {
    const home =
      last.plan.housing === 'shared'
        ? 'квартиры с друзьями'
        : last.plan.housing === 'alone'
          ? 'студии'
          : 'комнаты в общежитии';
    return `На столе лежит ключ от ${home}. Пакеты ещё не разобраны, но сюда уже можно возвращаться домой.`;
  }
  if (last.after.business && !last.before.business)
    return 'Рядом с учебными материалами появилась папка своего дела. В календаре теперь нужно оставлять место и для него.';
  if (last.before.business && !last.after.business)
    return 'Папка своего дела переехала в архив. Не все файлы хочется удалять — некоторые ещё могут пригодиться.';
  if (last.after.business?.paused && !last.before.business?.paused)
    return 'В рабочем календаре стало тише. Непривычно не проверять новые сообщения каждые несколько минут.';
  if (last.after.business?.level === 2 && last.before.business?.level === 1)
    return 'План своего дела больше не помещается на одном листе. На полях появились задачи, которые раньше можно было держать в голове.';
  if (last.after.car && !last.before.car)
    return 'На полке появилась ещё одна связка ключей. Теперь, собираясь выйти, ты машинально проверяешь, на месте ли она.';
  if (last.before.car && !last.after.car)
    return 'На полке больше нет ключей от машины. Перед выходом снова хочется проверить расписание транспорта.';
  const item = last.room?.purchased[0] || last.room?.gifted[0];
  if (item && ROOM_ITEMS[item])
    return `Теперь в комнате есть ${ROOM_ITEMS[item].name.toLowerCase()}. Упаковка пока стоит у двери — надо будет убрать.`;
  if (game.state.energy < 35)
    return 'Сообщения хочется открыть чуть позже. Сначала посидеть в тишине и никуда не спешить.';
  if (game.state.cash < 0)
    return 'Рядом с обычным списком дел лежат расчёты прошлого месяца. К некоторым строкам придётся вернуться прежде, чем строить новые планы.';
  if (game.state.education < 50)
    return 'В учебном чате несколько непрочитанных сообщений. Начать бы хотя бы с того, где прикреплён конспект.';
}

export function chapterFor(game: Solo): Chapter {
  const month = Math.min(35, Math.max(0, game.month));
  const template = CHAPTERS[month];
  const progress = normalizeNarrative(game.narrative);
  const past = (m: number) => (m < month ? progress.choices[m] : undefined);
  const messages: StoryMessage[] = [];
  const reaction = friendReaction(game);
  if (reaction) messages.push(reaction);
  if (month === 2 && past(0) === 'together')
    messages.push({
      from: 'sasha',
      text: 'Я те коробки до сих пор помню. Зачем столько книг-то? У меня после них руки два дня болели)',
    });
  if (month === 2 && past(0) === 'independent')
    messages.push({
      from: 'sasha',
      text: 'Ну что, вещи разобрать получилось? Я свою зарядку после переезда месяц искал',
    });
  if (month === 6 && past(1) === 'together')
    messages.push({
      from: 'lera',
      text: 'Помнишь ту встречу после пары? Мы ещё целый вечер идею выбирали',
    });
  if (month === 6 && past(1) === 'independent')
    messages.push({
      from: 'lera',
      text: 'В прошлый раз мы сначала каждый свой вариант делали. Давай и сейчас так, потом сравним',
    });
  if (month === 12 && past(7) === 'together')
    messages.push({
      from: 'ilya',
      text: 'Мы весной про правки говорили. Пригодилось в итоге? Или пока без заказов?',
    });
  if (month === 24 && [1, 6, 9, 15, 18, 21].filter((m) => past(m) === 'together').length >= 3)
    messages.push({
      from: 'lera',
      text: 'После всех наших общих встреч у меня целая папка черновиков. Есть что показать ребятам',
    });
  if (month === 24 && [1, 6, 9, 15, 18, 21].filter((m) => past(m) === 'independent').length >= 3)
    messages.push({
      from: 'lera',
      text: 'Ты свою часть сначала отдельно подготовишь? Мне бы знать, репетируем вместе или нет',
    });
  if (month === 35 && past(0) === 'together')
    messages.push({
      from: 'sasha',
      text: 'Мы же её вдвоём в первый вечер тащили. Там, кажется, одни книги были',
    });
  if (month === 35 && past(0) === 'independent')
    messages.push({
      from: 'sasha',
      text: 'В первый вечер тебе не до разговоров было, с вещами разбирались. А коробка всё стоит)',
    });
  let message = template.message;
  if (month === 13 && game.state.business)
    message =
      'У тебя теперь своё дело, спрошу у тебя. Сервис для мастерской им вообще нужен? Может, зайдём к владельцу?';
  if (month === 14 && game.state.car)
    message =
      'У тебя уже есть машина, глянь со мной объявление? Мне пока нравится, но я могу чего-то не видеть';
  messages.push({ from: template.from, text: message });
  const recall = lastMonthEcho(game);
  return {
    month,
    title: template.title,
    setting: template.setting,
    ...(recall ? { recall } : {}),
    messages,
    choices: [
      { id: 'together', label: template.together[0], reply: template.together[1] },
      { id: 'independent', label: template.independent[0], reply: template.independent[1] },
    ],
  };
}

export function chooseStory(game: Solo, choice: StoryChoiceId): NarrativeProgress {
  const progress = normalizeNarrative(game.narrative);
  if (
    !isChoice(choice) ||
    !Number.isInteger(game.month) ||
    game.month < 0 ||
    game.month >= campaignMonths(game.state)
  )
    return progress;
  return { ...progress, choices: { ...progress.choices, [game.month]: choice } };
}
export function recordChapter(game: Solo): NarrativeProgress {
  const progress = normalizeNarrative(game.narrative);
  if (!Number.isInteger(game.month) || game.month < 0 || game.month >= campaignMonths(game.state))
    return progress;
  const chapter = chapterFor(game);
  const selected = chapter.choices.find((choice) => choice.id === progress.choices[game.month]);
  const { choices: _choices, ...record } = chapter;
  return {
    ...progress,
    journal: [
      ...progress.journal.filter((item) => item.month !== game.month),
      { ...record, ...(selected ? { choice: { ...selected } } : {}) },
    ].sort((a, b) => a.month - b.month),
  };
}

export function epilogueFor(game: Solo, achieved: boolean) {
  const progress = normalizeNarrative(game.narrative);
  if (!progress.journal.length) return null;
  const leraChoices = Object.entries(progress.choices)
    .filter(([month]) => Number(month) < game.month && CHAPTERS[Number(month)]?.from === 'lera')
    .map(([, choice]) => choice);
  const together = leraChoices.filter((choice) => choice === 'together').length;
  const solo = leraChoices.filter((choice) => choice === 'independent').length;
  const goal = campaignGoal(game.goal, campaignYears(game.state));
  const opening = achieved
    ? 'Последняя строка отчёта заполнена. Теперь можно закрыть расчёты и наконец посмотреть сообщения, которые пришли за вечер.'
    : capital(game.state) >= goal.target
      ? 'Денег на цель хватает, но не все условия получилось выполнить. В отчёте остаются строки, к которым захочется вернуться.'
      : 'До намеченной суммы пока не хватает. В старых записях уже видно, какие планы сработали, а какие пришлось менять по дороге.';
  const messages: StoryMessage[] = [
    {
      from: 'sasha',
      text:
        progress.choices[0] === 'together'
          ? 'Я тут первый вечер вспомнил, как мы коробки таскали. Заходи на неделе на чай. Уже без коробок)'
          : 'Заходи на чай, когда время будет. Я обычно вечером дома',
    },
  ];
  messages.push({
    from: 'lera',
    text:
      together + solo === 0
        ? 'Файлы в чате оставлю, не удаляй пока. Там ещё конспекты нормальные есть'
        : together > solo
          ? 'С тобой ещё что-нибудь хочу сделать. Только в этот раз сроки с запасом возьмём, ладно?'
          : 'Не пропадай. Если будет нужна вторая пара глаз на работу, скидывай',
  });
  if (game.state.business)
    messages.push({
      from: 'ilya',
      text: game.state.business.paused
        ? 'Как отдохнёшь, напиши, что с делом думаешь дальше. Можем на неделе встретиться.'
        : 'Как дела с заказами? Если захочешь обсудить, напиши. В четверг вечером я свободен.',
    });
  else if (campaignYears(game.state) > 1)
    messages.push({
      from: 'ilya',
      text: 'Если по работе что-то появится, пиши. Я в чате, просто не всегда сразу отвечаю.',
    });
  if (game.state.car)
    messages.push({
      from: 'sasha',
      text: 'Кстати, на машине к воде съездим? Я термос возьму. В этот раз точно',
    });
  return { opening, messages };
}
