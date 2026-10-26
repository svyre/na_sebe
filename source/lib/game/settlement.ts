// Закрытие месяца. Порядок операций важен для процентов и отложенных последствий.

import { HOUSING, JOBS, MONTHS, STUDIES, macroFor, monthRules } from './config';
import { developmentFor } from './development';
import { evaluate } from './evaluation';
import { annuity, capital, creditQuote } from './finance';
import { ROOM_ITEMS, roomEffects, roomGifts, roomInventory } from './furniture';
import { planHours, validatePlan } from './planning';
import { planScenario, selectedExtraOptions } from './situations';
import type { DifficultyId, GameState, GoalId, Ledger, Option, Plan, Report } from './types';
import { clamp, clone, roundMoney } from './utils';

export function settle(
  input: GameState,
  plan: Plan,
  month: number,
  goal: GoalId = 'capital',
  reveal = true,
  difficulty: DifficultyId = 'balance',
): Report {
  const invalid = validatePlan(plan, input, month, !reveal, difficulty);
  if (invalid) throw new Error(invalid);
  const before = clone(input);
  const state = clone(input);
  const selectedPlan = clone(plan);
  const ledger: Ledger[] = [];
  const warnings: string[] = [];
  const recordTransaction = (
    label: string,
    amount: number,
    kind: Ledger['kind'] = amount >= 0 ? 'income' : 'expense',
  ) => {
    state.cash = roundMoney(state.cash + amount);
    ledger.push({ label, amount: roundMoney(amount), kind });
  };
  const monthlyConditions = macroFor(month, difficulty);
  const rules = monthRules(difficulty, month);
  const development = developmentFor(selectedPlan);
  const completedCourses = input.pending.filter(
    (event) => event.development === 'course' && event.due <= month,
  ).length;
  const housing = HOUSING.find((x) => x.id === selectedPlan.housing)!;
  const job = JOBS.find((x) => x.id === selectedPlan.job)!;
  const study = STUDIES.find((x) => x.hours === selectedPlan.study)!;
  const mainOption: Option = planScenario(selectedPlan, month).options.find(
    (x) => x.id === selectedPlan.choice,
  ) || {
    id: '',
    title: 'Событие ещё не выбрано',
    description: '',
    explanation: '',
  };
  const extraDecisions = selectedExtraOptions(selectedPlan, month);
  const selectedOptions = [
    mainOption,
    ...extraDecisions.map((x) => x.option).filter((option): option is Option => !!option),
  ];
  const sumOptionEffects = (key: 'hours' | 'energy' | 'education' | 'skills' | 'safety') =>
    selectedOptions.reduce((sum, option) => sum + (option[key] || 0), 0);
  // Доход учитывается по входящим остаткам: новые пополнения начнут работать позже.
  const interest = roundMoney((state.savings * monthlyConditions.savingsRate) / 1200);
  state.savings = roundMoney(state.savings + interest);
  state.savings = roundMoney(state.savings - selectedPlan.withdraw);
  recordTransaction('С накопительного счёта', selectedPlan.withdraw, 'transfer');
  state.fund = roundMoney(state.fund - selectedPlan.sell);
  recordTransaction('Продажа доли фонда', selectedPlan.sell, 'transfer');
  const market = reveal ? roundMoney((state.fund * monthlyConditions.market) / 100) : 0;
  state.fund = roundMoney(state.fund + market);

  // Сначала выполняются уже наступившие обязательства и платежи по старым кредитам.
  for (const pending of state.pending.filter((x) => x.due <= month)) {
    if (pending.cash) recordTransaction(pending.title, pending.cash);
    if (pending.skills) state.skills += pending.skills;
  }
  state.pending = state.pending.filter((x) => x.due > month);
  for (const loan of state.loans) {
    const loanInterest = roundMoney((loan.balance * loan.rate) / 1200);
    const principalPayment = Math.min(loan.balance, Math.max(0, loan.payment - loanInterest));
    recordTransaction(
      'Платёж: ' + loan.name,
      -roundMoney(principalPayment + loanInterest + loan.monthlyFee),
    );
    loan.balance = roundMoney(loan.balance - principalPayment);
    loan.remaining--;
    if (loan.remaining <= 0 && loan.balance > 0.05) {
      recordTransaction('Последний остаток: ' + loan.name, -loan.balance);
      loan.balance = 0;
    }
  }
  state.loans = state.loans.filter((x) => x.balance > 0.05);
  if (input.cash < 0)
    recordTransaction('Стоимость дефицита прошлого месяца', -roundMoney(-input.cash * 0.03));
  if (selectedPlan.borrow > 0) {
    const credit = creditQuote(selectedPlan.borrow, selectedPlan.offer);
    recordTransaction('Новый кредит', selectedPlan.borrow, 'transfer');
    if (credit.fee) recordTransaction('Разовая комиссия кредита', -credit.fee);
    state.loans.push({
      id: `loan-${month}`,
      name: credit.name,
      balance: selectedPlan.borrow,
      rate: credit.rate,
      remaining: credit.term,
      payment: annuity(selectedPlan.borrow, credit.rate, credit.term),
      monthlyFee: credit.monthlyFee,
    });
  }

  // Поддержка, стипендия и работа оплачивают текущие обязательные расходы.
  recordTransaction('Поддержка семьи', rules.support);
  if (input.education >= 50) recordTransaction('Стипендия', 3000);
  else warnings.push('Стипендии нет: учёба в начале месяца ниже 50.');
  const income = Math.round(
    (job.income + (job.income > 0 ? state.skills * 700 : 0)) * (input.energy < 25 ? 0.7 : 1),
  );
  if (income) recordTransaction('Подработка', income);
  if (input.energy < 25 && job.income > 0)
    warnings.push('Из-за истощения доход от подработки снижен на 30%.');
  recordTransaction(housing.name, -Math.round(housing.cost * monthlyConditions.inflation));
  recordTransaction('Продукты', -Math.round(8500 * monthlyConditions.inflation));
  recordTransaction('Транспорт', -Math.round(housing.transport * monthlyConditions.inflation));
  recordTransaction('Связь и бытовые расходы', -Math.round(900 * monthlyConditions.inflation));
  recordTransaction('Отдых и личные траты', -selectedPlan.leisure);
  if (development.cost) recordTransaction('Развитие: ' + development.name, -development.cost);
  if (development.income) recordTransaction('Развитие: ' + development.name, development.income);
  for (const [index, option] of selectedOptions.entries()) {
    if (option.cost) recordTransaction('Событие: ' + option.title, -option.cost);
    if (option.income) recordTransaction('Событие: ' + option.title, option.income);
    if (option.loan)
      state.loans.push({
        id: `event-${month}${index ? '-' + index : ''}`,
        name: 'Ремонт частями',
        balance: option.loan,
        rate: 0,
        remaining: 5,
        payment: option.loan / 5,
        monthlyFee: 0,
      });
    if (option.delayed)
      state.pending.push({ due: month + option.delayed.after, ...option.delayed });
  }

  // Новые вещи оплачиваются сейчас; в этом месяце помогают только уже купленные.
  const owned = roomInventory(input);
  const effects = roomEffects(input);
  const purchased = selectedPlan.roomBuy || [];
  const gifted = roomGifts(selectedPlan, month).filter((id) => !owned.includes(id));
  for (const id of purchased)
    recordTransaction('Комната: ' + ROOM_ITEMS[id].name, -ROOM_ITEMS[id].cost);
  if (purchased.length || gifted.length)
    state.roomItems = [...new Set([...owned, ...purchased, ...gifted])];

  // Переводы в активы разрешены только после покрытия расходов месяца.
  if (selectedPlan.save + selectedPlan.invest > Math.max(0, state.cash) + 0.01)
    throw new Error('На переводы не хватает денег. Уменьши пополнение накоплений или фонда.');
  if (selectedPlan.save) {
    recordTransaction('На накопительный счёт', -selectedPlan.save, 'transfer');
    state.savings = roundMoney(state.savings + selectedPlan.save);
  }
  if (selectedPlan.invest) {
    recordTransaction('Покупка доли фонда', -selectedPlan.invest, 'transfer');
    state.fund = roundMoney(state.fund + selectedPlan.invest);
  }

  // Прогноз не раскрывает скрытые потери и результат текущего рынка.
  if (reveal)
    for (const option of selectedOptions)
      if (option.hiddenLoss) recordTransaction('Потеря: ' + option.title, -option.hiddenLoss);
  state.education = clamp(
    state.education -
      rules.educationDecay +
      study.gain +
      job.education +
      sumOptionEffects('education') -
      (input.energy < 25 ? 3 : 0) +
      effects.education,
  );
  const installation = purchased.reduce((sum, id) => sum + ROOM_ITEMS[id].hours, 0);
  state.energy = clamp(
    Math.round(
      state.energy +
        rules.recovery +
        selectedPlan.leisure / 800 -
        job.fatigue -
        selectedPlan.study / 10 -
        housing.hours / 8 -
        sumOptionEffects('hours') / 6 -
        installation / 6 +
        sumOptionEffects('energy') +
        effects.energy -
        development.energy,
    ),
  );
  state.skills += sumOptionEffects('skills');
  let developmentSkills = completedCourses;
  if (selectedPlan.development === 'self') {
    const sessions = (input.developmentProgress === 1 ? 1 : 0) + 1;
    state.developmentProgress = sessions === 2 ? 0 : 1;
    if (sessions === 2) {
      state.skills++;
      developmentSkills++;
    }
  } else if (selectedPlan.development === 'course') {
    state.pending.push({
      due: month + 1,
      skills: 1,
      title: 'Практический курс: завершение',
      development: 'course',
    });
  } else if (selectedPlan.development === 'internship') {
    state.skills++;
    developmentSkills++;
  }
  state.safety = clamp(state.safety + sumOptionEffects('safety'), 0, 10);
  if (state.cash < 0) {
    state.deficits++;
    warnings.push(
      'Бюджет ушёл в минус. В следующем месяце дефицит нужно закрыть; его стоимость в модели — 3% в месяц.',
    );
  }
  if (state.education < 50) warnings.push('Под угрозой стипендия следующего месяца.');
  if (state.energy < 35) warnings.push('Ресурс заканчивается: пересмотри нагрузку и отдых.');
  if (difficulty === 'hardcore') {
    const failures = [
      state.cash < 0 ? 'дефицит' : '',
      state.education < 35 ? 'провал учёбы ниже 35' : '',
      state.energy < 15 ? 'истощение ниже 15' : '',
    ].filter(Boolean);
    if (failures.length)
      state.hardcoreFailures = [
        ...(input.hardcoreFailures || []),
        `${MONTHS[month]}: ${failures.join(', ')}`,
      ];
    if (state.hardcoreFailures?.length)
      warnings.push(
        'Условия хардкора нарушены. Историю можно закончить, но победа в этом прохождении уже недоступна.',
      );
  }
  return {
    month,
    before,
    after: state,
    plan: selectedPlan,
    ledger: ledger.filter((x) => x.amount !== 0),
    explanation: mainOption.explanation,
    warnings,
    hours: planHours(selectedPlan, month),
    net: roundMoney(capital(state) - capital(before)),
    interest,
    market,
    score: evaluate(state, goal, selectedPlan, month, difficulty).total,
    ...((selectedPlan.development && selectedPlan.development !== 'none') || completedCourses
      ? {
          development: {
            action: selectedPlan.development || 'none',
            skillsGained: developmentSkills,
            selfProgress: state.developmentProgress || 0,
            completedCourses,
          },
        }
      : {}),
    ...(selectedPlan.extras
      ? {
          extras: extraDecisions.map((x) => ({
            scenario: x.event.scenario,
            choice: x.event.choice,
            explanation: x.option?.explanation || '',
          })),
        }
      : {}),
    ...(selectedPlan.roomVersion === 1 || owned.length || purchased.length
      ? { room: { purchased, gifted, ...effects } }
      : {}),
  };
}
