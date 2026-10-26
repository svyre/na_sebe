import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadModule } from './load-module.mjs';

const g = await loadModule('../lib/game.ts');
const storage = await loadModule('../lib/storage.ts');
let checks = 0;
function check(name, run) {
  run();
  checks++;
  console.log('PASS ' + name);
}
const start = () => ({ ...g.initialState(), cash: 100000, energy: 50 });
const workPay = (report) =>
  report.ledger.find((entry) => entry.label === 'Подработка')?.amount || 0;

check('A course charges once, reserves time and energy, and does not raise current pay', () => {
  const state = start(),
    snapshot = JSON.stringify(state),
    plan = g.defaultPlan();
  const base = g.settle(state, plan, 0),
    course = g.settle(state, { ...plan, development: 'course' }, 0);
  assert.equal(base.after.cash - course.after.cash, 5000);
  assert.equal(course.hours - base.hours, 20);
  assert.equal(base.after.energy - course.after.energy, 5);
  assert.equal(course.after.skills, base.after.skills);
  assert.equal(workPay(base), workPay(course));
  assert.equal(course.after.pending.filter((e) => e.development === 'course').length, 1);
  assert.equal(JSON.stringify(state), snapshot);
});
check('Course completion raises next-month work pay by 700 exactly once', () => {
  const first = g.settle(start(), { ...g.defaultPlan(), development: 'course' }, 0);
  const without = { ...first.after, pending: first.after.pending.filter((e) => !e.development) };
  const next = g.settle(first.after, g.defaultPlan(1), 1),
    control = g.settle(without, g.defaultPlan(1), 1);
  assert.equal(workPay(next) - workPay(control), 700);
  assert.equal(next.development.completedCourses, 1);
  assert(!next.after.pending.some((e) => e.development === 'course'));
  const later = g.settle(next.after, g.defaultPlan(2), 2);
  assert.equal(later.development, undefined);
  assert.equal(g.skillsForWork(first.after, 1), first.after.skills + 1);
});
check('Two self-study sessions grant one skill and a break preserves progress', () => {
  const first = g.settle(start(), { ...g.defaultPlan(), development: 'self' }, 0);
  assert.equal(first.after.developmentProgress, 1);
  assert.equal(first.development.skillsGained, 0);
  const pause = g.settle(first.after, g.defaultPlan(1), 1);
  assert.equal(pause.after.developmentProgress, 1);
  const control = g.settle(pause.after, g.defaultPlan(2), 2);
  const second = g.settle(pause.after, { ...g.defaultPlan(2), development: 'self' }, 2);
  assert.equal(second.after.developmentProgress, 0);
  assert.equal(second.after.skills - control.after.skills, 1);
  assert.equal(workPay(second), workPay(control));
  assert.equal(second.development.skillsGained, 1);
});
check('Internship income is current, while its skill changes pay only next month', () => {
  const state = start(),
    plan = g.defaultPlan(),
    base = g.settle(state, plan, 0),
    r = g.settle(state, { ...plan, development: 'internship' }, 0);
  assert.equal(r.after.cash - base.after.cash, 2000);
  assert.equal(r.after.skills - base.after.skills, 1);
  assert.equal(r.hours - base.hours, 24);
  assert.equal(base.after.energy - r.after.energy, 10);
  assert.equal(workPay(r), workPay(base));
  assert.equal(
    workPay(g.settle(r.after, g.defaultPlan(1), 1)) -
      workPay(g.settle(base.after, g.defaultPlan(1), 1)),
    700,
  );
});
check('Unknown and multiple development choices are rejected; training cannot exceed time', () => {
  for (const development of ['bad', ['course', 'self'], ['course'], null, 42, '__proto__'])
    assert(g.validatePlan({ ...g.defaultPlan(), development }, start(), 0));
  const plan = { ...g.defaultPlan(), job: 'part', study: 48 };
  assert.equal(g.validatePlan(plan, start(), 0), null);
  assert.match(g.validatePlan({ ...plan, development: 'internship' }, start(), 0), /времени/);
});
check('Course money cannot also be transferred to savings', () => {
  const state = start(),
    plan = g.defaultPlan(),
    base = g.settle(state, plan, 0);
  assert.throws(
    () => g.settle(state, { ...plan, save: Math.floor(base.after.cash), development: 'course' }, 0),
    /На переводы/,
  );
});
check('Forecast does not mutate study progress or enrol the actual saved state', () => {
  const state = start(),
    before = JSON.stringify(state);
  const forecast = g.settle(
    state,
    { ...g.defaultPlan(), development: 'course' },
    0,
    'capital',
    false,
  );
  assert.equal(JSON.stringify(state), before);
  assert.equal(forecast.after.pending.filter((e) => e.development === 'course').length, 1);
});
check('An August course remains pending beyond the year and gives no early skill', () => {
  const state = start(),
    base = g.settle(state, g.defaultPlan(11), 11);
  const course = g.settle(state, { ...g.defaultPlan(11), development: 'course' }, 11);
  assert.equal(course.after.skills, base.after.skills);
  assert(course.after.pending.some((e) => e.development === 'course' && e.due === 12));
});
check('Study progress and pending courses survive save/load with the old save key', () => {
  let raw;
  const mock = { getItem: () => raw, setItem: (_, value) => (raw = value) };
  const first = g.settle(start(), { ...g.defaultPlan(), development: 'self' }, 0);
  const second = g.settle(first.after, { ...g.defaultPlan(1), development: 'course' }, 1);
  const saved = {
    name: 'Прогресс',
    goal: 'career',
    difficulty: 'hardcore',
    character: 'girl',
    month: 2,
    state: second.after,
    plans: [first.plan, second.plan],
    reports: [first, second],
    storySeed: 42,
  };
  assert(storage.saveGame(saved, mock));
  const read = storage.loadGame(mock);
  assert.equal(read.difficulty, 'hardcore');
  assert.deepEqual(read.state, saved.state);
  assert.equal(read.state.developmentProgress, 1);
});
check('Hardcore calendar exposes exams and summer support before decisions', () => {
  assert.equal(g.monthRules('hardcore', 0).hours, 108);
  assert.equal(g.monthRules('hardcore', 4).hours, 96);
  assert.equal(g.monthRules('hardcore', 9).hours, 96);
  assert.equal(g.monthRules('hardcore', 5).support, 14000);
  assert.equal(g.monthRules('hardcore', 9).support, 10000);
  assert.equal(g.monthRules('balance', 9).hours, 128);
  assert.equal(g.monthRules('balance', 9).support, 18000);
});
check('Hardcore recovery and study decay are stricter than the original rules', () => {
  const state = start(),
    plan = g.defaultPlan();
  const a = g.settle(state, plan, 0),
    b = g.settle(state, plan, 0, 'capital', true, 'hardcore');
  assert.equal(a.after.energy - b.after.energy, 8);
  assert.equal(a.after.education - b.after.education, 1);
});
check('Each critical hardcore failure persists after recovery and blocks victory', () => {
  for (const patch of [{ cash: -100000 }, { education: 5 }, { energy: 1 }]) {
    const r = g.settle({ ...start(), ...patch }, g.defaultPlan(), 0, 'capital', true, 'hardcore');
    assert(r.after.hardcoreFailures.length > 0);
    const recovered = {
      ...r.after,
      cash: 300000,
      savings: 100000,
      education: 100,
      energy: 100,
      skills: 10,
      safety: 10,
      loans: [],
      pending: [],
    };
    assert.equal(g.evaluate(recovered, 'capital', g.defaultPlan(), 11, 'hardcore').achieved, false);
    assert(g.evaluate(recovered, 'capital', g.defaultPlan(), 11, 'hardcore').total < 100);
  }
});
check('A hidden fraud loss does not leak through a hardcore forecast', () => {
  const state = { ...g.initialState('hardcore'), cash: 0 },
    plan = { ...g.defaultPlan(5), choice: 'code' };
  const snapshot = JSON.stringify(state),
    preview = g.settle(state, plan, 5, 'capital', false, 'hardcore'),
    actual = g.settle(state, plan, 5, 'capital', true, 'hardcore');
  assert.equal(preview.after.hardcoreFailures, undefined);
  assert(actual.after.hardcoreFailures.length);
  assert.equal(JSON.stringify(state), snapshot);
});
check('Hardcore needs safety, liquid reserve, no loans and no future debt at the finish', () => {
  const state = {
    ...g.initialState('hardcore'),
    cash: 300000,
    skills: 10,
    education: 100,
    energy: 100,
    safety: 10,
  };
  assert(g.evaluate(state, 'freedom', g.defaultPlan(), 11, 'hardcore').achieved);
  for (const patch of [
    { education: 64 },
    { energy: 44 },
    { safety: 7 },
    { cash: 0, savings: 0, fund: 300000 },
    { deficits: 1 },
    { pending: [{ due: 12, cash: -100, title: 'Платёж' }] },
    { loans: [{ balance: 100 }] },
  ])
    assert(
      !g.evaluate({ ...state, ...patch }, 'capital', g.defaultPlan(), 11, 'hardcore').achieved,
    );
});
check('A planned randomized hardcore year wins every goal and replays exactly', () => {
  const fixture = JSON.parse(
    fs.readFileSync(new URL('./fixtures/hardcore-year.json', import.meta.url), 'utf8'),
  );
  for (const route of [fixture, ...(fixture.additionalRoutes || [])])
    for (const goal of Object.keys(g.GOALS)) {
      let state = g.initialState('hardcore');
      const reports = [];
      const schedule = g.createStorySchedule(route.seed);
      route.plans.forEach((plan, month) => {
        assert.deepEqual(g.planSituationIds(plan, month), schedule[month]);
        const r = g.settle(state, plan, month, goal, true, 'hardcore');
        reports.push(r);
        state = r.after;
        assert(!state.hardcoreFailures?.length);
      });
      assert(g.evaluate(state, goal, route.plans.at(-1), 11, 'hardcore').achieved);
      assert.deepEqual(g.replay(reports, 0, reports[0].plan.choice, goal, 'hardcore').state, state);
    }
});
check('Training and future completion replay without applying a reward twice', () => {
  let state = start();
  const reports = [];
  for (let month = 0; month < 12; month++) {
    const development = ['course', 'self', 'internship', 'course', 'self'][month] || 'none';
    const r = g.settle(state, { ...g.defaultPlan(month), development }, month);
    reports.push(r);
    state = r.after;
  }
  // Start the same route from the documented initial state for the replay contract.
  let initial = g.initialState();
  const actual = reports.map((r) => {
    const next = g.settle(initial, r.plan, r.month);
    initial = next.after;
    return next;
  });
  assert.deepEqual(g.replay(actual, 0, actual[0].plan.choice, 'capital').state, initial);
});
console.log(JSON.stringify({ status: 'PASS', checks }));
