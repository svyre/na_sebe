import assert from 'node:assert/strict';
import { loadModule } from './load-module.mjs';

const g = await loadModule('../lib/game.ts');

let checks = 0;
const check = (name, run) => {
  run();
  checks++;
  console.log('PASS ' + name);
};
const base = (m = 0) => ({
  ...g.defaultPlan(m),
  scenario: 'wallet',
  choice: 'c',
  extras: [],
  roomVersion: 1,
});
check(
  'Purchases are charged once as expenses, consume time, and do not count as capital assets',
  () => {
    const state = g.initialState(),
      plain = g.settle(state, base(), 0),
      p = { ...base(), roomBuy: ['lamp', 'chair'] },
      before = JSON.stringify(state),
      r = g.settle(state, p, 0);
    assert.equal(plain.after.cash - r.after.cash, 4700);
    assert.equal(g.capital(plain.after) - g.capital(r.after), 4700);
    assert.equal(r.hours - plain.hours, 3);
    assert.equal(r.ledger.filter((x) => x.label.startsWith('Комната:')).length, 2);
    assert.deepEqual(r.after.roomItems, ['lamp', 'chair']);
    assert.deepEqual(r.room.purchased, ['lamp', 'chair']);
    assert.equal(JSON.stringify(state), before);
  },
);
check('Only incoming furniture helps this month; new furniture starts helping next month', () => {
  const state = { ...g.initialState(), education: 60, energy: 40 },
    p = { ...base(), roomBuy: ['lamp', 'desk', 'chair', 'mattress', 'shelf', 'plant'] },
    r = g.settle(state, p, 0);
  assert.deepEqual(g.roomEffects(r.after), { education: 4, energy: 6 });
  assert.equal(r.room.education, 0);
  assert.equal(r.room.energy, 0);
  const empty = { ...r.after };
  delete empty.roomItems;
  const withRoom = g.settle(r.after, base(1), 1),
    without = g.settle(empty, base(1), 1);
  assert.equal(withRoom.after.education - without.after.education, 4);
  assert.equal(withRoom.after.energy - without.after.energy, 6);
  assert.equal(withRoom.ledger.filter((x) => x.label.startsWith('Комната:')).length, 0);
  assert.deepEqual(withRoom.room.purchased, []);
});
check(
  'The same improvements follow dorm, shared apartment and studio without extra charges',
  () => {
    const state = { ...g.initialState(), roomItems: ['lamp', 'plant'] };
    for (const housing of ['dorm', 'shared', 'alone']) {
      const r = g.settle(state, { ...base(), housing }, 0);
      assert.deepEqual(r.after.roomItems, state.roomItems);
      assert.equal(r.room.education, 1);
      assert.equal(r.room.energy, 1);
      assert.ok(!r.ledger.some((x) => x.label.startsWith('Комната:')));
    }
  },
);
check(
  'Unknown, duplicate and already-owned items are rejected, and setup hours respect difficulty',
  () => {
    const state = g.initialState();
    for (const roomBuy of [['bad'], ['lamp', 'lamp'], null, 'lamp'])
      assert.match(g.validatePlan({ ...base(), roomBuy }, state, 0), /покупок/);
    assert.match(
      g.validatePlan({ ...base(), roomBuy: ['lamp'] }, { ...state, roomItems: ['lamp'] }, 0),
      /уже есть/,
    );
    const p = { ...base(), job: 'intense', study: 16, roomBuy: ['desk'] };
    assert.ok(g.planHours(p, 0) > 112);
    assert.match(g.validatePlan(p, state, 0, false, 'challenge'), /не хватает времени/);
  },
);
check(
  'A desk or lamp obtained in a story appears once, with no duplicate payment or immediate recurring effect',
  () => {
    const state = g.initialState(),
      p = { ...base(), scenario: 'desk', choice: 'b' },
      r = g.settle(state, p, 0);
    assert.deepEqual(r.after.roomItems, ['desk']);
    assert.deepEqual(r.room.gifted, ['desk']);
    assert.equal(r.room.education, 0);
    assert.ok(!r.ledger.some((x) => x.label.startsWith('Комната:')));
    assert.match(g.validatePlan({ ...p, roomBuy: ['desk'] }, state, 0), /повторную покупку/);
    const lamp = g.settle(state, { ...base(), scenario: 'parcel', choice: 'c' }, 0);
    assert.deepEqual(lamp.after.roomItems, ['lamp']);
    assert.deepEqual(lamp.room.gifted, ['lamp']);
    const owned = g.settle({ ...state, roomItems: ['desk'] }, p, 0);
    assert.deepEqual(owned.after.roomItems, ['desk']);
    assert.deepEqual(owned.room.gifted, []);
  },
);
check('Completed legacy stories do not receive new room effects or inventory retroactively', () => {
  const p = { ...base(), scenario: 'desk', choice: 'b' };
  delete p.roomVersion;
  const legacy = g.settle(g.initialState(), p, 0);
  assert.equal(legacy.after.roomItems, undefined);
  assert.equal(legacy.room, undefined);
  const old = JSON.stringify(legacy),
    future = g.settle(legacy.after, { ...base(1), roomBuy: ['lamp'] }, 1);
  assert.equal(JSON.stringify(legacy), old);
  assert.deepEqual(future.after.roomItems, ['lamp']);
});
check('Preview does not mutate inventory or input plan and hidden losses stay hidden', () => {
  const state = g.initialState(),
    p = { ...base(), scenario: 'qr', choice: 'a', roomBuy: ['plant'] },
    snapshot = JSON.stringify({ state, p }),
    preview = g.settle(state, p, 0, 'capital', false),
    actual = g.settle(state, p, 0);
  assert.equal(preview.after.cash - actual.after.cash, 4000);
  assert.deepEqual(preview.after.roomItems, ['plant']);
  assert.equal(JSON.stringify({ state, p }), snapshot);
  assert.equal(state.roomItems, undefined);
});
check('Savings cannot reuse furniture money and deficit consequences remain visible', () => {
  const state = { ...g.initialState(), cash: 0 },
    p = { ...base(), roomBuy: ['desk'], save: 100000 };
  assert.throws(() => g.settle(state, p, 0), /На переводы/);
  const r = g.settle({ ...state, cash: -20000 }, { ...base(), roomBuy: ['desk'] }, 0);
  assert.ok(r.after.cash < 0);
  assert.ok(r.warnings.some((x) => /минус/.test(x)));
  assert.equal(r.ledger.find((x) => x.label === 'Стоимость дефицита прошлого месяца').amount, -600);
});
check(
  'An equipped randomized year replays exactly across all difficulties and keeps purchases one-time',
  () => {
    for (const difficulty of Object.keys(g.DIFFICULTIES)) {
      let state = g.initialState(difficulty);
      const reports = [];
      for (let m = 0; m < 12; m++) {
        const p = {
          ...base(m),
          job: difficulty === 'hardcore' ? 'none' : 'flex',
          study: difficulty === 'hardcore' ? 16 : 32,
          housing: m > 5 ? 'shared' : 'dorm',
          ...(m === 0
            ? { roomBuy: ['lamp', 'plant'] }
            : m === 2
              ? { roomBuy: ['chair', 'shelf'] }
              : m === 4
                ? { roomBuy: ['mattress', 'desk'] }
                : {}),
        };
        const r = g.settle(state, p, m, 'career', true, difficulty);
        reports.push(r);
        state = r.after;
      }
      assert.equal(state.roomItems.length, 6);
      assert.equal(
        reports.flatMap((r) => r.ledger).filter((x) => x.label.startsWith('Комната:')).length,
        6,
      );
      assert.deepEqual(g.replay(reports, 0, 'c', 'career', difficulty).state, state);
    }
  },
);
check(
  'Room effects respect the 100-point cap and zero-bonus plans retain the old financial model',
  () => {
    const state = {
        ...g.initialState(),
        education: 100,
        energy: 100,
        roomItems: Object.keys(g.ROOM_ITEMS),
      },
      r = g.settle(state, { ...base(), study: 48, leisure: 15000 }, 0);
    assert.equal(r.after.education, 100);
    assert.equal(r.after.energy, 100);
    const old = g.defaultPlan(0),
      a = g.settle(g.initialState(), old, 0),
      b = g.settle(g.initialState(), { ...old, roomVersion: 1 }, 0);
    assert.deepEqual(a.after, b.after);
    assert.deepEqual(a.ledger, b.ledger);
  },
);
console.log(JSON.stringify({ status: 'PASS', checks, improvements: 6 }));
