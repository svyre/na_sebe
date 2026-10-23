import { EXTRA_SITUATIONS, getScenario } from '@/lib/game';
import { STORY_SCENES, type Story, type PropKind } from './StoryScene';
const places=['Просмотр нового жилья','Дорога в университет','Заказ для студенческого клуба','Экран с подписками','Кухня после пар','Выходные дома','Перед поездкой домой','Витрина со скидками','Учебные материалы','Объявление об обучении','Переписка о возврате','Интернет в дороге','Квитанции на кухонном столе','Встреча с друзьями','Первое тестовое задание','Студенческий проект','Объявление о велосипеде','Финансовые советы в сети','Неделя перед экзаменами','Студенческий конкурс','Отмена летней поездки','Переписка о зарплате','Договор на следующий год','Разбор вещей'];
const props:PropKind[][]=[['coins','list','campus'],['car','bike','bus'],['portfolio','list','search'],['laptop','phone','close'],['food','list','team'],['work','medicine','rest'],['travel','bus','calendar'],['shoe','tools','calendar'],['books','laptop','campus'],['list','course','books'],['code','app','close'],['wifi','phone','books'],['coins','team','receipt'],['gift','receipt','food'],['laptop','handshake','search'],['portfolio','list','team'],['coins','bike','bus'],['chart','search','shield'],['food','calendar','rest'],['portfolio','course','calendar'],['handshake','receipt','calendar'],['bank','list','calendar'],['coins','list','calendar'],['gift','coins','team']];
const newScenes:Record<string,{place:string;props:PropKind[];outdoor?:boolean}>={
 parcel:{place:'Пункт выдачи заказов',props:['gift','receipt','tools']},
 qr:{place:'Столик в кафе',props:['code','handshake','close']},
 cashback:{place:'Учебное приложение Газпромбанка',props:['gift','app','shield']},
 'lost-card':{place:'Карта исчезла из кошелька',props:['app','search','phone']},
 'loan-friend':{place:'Разговор после занятий',props:['coins','handshake','work']},
 pass:{place:'Перед входом в университет',props:['car','bus','campus'],outdoor:true},
 desk:{place:'Обустраиваем комнату',props:['laptop','search','tools']},
 laundry:{place:'Студенческая прачечная',props:['coins','washer','tools']},
 'team-budget':{place:'Стол учебного проекта',props:['coins','team','tools']},
 'internship-road':{place:'Приглашение на практику',props:['bus','laptop','rest']},
 grant:{place:'Центр поддержки студентов',props:['portfolio','list','coins']},
 volunteer:{place:'Городское событие',props:['team','handshake','laptop'],outdoor:true},
 printer:{place:'Материалы к сдаче',props:['coins','books','laptop']},
 'mobile-plan':{place:'Настройки мобильного тарифа',props:['phone','list','search']},
 backup:{place:'Предупреждение на экране',props:['laptop','shield','wifi']},
 'pet-job':{place:'Заказ от соседа',props:['work','calendar','rest']},
 ticket:{place:'Приглашение на встречу',props:['message','receipt','laptop']},
 'card-courier':{place:'Неожиданный звонок',props:['bank','app','close']},
 'platform-fee':{place:'Выбор разового заказа',props:['receipt','handshake','portfolio']},
 wallet:{place:'Скамейка у кампуса',props:['campus','shield','travel'],outdoor:true},
 software:{place:'Инструменты для проекта',props:['laptop','campus','code']},
 collection:{place:'Чат студенческой команды',props:['coins','list','team']},
 weather:{place:'Дождь перед встречей',props:['car','bus','laptop'],outdoor:true},
 'meal-course':{place:'Кухня общежития',props:['course','food','gift']},
};
export function extraStory(id:string,month=0):Story {
 const scenario=getScenario(id)!;
 if(id.startsWith('main-'))return {...STORY_SCENES[Number(id.slice(5))],line:scenario.lead};
 const entry=EXTRA_SITUATIONS[id],index=entry?entry.month*2+Number(id.split('-')[1]):-1;
 const scene=newScenes[id]||{place:places[index],props:props[index],outdoor:[1,6,16,20].includes(index)};
 return {...STORY_SCENES[month],...scene,line:scenario.lead,response:scenario.options.map(o=>`${o.title}. Решение добавлено в план.`)};
}
