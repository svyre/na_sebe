import { debt, planScenario, rub, selectedExtraOptions, type Report } from './game';
export type ReviewItem = { title: string; text: string };

/** Explain completed, revealed reports only; never classify a purchase by price alone. */
export function reviewMonth(report: Report) {
  const good: ReviewItem[] = [];
  const improve: ReviewItem[] = [];
  if (report.development?.skillsGained)
    good.push({
      title: 'Профессиональный рост',
      text: `Получено навыков: ${report.development.skillsGained}. Эти навыки помогают получать более высокую оплату подработки.`,
    });
  if (report.month === 11 && report.plan.development === 'course')
    improve.push({
      title: 'Курс за пределами года',
      text: 'Курс завершится после августа. На доход и итог этого года новый навык уже не повлияет.',
    });
  const option = planScenario(report.plan, report.month).options.find(
    (o) => o.id === report.plan.choice,
  );
  const extraOptions = selectedExtraOptions(report.plan, report.month);
  const educationChange = report.after.education - report.before.education;
  const energyChange = report.after.energy - report.before.energy;
  const skillsChange = report.after.skills - report.before.skills;
  const debtChange = debt(report.after) - debt(report.before);
  const newBorrowing = report.after.loans
    .filter((l) => !report.before.loans.some((old) => old.id === l.id))
    .reduce((sum, l) => sum + l.balance, 0);
  if (report.after.cash >= 0)
    good.push({
      title: 'Месяц без дефицита',
      text: `На руках осталось ${rub(report.after.cash)}. Текущие расходы покрыты.`,
    });
  if (option?.safety && option.safety > 0)
    good.push({
      title: 'Внимание к условиям',
      text: `В решении «${option.title}» учтена безопасность. Безопасность: ${report.before.safety} → ${report.after.safety}.`,
    });
  if (educationChange > 0)
    good.push({
      title: 'Учёба продвинулась',
      text: `${report.before.education} → ${report.after.education} баллов. Это результат всего плана: учёбы, работы, ресурса и события.`,
    });
  if (energyChange > 0)
    good.push({
      title: 'Сил стало больше',
      text: `Ресурс вырос с ${report.before.energy} до ${report.after.energy}. В плане нашлось место восстановлению.`,
    });
  if (skillsChange > 0)
    good.push({
      title: 'Новый профессиональный опыт',
      text: `Получено навыков: ${skillsChange}. Они учитываются в следующих подработках, а не увеличивают прошлый доход.`,
    });
  if (report.plan.save > 0 && newBorrowing === 0 && report.after.cash >= 0)
    good.push({
      title: 'Пополнен резерв',
      text: `На накопительный счёт направлено ${rub(report.plan.save)} без нового кредита и дефицита.`,
    });
  if (debtChange < -0.01)
    good.push({
      title: 'Долг стал меньше',
      text: `Остаток кредитов снизился на ${rub(-debtChange)}.`,
    });
  if (option?.safety && option.safety < 0)
    improve.push({ title: 'Риск в выбранном предложении', text: report.explanation });
  for (const item of extraOptions) {
    if ((item.option?.safety || 0) > 0)
      good.push({ title: `Проверка: ${item.scenario?.title}`, text: item.option!.explanation });
    if ((item.option?.safety || 0) < 0)
      improve.push({ title: `Риск: ${item.scenario?.title}`, text: item.option!.explanation });
  }
  if (report.after.cash < 0)
    improve.push({
      title: 'Расходов больше, чем доступных денег',
      text: `Дефицит — ${rub(-report.after.cash)}. В следующем месяце к нему добавится 3%.`,
    });
  if (report.after.education < 50)
    improve.push({
      title: 'Стипендия под угрозой',
      text: `Учёба — ${report.after.education} баллов. При уровне ниже 50 в начале следующего месяца стипендия не начисляется.`,
    });
  else if (educationChange < 0)
    improve.push({
      title: 'Учёбе досталось меньше внимания',
      text: `Показатель изменился с ${report.before.education} до ${report.after.education}. Проверь сочетание смен и времени на подготовку.`,
    });
  if (report.after.energy < 35)
    improve.push({
      title: 'Нужна передышка',
      text: `Ресурс — ${report.after.energy} из 100. Ниже 25 баллов доход от подработки в следующем месяце сокращается.`,
    });
  else if (energyChange < 0)
    improve.push({
      title: 'Нагрузка потратила силы',
      text: `Ресурс снизился на ${-energyChange}. Сверь дополнительную работу с отдыхом и временем на дорогу.`,
    });
  if (newBorrowing > 0.01)
    improve.push({
      title: 'Появилось будущее обязательство',
      text: `Добавлен долг: ${rub(newBorrowing)}. Деньги кредита не считаются прибылью; учти следующие платежи.`,
    });
  const futureExpenses = report.after.pending.filter(
    (p) => p.cash && p.cash < 0 && p.due > report.month,
  );
  if (futureExpenses.length)
    improve.push({
      title: 'Есть отложенные расходы',
      text: `Уже запланировано ${rub(-futureExpenses.reduce((sum, p) => sum + (p.cash || 0), 0))}. Оставь деньги на эти платежи.`,
    });
  if (report.after.savings < report.before.savings - 0.01)
    improve.push({
      title: 'Резерв использован',
      text: `Накопления уменьшились на ${rub(report.before.savings - report.after.savings)}. Это не ошибка само по себе; запланируй восстановление запаса.`,
    });
  let next = 'Перед следующим месяцем проверь будущие платежи и оставшееся время.';
  if (report.after.cash < 0) {
    next = 'Сначала закрой дефицит: пересмотри расходы, доступный резерв и посильную подработку.';
  } else if (report.after.energy < 35) {
    next = 'Снизь нагрузку и запланируй отдых. Проверь, сколько часов уже занято.';
  } else if (report.after.education < 50) {
    next = 'Верни время на учёбу: стипендия зависит от уровня в начале месяца.';
  } else if (
    (option?.safety || 0) < 0 ||
    extraOptions.some((decision) => (decision.option?.safety || 0) < 0)
  ) {
    next =
      'Проверяй отправителя независимым способом. Не передавай коды и не плати за обещание работы или доходности.';
  } else if (newBorrowing > 0 || futureExpenses.length) {
    next =
      'Запиши будущие платежи до новых покупок. Сравнивай полную стоимость, а не только платёж сегодня.';
  } else if (report.after.savings < report.before.savings) {
    next = 'Запланируй пополнение накоплений из следующего дохода.';
  }
  return { good, improve, next };
}
