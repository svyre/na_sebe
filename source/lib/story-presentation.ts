import { CAST } from './narrative/chapters';
import { SCENE_VOICES } from './narrative/scene-voices';
import { CAMPAIGN_STORIES } from './game/situations/campaign';
import { LOCATIONS } from './locations';
import { getScenario } from './game';
import { STORY_SCENES, type Story } from './story-scenes';
type SceneSetting = Pick<Story, 'place' | 'props' | 'outdoor'>;

const extraScenes: Record<string, SceneSetting> = {
  '0-0': { place: 'Просмотр нового жилья', props: ['coins', 'list', 'campus'], outdoor: false },
  '0-1': { place: 'Дорога в университет', props: ['car', 'bike', 'bus'], outdoor: true },
  '1-0': {
    place: 'Заказ для студенческого клуба',
    props: ['portfolio', 'list', 'search'],
    outdoor: false,
  },
  '1-1': { place: 'Экран с подписками', props: ['laptop', 'phone', 'close'], outdoor: false },
  '2-0': { place: 'Кухня после пар', props: ['food', 'list', 'team'], outdoor: false },
  '2-1': { place: 'Выходные дома', props: ['work', 'medicine', 'rest'], outdoor: false },
  '3-0': { place: 'Перед поездкой домой', props: ['travel', 'bus', 'calendar'], outdoor: true },
  '3-1': { place: 'Витрина со скидками', props: ['shoe', 'tools', 'calendar'], outdoor: false },
  '4-0': { place: 'Учебные материалы', props: ['books', 'laptop', 'campus'], outdoor: false },
  '4-1': { place: 'Объявление об обучении', props: ['list', 'course', 'books'], outdoor: false },
  '5-0': { place: 'Переписка о возврате', props: ['code', 'app', 'close'], outdoor: false },
  '5-1': { place: 'Интернет в дороге', props: ['wifi', 'phone', 'books'], outdoor: false },
  '6-0': {
    place: 'Квитанции на кухонном столе',
    props: ['coins', 'team', 'receipt'],
    outdoor: false,
  },
  '6-1': { place: 'Встреча с друзьями', props: ['gift', 'receipt', 'food'], outdoor: false },
  '7-0': {
    place: 'Первое тестовое задание',
    props: ['laptop', 'handshake', 'search'],
    outdoor: false,
  },
  '7-1': { place: 'Студенческий проект', props: ['portfolio', 'list', 'team'], outdoor: false },
  '8-0': { place: 'Объявление о велосипеде', props: ['coins', 'bike', 'bus'], outdoor: true },
  '8-1': {
    place: 'Финансовые советы в сети',
    props: ['chart', 'search', 'shield'],
    outdoor: false,
  },
  '9-0': { place: 'Неделя перед экзаменами', props: ['food', 'calendar', 'rest'], outdoor: false },
  '9-1': {
    place: 'Студенческий конкурс',
    props: ['portfolio', 'course', 'calendar'],
    outdoor: false,
  },
  '10-0': {
    place: 'Отмена летней поездки',
    props: ['handshake', 'receipt', 'calendar'],
    outdoor: true,
  },
  '10-1': { place: 'Переписка о зарплате', props: ['bank', 'list', 'calendar'], outdoor: false },
  '11-0': {
    place: 'Договор на следующий год',
    props: ['coins', 'list', 'calendar'],
    outdoor: false,
  },
  '11-1': { place: 'Разбор вещей', props: ['gift', 'coins', 'team'], outdoor: false },
  parcel: { place: 'Пункт выдачи заказов', props: ['gift', 'receipt', 'tools'] },
  qr: { place: 'Столик в кафе', props: ['code', 'handshake', 'close'] },
  cashback: { place: 'Учебное приложение Газпромбанка', props: ['gift', 'app', 'shield'] },
  'lost-card': { place: 'Карта исчезла из кошелька', props: ['app', 'search', 'phone'] },
  'loan-friend': { place: 'Разговор после занятий', props: ['coins', 'handshake', 'work'] },
  pass: { place: 'Перед входом в университет', props: ['car', 'bus', 'campus'], outdoor: true },
  desk: { place: 'Обустраиваем комнату', props: ['laptop', 'search', 'tools'] },
  laundry: { place: 'Студенческая прачечная', props: ['coins', 'washer', 'tools'] },
  'team-budget': { place: 'Стол учебного проекта', props: ['coins', 'team', 'tools'] },
  'internship-road': { place: 'Приглашение на практику', props: ['bus', 'laptop', 'rest'] },
  grant: { place: 'Центр поддержки студентов', props: ['portfolio', 'list', 'coins'] },
  volunteer: { place: 'Городское событие', props: ['team', 'handshake', 'laptop'], outdoor: true },
  printer: { place: 'Материалы к сдаче', props: ['coins', 'books', 'laptop'] },
  'mobile-plan': { place: 'Настройки мобильного тарифа', props: ['phone', 'list', 'search'] },
  backup: { place: 'Предупреждение на экране', props: ['laptop', 'shield', 'wifi'] },
  'pet-job': { place: 'Заказ от соседа', props: ['work', 'calendar', 'rest'] },
  ticket: { place: 'Приглашение на встречу', props: ['message', 'receipt', 'laptop'] },
  'card-courier': { place: 'Неожиданный звонок', props: ['bank', 'app', 'close'] },
  'platform-fee': { place: 'Выбор разового заказа', props: ['receipt', 'handshake', 'portfolio'] },
  wallet: { place: 'Скамейка у кампуса', props: ['campus', 'shield', 'travel'], outdoor: true },
  software: { place: 'Инструменты для проекта', props: ['laptop', 'campus', 'code'] },
  collection: { place: 'Чат студенческой команды', props: ['coins', 'list', 'team'] },
  weather: { place: 'Дождь перед встречей', props: ['car', 'bus', 'laptop'], outdoor: true },
  'meal-course': { place: 'Кухня общежития', props: ['course', 'food', 'gift'] },
};

export function extraStory(id: string, month = 0): Story {
  const scenario = getScenario(id)!;
  const voice = SCENE_VOICES[id];
  const dialogue = voice
    ? {
        speaker: CAST[voice.from].name,
        line: voice.line,
        responseSpeaker: 'Ты',
        response: scenario.options.map((option) => voice.replies[option.id] || option.description),
      }
    : {};
  if (id.startsWith('main-'))
    return { ...STORY_SCENES[Number(id.slice(5))], line: scenario.lead, ...dialogue };
  const campaign = CAMPAIGN_STORIES[id];
  const scene = campaign
    ? {
        place: LOCATIONS[campaign.location].name,
        props: campaign.props,
        outdoor: LOCATIONS[campaign.location].outdoor,
      }
    : extraScenes[id];
  return {
    ...STORY_SCENES[month % 12],
    ...scene,
    line: scenario.lead,
    response: scenario.options.map((option) => option.description),
    responseSpeaker: 'В плане',
    ...dialogue,
  };
}
