import { planScenario, getScenario, debt, rub, type Report } from './game';
export type ReviewItem={title:string;text:string};

/** Explain completed, revealed reports only; never classify a purchase by price alone. */
export function reviewMonth(r:Report) {
 const good:ReviewItem[]=[],improve:ReviewItem[]=[];
 const option=planScenario(r.plan,r.month).options.find(o=>o.id===r.plan.choice);
 const extraOptions=(r.plan.extras||[]).map(event=>({scenario:getScenario(event.scenario),option:getScenario(event.scenario)?.options.find(o=>o.id===event.choice)}));
 const education=r.after.education-r.before.education,energy=r.after.energy-r.before.energy,skills=r.after.skills-r.before.skills;
 const newDebt=debt(r.after)-debt(r.before);
 const newBorrowed=r.after.loans.filter(l=>!r.before.loans.some(old=>old.id===l.id)).reduce((sum,l)=>sum+l.balance,0);
 if(r.after.cash>=0)good.push({title:'Месяц без дефицита',text:`На руках осталось ${rub(r.after.cash)}. Текущие расходы покрыты.`});
 if(option?.safety&&option.safety>0)good.push({title:'Внимание к условиям',text:`В решении «${option.title}» учтена безопасность. Показатель в игре: ${r.before.safety} → ${r.after.safety}.`});
 if(education>0)good.push({title:'Учёба продвинулась',text:`${r.before.education} → ${r.after.education} баллов. Это результат всего плана: учёбы, работы, ресурса и события.`});
 if(energy>0)good.push({title:'Сил стало больше',text:`Ресурс вырос с ${r.before.energy} до ${r.after.energy}. В плане нашлось место восстановлению.`});
 if(skills>0)good.push({title:'Новый профессиональный опыт',text:`Получено навыков: ${skills}. Они учитываются в следующих подработках, а не увеличивают прошлый доход.`});
 if(r.plan.save>0&&newBorrowed===0&&r.after.cash>=0)good.push({title:'Пополнен резерв',text:`На накопительный счёт направлено ${rub(r.plan.save)} без нового кредита и дефицита.`});
 if(newDebt<-.01)good.push({title:'Долг стал меньше',text:`Остаток кредитов снизился на ${rub(-newDebt)}.`});
 if(option?.safety&&option.safety<0)improve.push({title:'Риск в выбранном предложении',text:r.explanation});
 for(const item of extraOptions){
  if((item.option?.safety||0)>0)good.push({title:`Проверка: ${item.scenario?.title}`,text:item.option!.explanation});
  if((item.option?.safety||0)<0)improve.push({title:`Риск: ${item.scenario?.title}`,text:item.option!.explanation});
 }
 if(r.after.cash<0)improve.push({title:'Расходов больше, чем доступных денег',text:`Дефицит — ${rub(-r.after.cash)}. В следующем месяце модель добавит к нему 3% стоимости.`});
 if(r.after.education<50)improve.push({title:'Стипендия под угрозой',text:`Учёба — ${r.after.education} баллов. При уровне ниже 50 в начале следующего месяца стипендия не начисляется.`});
 else if(education<0)improve.push({title:'Учёбе досталось меньше внимания',text:`Показатель изменился с ${r.before.education} до ${r.after.education}. Проверь сочетание смен и времени на подготовку.`});
 if(r.after.energy<35)improve.push({title:'Нужна передышка',text:`Ресурс — ${r.after.energy} из 100. Ниже 25 баллов доход от подработки в следующем месяце сокращается.`});
 else if(energy<0)improve.push({title:'Нагрузка потратила силы',text:`Ресурс снизился на ${-energy}. Сверь дополнительную работу с отдыхом и временем на дорогу.`});
 if(newBorrowed>.01)improve.push({title:'Появилось будущее обязательство',text:`Добавлен долг: ${rub(newBorrowed)}. Деньги кредита не считаются прибылью; учти следующие платежи.`});
 const pending=r.after.pending.filter(p=>p.cash&&p.cash<0&&p.due>r.month);
 if(pending.length)improve.push({title:'Есть отложенные расходы',text:`Уже запланировано ${rub(-pending.reduce((sum,p)=>sum+(p.cash||0),0))}. Оставь деньги на эти платежи.`});
 if(r.after.savings<r.before.savings-.01)improve.push({title:'Резерв использован',text:`Накопления уменьшились на ${rub(r.before.savings-r.after.savings)}. Это не ошибка само по себе; запланируй восстановление запаса.`});
 const next=r.after.cash<0?'Сначала закрой дефицит: пересмотри расходы, доступный резерв и посильную подработку.':r.after.energy<35?'Снизь нагрузку и запланируй отдых. Проверь, сколько часов уже занято.':r.after.education<50?'Верни время на учёбу: стипендия зависит от уровня в начале месяца.':((option?.safety||0)<0||extraOptions.some(x=>(x.option?.safety||0)<0))?'Проверяй отправителя независимым способом. Не передавай коды и не плати за обещание работы или доходности.':newBorrowed>0||pending.length?'Запиши будущие платежи до новых покупок. Сравнивай полную стоимость, а не только платёж сегодня.':r.after.savings<r.before.savings?'Резерв сделал свою работу. Подумай, какую часть следующего дохода сможешь вернуть в накопления.':'Сохрани баланс денег, учёбы и сил. Перед новым ходом проверь доступное время и будущие платежи.';
 return {good,improve,next};
}
