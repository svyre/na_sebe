import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadModule } from './load-module.mjs';
const g = await loadModule('../lib/game.ts');
const { loadGame, saveGame } = await loadModule('../lib/storage.ts');
const { extraStory } = await loadModule('../lib/story-presentation.ts');
const { storyLocation } = await loadModule('../lib/locations.ts');
let checks = 0;
const check = (name, run) => {
  run();
  checks++;
  console.log('PASS ' + name);
};
const wealthy = (patch = {}) => ({
  ...g.initialState('balance', 3),
  cash: 1000000,
  skills: 6,
  ...patch,
});
const plan = (month, patch = {}) => ({
  ...g.defaultPlan(month),
  job: 'none',
  study: 16,
  leisure: 3000,
  scenario: 'wallet',
  choice: g.getScenario('wallet').options.at(-1).id,
  ...patch,
});
const complete = (state, month, patch = {}) => g.settle(state, plan(month, patch), month);
const memory = () => {
  const values = new Map();
  return { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
};

check('72 new authored situations give 132 distinct illustrated stories and 396 choices', () => {
  const ids = [...g.SITUATION_IDS, ...g.CAMPAIGN_SITUATION_IDS];
  assert.equal(g.SITUATION_IDS.length, 60);
  assert.equal(g.CAMPAIGN_SITUATION_IDS.length, 72);
  assert.equal(new Set(ids).size, 132);
  assert.equal(new Set(ids.map((id) => g.getScenario(id).title)).size, 132);
  for (const id of g.CAMPAIGN_SITUATION_IDS) {
    const meta = g.CAMPAIGN_STORIES[id],
      scenario = g.getScenario(id),
      art = extraStory(id, meta.year === 2 ? 12 : 24);
    assert.equal(scenario.options.length, 3);
    assert.equal(new Set(scenario.options.map((o) => o.id)).size, 3);
    assert(scenario.lead && scenario.document.text && scenario.discussion);
    assert.equal(art.props.length, 3);
    assert(art.place && art.line);
    assert.equal(storyLocation(id), meta.location);
    assert(scenario.options.every((o) => o.title && o.description && o.explanation));
  }
});
check('Campaign duration defaults to the original year and accepts 24 or 36 months', () => {
  assert.equal(g.campaignMonths(g.initialState()), 12);
  assert(!Object.hasOwn(g.initialState(), 'years'));
  assert.equal(g.campaignMonths(g.initialState('balance', 2)), 24);
  assert.equal(g.campaignMonths(g.initialState('balance', 3)), 36);
  assert.equal(g.campaignGoal('capital', 1).target, 100000);
  assert.equal(g.campaignGoal('freedom', 3).target, 700000);
  assert.equal(g.campaignGoal('career', 3).skills, 12);
  assert.equal(g.monthLabel(12), 'Сентябрь · год 2');
  assert.equal(g.monthLabel(35), 'Август · год 3');
});
check('The first-year draw is identical and later months stay undrawn until they start', () => {
  for (const years of [2, 3]) {
    const data = { state: g.initialState('balance', years), month: 0, plans: [], storySeed: 42 };
    const schedule = g.ensureStorySchedule(data);
    assert.deepEqual(schedule.slice(0, 12), g.createStorySchedule(42));
    assert.equal(schedule.length, years * 12);
    assert(schedule.slice(12).every((ids) => ids.length === 0));
  }
});
check(
  '300 three-year draws have no repeated stories and honour ownership and year prerequisites',
  () => {
    for (let seed = 0; seed < 300; seed++) {
      const data = { state: g.initialState('balance', 3), month: 0, plans: [], storySeed: seed };
      const seen = new Set();
      for (let month = 0; month < 36; month++) {
        data.month = month;
        data.state.cash = seed % 2 ? 15000 : 500000;
        if (seed % 3 === 0 && month >= 14 && month < 25)
          data.state.car = { model: 'compact', value: 150000, bought: 14 };
        else delete data.state.car;
        if (seed % 4 === 0 && month >= 16)
          data.state.business = { level: 1, paused: false, opened: 16 };
        data.storySchedule = g.ensureStorySchedule(data);
        const ids = data.storySchedule[month];
        assert(ids.length >= 1 && ids.length <= 3);
        for (const id of ids) {
          assert(!seen.has(id), `${seed}, ${month}: duplicate ${id}`);
          seen.add(id);
          const meta = g.CAMPAIGN_STORIES[id];
          if (meta) {
            assert(meta.year <= Math.floor(month / 12) + 1);
            if (meta.requires === 'car') assert(data.state.car);
            if (meta.requires === 'business')
              assert(data.state.business && !data.state.business.paused);
          }
        }
        assert.deepEqual(g.ensureStorySchedule(data), data.storySchedule);
        data.plans.push(
          plan(month, {
            scenario: ids[0],
            choice: g.getScenario(ids[0]).options.at(-1).id,
            extras: ids
              .slice(1)
              .map((scenario) => ({ scenario, choice: g.getScenario(scenario).options.at(-1).id })),
          }),
        );
      }
    }
  },
);
check('Budget changes the mix of offered situations without rerolling an opened month', () => {
  const first = g.createStorySchedule(42);
  const plans = first.map((ids, m) =>
    plan(m, {
      scenario: ids[0],
      choice: g.getScenario(ids[0]).options.at(-1).id,
      extras: ids
        .slice(1)
        .map((scenario) => ({ scenario, choice: g.getScenario(scenario).options.at(-1).id })),
    }),
  );
  let low = 0,
    high = 0;
  for (let seed = 0; seed < 1000; seed++) {
    for (const rich of [false, true]) {
      const data = {
        state: wealthy({ cash: rich ? 500000 : 1000, savings: 0 }),
        month: 12,
        plans,
        storySeed: seed,
      };
      const schedule = g.ensureStorySchedule(data);
      if (schedule[12].some((id) => g.CAMPAIGN_STORIES[id]?.budget === 'wealthy'))
        rich ? high++ : low++;
      assert.deepEqual(
        g.ensureStorySchedule({
          ...data,
          state: wealthy({ cash: rich ? 1000 : 500000 }),
          storySchedule: schedule,
        })[12],
        schedule[12],
      );
    }
  }
  assert(high > low * 3, `low=${low}, high=${high}`);
});
check('Every new choice settles at its allowed year without mutating its inputs', () => {
  for (const [id, meta] of Object.entries(g.CAMPAIGN_STORIES))
    for (const option of meta.scenario.options) {
      const state = wealthy({
        ...(meta.requires === 'car'
          ? { car: { model: 'compact', value: 200000, bought: 12 } }
          : {}),
        ...(meta.requires === 'business'
          ? { business: { level: 1, paused: false, opened: 12 } }
          : {}),
      });
      const month = meta.year === 2 ? 12 : 24,
        selected = plan(month, { scenario: id, choice: option.id }),
        before = structuredClone({ state, selected });
      const report = g.settle(state, selected, month);
      assert(Number.isFinite(report.after.cash));
      assert.equal(report.explanation, option.explanation);
      assert.deepEqual({ state, selected }, before);
    }
});
check('Calendar and inflation continue through every January, June and September', () => {
  for (const base of [0, 12, 24]) {
    assert.equal(g.monthRules('hardcore', base + 4).hours, 96);
    assert.equal(g.monthRules('hardcore', base + 9).hours, 96);
    assert.equal(g.monthRules('hardcore', base).hours, 108);
  }
  assert.equal(g.monthRules('balance', 12).support, 13500);
  assert.equal(g.monthRules('balance', 24).support, 9000);
  assert.equal(g.monthRules('hardcore', 33).support, 3000);
  assert(g.macroFor(24).inflation >= g.macroFor(23).inflation);
  assert(g.macroFor(35).inflation > g.macroFor(11).inflation);
});
check('New projects, specialist work and terminal month boundaries are validated', () => {
  const state = wealthy();
  assert(g.validatePlan(plan(11, { project: 'pilot' }), state, 11));
  assert(g.validatePlan(plan(11, { carAction: 'compact' }), state, 11));
  assert(g.validatePlan(plan(11, { termDeposit: 10000 }), state, 11));
  assert(g.validatePlan(plan(12, { job: 'specialist' }), wealthy({ skills: 3 }), 12));
  assert.equal(g.validatePlan(plan(12, { job: 'specialist' }), state, 12), null);
  for (const years of [1, 2, 3]) {
    const s = { ...state, years };
    assert.equal(g.validatePlan(plan(years * 12 - 1), s, years * 12 - 1), null);
    assert(g.validatePlan(plan(years * 12), s, years * 12));
  }
  assert(g.validatePlan(plan(12, { scenario: 'car-tires', choice: 'new' }), state, 12));
});
check('A pilot precedes launch and a new business earns only from the next month', () => {
  const state = wealthy();
  assert(g.validatePlan(plan(12, { project: 'launch' }), state, 12));
  const pilot = complete(state, 12, { project: 'pilot' });
  assert(pilot.after.pilotDone);
  assert(!pilot.after.business);
  assert(g.validatePlan(plan(13, { project: 'pilot' }), pilot.after, 13));
  const launched = complete(pilot.after, 13, { project: 'launch' });
  assert.equal(launched.after.business.level, 1);
  assert.equal(launched.assets.businessNet, 0);
  assert(!launched.ledger.some((e) => e.label === 'Своё дело: выручка'));
  const next = complete(launched.after, 14);
  assert(next.ledger.some((e) => e.label === 'Своё дело: выручка'));
  assert.equal(next.assets.businessHours, 12);
});
check('Expansion, pause, restart and closure change future operations and equipment value', () => {
  const state = wealthy({ business: { level: 1, paused: false, opened: 12 } }),
    expanded = complete(state, 14, { project: 'expand' });
  assert.equal(expanded.after.business.level, 2);
  assert.equal(g.businessValue(expanded.after), 54000);
  assert.equal(expanded.assets.businessHours, 12);
  const paused = complete(expanded.after, 15, { project: 'pause' });
  assert.equal(paused.assets.businessHours, 20);
  assert(paused.after.business.paused);
  const quiet = complete(paused.after, 16);
  assert.equal(quiet.assets.businessNet, -1000);
  assert.equal(quiet.assets.businessHours, 0);
  const resumed = complete(quiet.after, 17, { project: 'resume' });
  assert.equal(resumed.assets.businessNet, -1000);
  assert(!resumed.after.business.paused);
  const closed = complete(resumed.after, 18, { project: 'close' });
  assert(!closed.after.business);
  assert(closed.ledger.some((e) => e.amount === 54000 && e.kind === 'transfer'));
});
check('Business hours and project preparation share the existing monthly time limit', () => {
  const state = wealthy({ business: { level: 2, paused: false, opened: 12 } }),
    p = plan(16);
  assert.equal(g.planHours(p, 16, state) - g.planHours(p, 16), 20);
  assert(g.validatePlan({ ...p, job: 'intense', study: 48 }, state, 16));
});
check('Buying a car costs money and fees; monthly ownership starts after purchase', () => {
  const state = wealthy(),
    baseline = complete(state, 12),
    purchased = complete(state, 12, { carAction: 'compact' });
  assert.equal(purchased.after.car.value, 200000);
  assert.equal(purchased.assets.carCost, 0);
  assert.equal(purchased.after.cash, baseline.after.cash - 220000);
  assert.equal(g.capital(purchased.after), g.capital(baseline.after) - 20000);
  assert.equal(purchased.hours, baseline.hours + 6);
  const owned = complete(purchased.after, 13);
  assert.equal(owned.after.car.value, 198000);
  assert(owned.assets.carCost > 4500);
  assert.equal(g.transportHours(plan(13), purchased.after), 10);
  assert.equal(g.transportHours(plan(13, { housing: 'alone' }), purchased.after), 0);
});
check(
  'A car cannot be duplicated; sale pays the depreciated value and removes future upkeep',
  () => {
    const state = wealthy({ car: { model: 'compact', value: 200000, bought: 12 } });
    assert(g.validatePlan(plan(13, { carAction: 'family' }), state, 13));
    const sold = complete(state, 13, { carAction: 'sell' });
    assert(!sold.after.car);
    assert(sold.ledger.some((e) => e.label === 'Продажа машины' && e.amount === 198000));
    assert(sold.assets.carCost > 0);
    assert.equal(complete(sold.after, 14).assets.carCost, 0);
  },
);
check(
  'A six-month deposit preserves capital, locks liquidity and returns interest exactly once',
  () => {
    const state = wealthy(),
      baseline = complete(state, 12),
      opened = complete(state, 12, { termDeposit: 50000 });
    assert.equal(opened.after.cash, baseline.after.cash - 50000);
    assert.equal(g.capital(opened.after), g.capital(baseline.after));
    assert.equal(opened.after.deposits[0].due, 18);
    let s = opened.after,
      expected = 50000;
    for (let month = 13; month <= 18; month++) {
      expected =
        Math.round((expected + Math.round(((expected * 14) / 1200) * 100) / 100) * 100) / 100;
      const report = complete(s, month);
      if (month < 18) {
        assert.equal(report.after.deposits.length, 1);
        assert(!report.ledger.some((e) => e.label.startsWith('Срочный вклад:')));
      } else {
        assert.equal(report.after.deposits.length, 0);
        assert(
          report.ledger.some((e) => e.amount === expected && e.label.startsWith('Срочный вклад:')),
        );
      }
      s = report.after;
    }
    assert(!complete(s, 19).ledger.some((e) => e.label.startsWith('Срочный вклад:')));
  },
);
check('Projects, purchases and bank transfers cannot spend the same cash twice', () => {
  const state = wealthy({ cash: 70000, savings: 0, pilotDone: true }),
    p = plan(12, { project: 'launch', termDeposit: 40000 });
  assert.throws(() => g.settle(state, p, 12), /На проекты/);
  const verified = wealthy({ pilotDone: true });
  const base = complete(verified, 12, { project: 'launch' });
  assert.throws(
    () =>
      g.settle(
        verified,
        plan(12, { project: 'launch', save: Math.floor(base.after.cash) + 1 }),
        12,
      ),
    /На переводы/,
  );
  assert.deepEqual(state, wealthy({ cash: 70000, savings: 0, pilotDone: true }));
});
check('Invalid project actions, deposits and ownership requirements fail before settlement', () => {
  const state = wealthy();
  for (const patch of [
    { project: 'unknown' },
    { project: 'close' },
    { project: 'pause' },
    { project: 'resume' },
    { project: 'expand' },
    { carAction: 'sell' },
    { carAction: 'unknown' },
    { termDeposit: 9000 },
    { termDeposit: 10500 },
    { termDeposit: NaN },
    { termDeposit: -10000 },
  ])
    assert(g.validatePlan(plan(12, patch), state, 12));
});
check('August study can finish in September of year two and then increase work income', () => {
  const state = wealthy(),
    enrolled = complete(state, 11, { development: 'course' });
  assert(enrolled.after.pending.some((p) => p.due === 12));
  const r = complete(enrolled.after, 12, { job: 'flex' });
  assert.equal(r.development.completedCourses, 1);
  assert(
    r.ledger.some((e) => e.label === 'Подработка' && e.amount === 8500 + (state.skills + 1) * 700),
  );
});
check('Old saves remain one year; long saves resume after month 12 and at month 36', () => {
  const storage = memory(),
    old = {
      name: 'Старая игра',
      goal: 'capital',
      difficulty: 'balance',
      month: 12,
      state: g.initialState(),
      plans: [],
      reports: [],
    };
  saveGame(old, storage);
  assert.equal(g.campaignMonths(loadGame(storage).state), 12);
  const long = {
    ...old,
    state: wealthy(),
    month: 12,
    plans: g.createStorySchedule(42).map((ids, m) =>
      plan(m, {
        scenario: ids[0],
        extras: ids
          .slice(1)
          .map((scenario) => ({ scenario, choice: g.getScenario(scenario).options.at(-1).id })),
      }),
    ),
    storySeed: 42,
  };
  long.storySchedule = g.ensureStorySchedule(long);
  saveGame(long, storage);
  assert.deepEqual(loadGame(storage).storySchedule, long.storySchedule);
  saveGame({ ...long, month: 36 }, storage);
  assert.equal(loadGame(storage).month, 36);
  saveGame({ ...long, month: 37 }, storage);
  assert.equal(loadGame(storage), null);
});
check('Illiquid assets count as capital but do not satisfy the hardcore cash reserve', () => {
  const state = wealthy({
    cash: 0,
    savings: 0,
    skills: 15,
    safety: 10,
    education: 100,
    energy: 100,
    car: { model: 'compact', value: 800000, bought: 12 },
  });
  assert(!g.evaluate(state, 'capital', plan(35), 35, 'hardcore').achieved);
  assert(g.evaluate({ ...state, cash: 100000 }, 'capital', plan(35), 35, 'hardcore').achieved);
});
check(
  'Four long campaigns reach every goal, keep their seeded draws and replay every asset exactly',
  () => {
    const fixtures = JSON.parse(
      fs.readFileSync(new URL('./fixtures/campaigns.json', import.meta.url)),
    );
    for (const route of fixtures.routes)
      for (const goal of ['capital', 'career', 'freedom']) {
        const data = {
          state: g.initialState(route.difficulty, route.years),
          month: 0,
          plans: [],
          reports: [],
          storySeed: route.seed,
        };
        for (let month = 0; month < route.years * 12; month++) {
          data.month = month;
          data.storySchedule = g.ensureStorySchedule(data);
          const selected = route.plans[month];
          assert.deepEqual(data.storySchedule[month], g.planSituationIds(selected, month));
          const report = g.settle(data.state, selected, month, goal, true, route.difficulty);
          data.reports.push(report);
          data.plans.push(selected);
          data.state = report.after;
          assert(report.after.cash >= 0);
          if (route.difficulty === 'hardcore') assert(!report.after.hardcoreFailures?.length);
        }
        assert(
          g.evaluate(data.state, goal, data.plans.at(-1), route.years * 12 - 1, route.difficulty)
            .achieved,
        );
        const replay = g.replay(data.reports, 0, data.plans[0].choice, goal, route.difficulty);
        assert.deepEqual(replay.reports, data.reports);
        assert.deepEqual(replay.state, data.state);
      }
  },
);
check(
  'Uncertain investment outcomes stay out of the forecast while agreed payments remain visible',
  () => {
    const state = wealthy(),
      selected = plan(12, { scenario: 'bond-prospectus', choice: 'invest' });
    const before = structuredClone(state),
      option = g.getScenario('bond-prospectus').options.find((o) => o.id === 'invest');
    assert(option.uncertainOutcome);
    assert(!option.description.includes('17'));
    assert(!g.getScenario('bond-prospectus').document.text.includes('17 000'));
    const forecast = g.settle(state, selected, 12, 'capital', false),
      committed = g.settle(state, selected, 12);
    assert(!forecast.after.pending.some((event) => event.title === 'Частичный возврат облигаций'));
    assert(
      committed.after.pending.some(
        (event) => event.title === 'Частичный возврат облигаций' && event.cash === 17000,
      ),
    );
    assert.deepEqual(state, before);
    const explicit = g.settle(
      state,
      plan(12, { scenario: 'contract-scope', choice: 'stages' }),
      12,
      'capital',
      false,
    );
    assert(explicit.after.pending.some((event) => event.cash === 8000));
    const penalty = plan(12, { scenario: 'contract-penalty', choice: 'sign' }),
      estimate = g.settle(state, penalty, 12, 'capital', false),
      actual = g.settle(state, penalty, 12);
    assert(!estimate.after.pending.some((event) => event.title === 'Штраф за задержку проекта'));
    assert(actual.after.pending.some((event) => event.cash === -9000));
  },
);
console.log(JSON.stringify({ status: 'PASS', checks }));
