import assert from 'node:assert/strict';
import { loadModule } from './load-module.mjs';

const g = await loadModule('../lib/game.ts');

let checks = 0;
const check = (name, run) => {
  run();
  checks++;
  console.log('PASS ' + name);
};
const selected = (ids, m) => ({
  ...g.defaultPlan(m),
  job: 'none',
  scenario: ids[0],
  choice: g.getScenario(ids[0]).options.at(-1).id,
  extras: ids
    .slice(1)
    .map((scenario) => ({ scenario, choice: g.getScenario(scenario).options.at(-1).id })),
});
check('60 unique complete illustrated stories offer 180 meaningful choices', () => {
  assert.equal(g.SITUATION_IDS.length, 60);
  assert.equal(new Set(g.SITUATION_IDS).size, 60);
  const stories = g.SITUATION_IDS.map(g.getScenario);
  assert.equal(new Set(stories.map((s) => s.title)).size, 60);
  for (const s of stories) {
    assert.ok(s.lead && s.document.text && s.discussion);
    assert.equal(s.options.length, 3);
    assert.equal(new Set(s.options.map((o) => o.id)).size, 3);
    assert.ok(s.options.every((o) => o.title && o.description && o.explanation));
  }
});
check(
  '1000 years have 1–3 random stories per month, no repeats, and all stories can appear in every month',
  () => {
    const counts = [0, 0, 0],
      byMonth = Array.from({ length: 12 }, () => new Set()),
      years = new Set();
    for (let seed = 0; seed < 1000; seed++) {
      const schedule = g.createStorySchedule(seed);
      assert.equal(schedule.length, 12);
      assert.equal(new Set(schedule.flat()).size, schedule.flat().length);
      for (let m = 0; m < 12; m++) {
        const ids = schedule[m];
        assert.ok(ids.length >= 1 && ids.length <= 3);
        counts[ids.length - 1]++;
        ids.forEach((id) => {
          assert.ok(g.getScenario(id));
          byMonth[m].add(id);
        });
      }
      years.add(JSON.stringify(schedule));
      assert.deepEqual(g.createStorySchedule(seed), schedule);
    }
    assert.equal(years.size, 1000);
    assert.ok(counts.every((n) => n > 3500 && n < 4500));
    assert.ok(byMonth.every((set) => set.size === 60));
    console.log('  Monthly counts across 12000 draws:', counts.join(' / '));
  },
);
check(
  'Saved schedules survive serialization and invalid schedules are repaired deterministically',
  () => {
    const data = { storySeed: 812, plans: [], storySchedule: g.createStorySchedule(812) },
      saved = JSON.parse(JSON.stringify(data));
    assert.deepEqual(g.ensureStorySchedule(saved), data.storySchedule);
    for (const bad of [
      [],
      Array(12).fill(['bad']),
      Array(12).fill(['qr']),
      [...data.storySchedule.slice(0, 11), []],
    ]) {
      assert.deepEqual(g.ensureStorySchedule({ ...data, storySchedule: bad }), data.storySchedule);
    }
  },
);
check(
  'Migration preserves completed legacy plans and excludes their stories from future draws',
  () => {
    const plans = [0, 1, 2].map((m) => ({
        ...g.defaultPlan(m),
        extras: g
          .extraSituationIds(m, 42, 2)
          .map((scenario) => ({ scenario, choice: g.getScenario(scenario).options.at(-1).id })),
      })),
      snapshot = JSON.stringify(plans);
    const schedule = g.ensureStorySchedule({ storySeed: 99, plans });
    assert.deepEqual(schedule.slice(0, 3), plans.map(g.planSituationIds));
    assert.equal(new Set(schedule.flat()).size, schedule.flat().length);
    assert.equal(JSON.stringify(plans), snapshot);
  },
);
check(
  'Any of the 60 stories can be first or additional; all 180 choices settle in any month and difficulty',
  () => {
    for (const difficulty of Object.keys(g.DIFFICULTIES))
      for (let m = 0; m < 12; m++)
        for (const scenario of g.SITUATION_IDS)
          for (const o of g.getScenario(scenario).options) {
            const state = { ...g.initialState(difficulty), cash: 100000 },
              p = {
                ...g.defaultPlan(m),
                job: 'none',
                study: 16,
                scenario,
                choice: o.id,
                extras: [],
              };
            assert.equal(g.validatePlan(p, state, m, false, difficulty), null);
            const base = g.settle(state, { ...p, choice: '' }, m, 'capital', false, difficulty),
              actual = g.settle(state, p, m, 'capital', true, difficulty);
            assert.ok(
              Math.abs(
                actual.after.cash -
                  base.after.cash -
                  ((o.income || 0) - (o.cost || 0) - (o.hiddenLoss || 0)),
              ) < 0.01,
              `${scenario}/${o.id}`,
            );
            const other = scenario === 'qr' ? 'wallet' : 'qr',
              combined = {
                ...p,
                scenario: other,
                choice: g.getScenario(other).options.at(-1).id,
                extras: [{ scenario, choice: o.id }],
              };
            assert.equal(g.validatePlan(combined, state, m, false, difficulty), null);
            assert.equal(
              g.settle(state, combined, m, 'capital', true, difficulty).extras[0].scenario,
              scenario,
            );
          }
  },
);
check('Unknown and duplicate story ids are rejected even when option ids coincide', () => {
  const state = g.initialState();
  for (const p of [
    selected(['qr', 'qr'], 0),
    { ...selected(['qr'], 0), scenario: 'missing' },
    { ...selected(['qr'], 0), extras: [{ scenario: 'missing', choice: 'a' }] },
  ])
    assert.ok(g.validatePlan(p, state, 0));
  const p = selected(['qr', 'parcel', 'backup'], 0);
  p.extras[1].choice = '';
  assert.match(g.validatePlan(p, state, 0), /каждой ситуации/);
  assert.equal(g.validatePlan(p, state, 0, true), null);
});
check(
  'Twenty seeded years per difficulty settle and replay identically without changing schedules',
  () => {
    for (const difficulty of Object.keys(g.DIFFICULTIES))
      for (let seed = 0; seed < 20; seed++) {
        let state = g.initialState(difficulty);
        const reports = [],
          schedule = g.createStorySchedule(seed),
          snapshot = JSON.stringify(schedule);
        for (let m = 0; m < 12; m++) {
          const p = selected(schedule[m], m),
            r = g.settle(state, p, m, 'capital', true, difficulty);
          assert.deepEqual(g.planSituationIds(r.plan, m), schedule[m]);
          assert.equal(r.extras.length, schedule[m].length - 1);
          reports.push(r);
          state = r.after;
        }
        assert.deepEqual(
          g.replay(reports, 0, reports[0].plan.choice, 'capital', difficulty).state,
          state,
        );
        assert.equal(JSON.stringify(schedule), snapshot);
      }
  },
);
check(
  'Changing a randomized primary decision keeps actual story ids and all other decisions',
  () => {
    const schedule = g.createStorySchedule(725);
    let state = g.initialState();
    const reports = [];
    for (let m = 0; m < 12; m++) {
      const r = g.settle(state, selected(schedule[m], m), m);
      reports.push(r);
      state = r.after;
    }
    const snapshot = JSON.stringify(reports),
      choice = g.getScenario(schedule[0][0]).options[0].id,
      alt = g.replay(reports, 0, choice, 'capital');
    assert.equal(JSON.stringify(reports), snapshot);
    assert.equal(alt.reports[0].plan.choice, choice);
    alt.reports.forEach((r, m) => {
      assert.deepEqual(g.planSituationIds(r.plan, m), schedule[m]);
      assert.deepEqual(r.plan.extras, reports[m].plan.extras);
    });
  },
);
check('New security scenes reveal losses only on completion and grant support arrives once', () => {
  for (const scenario of ['qr', 'card-courier', 'parcel', 'software']) {
    const o = g.getScenario(scenario).options.find((o) => o.hiddenLoss),
      p = { ...selected([scenario], 0), choice: o.id },
      state = g.initialState();
    assert.equal(
      g.settle(state, p, 0, 'capital', false).after.cash - g.settle(state, p, 0).after.cash,
      o.hiddenLoss,
    );
  }
  const p = { ...selected(['grant'], 0), choice: 'a' },
    r = g.settle(g.initialState(), p, 0),
    next = g.settle(r.after, selected(['wallet'], 1), 1),
    last = g.settle(next.after, selected(['pass'], 2), 2);
  assert.equal(r.after.pending[0].cash, 6000);
  assert.equal(next.ledger.filter((x) => x.label === 'Поддержка учебного проекта').length, 1);
  assert.equal(last.ledger.filter((x) => x.label === 'Поддержка учебного проекта').length, 0);
});
console.log(JSON.stringify({ status: 'PASS', checks, pool: g.SITUATION_IDS.length }));
