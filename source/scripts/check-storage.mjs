import assert from 'node:assert/strict';
import { loadModule } from './load-module.mjs';

const game = await loadModule('../lib/game.ts');
const { SAVE_KEY, loadGame, saveGame } = await loadModule('../lib/storage.ts');
let checks = 0;

function check(name, run) {
  run();
  checks++;
  console.log('PASS ' + name);
}

function memoryStorage(value = null) {
  const values = new Map(value === null ? [] : [[SAVE_KEY, value]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, next) => values.set(key, next),
  };
}

function savedGame() {
  return {
    name: 'Тестовая стратегия',
    goal: 'capital',
    difficulty: 'challenge',
    character: 'girl',
    month: 0,
    state: game.initialState('challenge'),
    reports: [],
    plans: [],
    storySeed: 280,
    storySchedule: game.createStorySchedule(280),
  };
}

check('An empty browser and damaged JSON open without losing the app', () => {
  assert.equal(loadGame(memoryStorage()), null);
  assert.equal(loadGame(memoryStorage('{broken')), null);
  for (const value of [null, [], {}, { goal: '__proto__' }]) {
    assert.equal(loadGame(memoryStorage(JSON.stringify(value))), null);
  }
});

check('A saved game retains character, difficulty, inventory and exact story schedule', () => {
  const current = savedGame();
  current.state.roomItems = ['lamp', 'chair'];
  const storage = memoryStorage();
  assert.equal(saveGame(current, storage), true);
  assert.deepEqual(loadGame(storage), current);
});

check('An old completed month keeps its state, report and plan when migrated', () => {
  const plan = game.defaultPlan();
  const report = game.settle(game.initialState(), plan, 0);
  const legacy = {
    name: 'Игра из старого архива',
    goal: 'capital',
    month: 1,
    state: report.after,
    reports: [report],
    plans: [plan],
  };
  const serialized = JSON.stringify(legacy);
  const expected = JSON.parse(serialized);
  const restored = loadGame(memoryStorage(serialized));
  assert.deepEqual(restored.state, expected.state);
  assert.deepEqual(restored.reports, expected.reports);
  assert.deepEqual(restored.plans, expected.plans);
  assert.equal(restored.character, 'boy');
  assert.equal(restored.difficulty, 'balance');
  assert.deepEqual(restored.storySchedule[0], game.planSituationIds(plan, 0));
  assert.equal(restored.storySchedule.flat().length, new Set(restored.storySchedule.flat()).size);
});

check('Repairing a missing schedule does not mutate the supplied saved game', () => {
  const original = savedGame();
  delete original.storySchedule;
  const snapshot = structuredClone(original);
  const restored = loadGame(memoryStorage(JSON.stringify(original)));
  assert.deepEqual(original, snapshot);
  assert.deepEqual(restored.storySchedule, game.createStorySchedule(original.storySeed));
});

check('Blocked storage and full storage report failure without throwing', () => {
  const storage = {
    getItem() {
      throw new Error('Storage blocked');
    },
    setItem() {
      throw new Error('Quota exceeded');
    },
  };
  assert.equal(loadGame(storage), null);
  assert.equal(saveGame(savedGame(), storage), false);
});

check('Completed games remain completed after a save round trip', () => {
  const current = savedGame();
  current.month = 12;
  const storage = memoryStorage();
  saveGame(current, storage);
  assert.equal(loadGame(storage).month, 12);
});

console.log(JSON.stringify({ status: 'PASS', checks }));
