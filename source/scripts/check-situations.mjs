import assert from 'node:assert/strict';
import { loadModule } from './load-module.mjs';

const g = await loadModule('../lib/game.ts');

let checks = 0;
const check = (name, run) => {
  run();
  checks++;
  console.log('PASS ' + name);
};
const extras = (month, seed = 42) =>
  g.extraSituationIds(month, seed, 2).map((scenario) => ({
    scenario,
    choice: g.EXTRA_SITUATIONS[scenario].scenario.options.at(-1).id,
  }));
check('Legacy saves retain their original 36 stories and three-choice definitions', () => {
  const all = [...g.SCENARIOS, ...Object.values(g.EXTRA_SITUATIONS).map((x) => x.scenario)];
  assert.equal(all.length, 36);
  assert.equal(new Set(all.map((s) => s.title)).size, 36);
  assert.ok(all.every((s) => s.options.length === 3));
  for (let m = 0; m < 12; m++)
    assert.equal(Object.values(g.EXTRA_SITUATIONS).filter((x) => x.month === m).length, 2);
});
check(
  'Additional decisions contribute their real costs and time to the same monthly budget',
  () => {
    const base = { ...g.defaultPlan(0), choice: 'service' },
      r = g.settle(g.initialState(), base, 0);
    const all = g.settle(
      g.initialState(),
      {
        ...base,
        extras: [
          { scenario: '0-0', choice: 'deposit' },
          { scenario: '0-1', choice: 'taxi' },
        ],
      },
      0,
    );
    assert.equal(r.after.cash - all.after.cash, 7000);
    assert.equal(all.ledger.filter((x) => x.label.startsWith('Событие:')).length, 3);
    const timed = {
      ...base,
      extras: [
        { scenario: '0-0', choice: 'visit' },
        { scenario: '0-1', choice: 'route' },
      ],
    };
    assert.equal(g.planHours(timed, 0) - g.planHours(base, 0), 7);
  },
);
check(
  'A month cannot finish until all decisions are made; incomplete forecasts remain available',
  () => {
    const p = {
      ...g.defaultPlan(0),
      extras: [
        { scenario: '0-0', choice: '' },
        { scenario: '0-1', choice: 'route' },
      ],
    };
    assert.match(g.validatePlan(p, g.initialState(), 0), /каждой ситуации/);
    assert.equal(g.validatePlan(p, g.initialState(), 0, true), null);
    assert.throws(() => g.settle(g.initialState(), p, 0));
    assert.ok(Number.isFinite(g.settle(g.initialState(), p, 0, 'capital', false).after.cash));
  },
);
check('Decisions cannot be duplicated or taken from a different month', () => {
  for (const list of [
    [{ scenario: '1-0', choice: 'pass' }],
    [
      { scenario: '0-0', choice: 'dorm' },
      { scenario: '0-0', choice: 'dorm' },
    ],
    [{ scenario: 'bad', choice: 'bad' }],
  ])
    assert.ok(g.validatePlan({ ...g.defaultPlan(0), extras: list }, g.initialState(), 0));
});
check('The sum of all three situations can exceed the time limit and is rejected', () => {
  const p = {
    ...g.defaultPlan(7),
    job: 'part',
    choice: 'paid',
    extras: [
      { scenario: '7-0', choice: 'free' },
      { scenario: '7-1', choice: 'lead' },
    ],
  };
  assert.equal(g.planHours(p, 7), 150);
  assert.match(g.validatePlan(p, g.initialState(), 7), /не хватает времени/);
});
check('Hidden losses in an additional situation are revealed only after the monthly move', () => {
  const p = {
    ...g.defaultPlan(5),
    choice: 'official',
    extras: [
      { scenario: '5-0', choice: 'form' },
      { scenario: '5-1', choice: 'offline' },
    ],
  };
  const forecast = g.settle(g.initialState(), p, 5, 'capital', false),
    actual = g.settle(g.initialState(), p, 5);
  assert.equal(forecast.after.cash - actual.after.cash, 3500);
  assert.ok(actual.ledger.some((x) => x.amount === -3500));
  assert.equal(actual.extras.length, 2);
});
let balanced = [];
check(
  'All 36 situations complete on every difficulty with correct ledgers and immutable input plans',
  () => {
    for (const level of Object.keys(g.DIFFICULTIES)) {
      let state = g.initialState(level);
      const reports = [],
        seen = new Set();
      for (let m = 0; m < 12; m++) {
        const p = {
          ...g.defaultPlan(m),
          extras: extras(m),
          ...(level === 'hardcore' ? { job: 'none', study: 16 } : {}),
        };
        const snapshot = JSON.stringify(p);
        assert.equal(g.validatePlan(p, state, m, false, level), null);
        const r = g.settle(state, p, m, 'capital', true, level);
        assert.equal(JSON.stringify(p), snapshot);
        assert.ok(
          Math.abs(state.cash + r.ledger.reduce((sum, x) => sum + x.amount, 0) - r.after.cash) <
            0.03,
        );
        assert.equal(r.extras.length, 2);
        seen.add('main-' + m);
        p.extras.forEach((x) => seen.add(x.scenario));
        reports.push(r);
        state = r.after;
      }
      assert.equal(seen.size, 36);
      assert.equal(reports.length, 12);
      assert.deepEqual(g.replay(reports, 0, reports[0].plan.choice, 'capital', level).state, state);
      if (level === 'balance') balanced = reports;
    }
  },
);
check(
  'Alternative replay changes the primary decision and retains every additional decision',
  () => {
    const snapshot = JSON.stringify(balanced),
      other = g.replay(balanced, 0, 'new', 'capital');
    assert.equal(JSON.stringify(balanced), snapshot);
    assert.equal(other.reports.length, 12);
    for (let m = 0; m < 12; m++)
      assert.deepEqual(other.reports[m].plan.extras, balanced[m].plan.extras);
    assert.notEqual(g.capital(other.state), g.capital(balanced.at(-1).after));
  },
);
check('Legacy and new reports can share one continuing game without reapplying old events', () => {
  let state = g.initialState();
  const reports = [];
  for (let m = 0; m < 12; m++) {
    const p = { ...g.defaultPlan(m), ...(m > 2 ? { extras: extras(m) } : {}) };
    const r = g.settle(state, p, m);
    reports.push(r);
    state = r.after;
  }
  assert.equal(reports[0].extras, undefined);
  assert.equal(reports[3].extras.length, 2);
  assert.deepEqual(g.replay(reports, 0, reports[0].plan.choice, 'capital').state, state);
});
console.log(JSON.stringify({ status: 'PASS', checks, legacySituations: 36 }));
