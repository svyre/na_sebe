import assert from 'node:assert/strict';
import { loadModule } from './load-module.mjs';
const g = await loadModule('../lib/game.ts');
const n = await loadModule('../lib/narrative.ts');
const t = await loadModule('../lib/tutorial.ts');
const { CHAPTERS } = await loadModule('../lib/narrative/chapters.ts');
const { SCENE_VOICES } = await loadModule('../lib/narrative/scene-voices.ts');
const { extraStory } = await loadModule('../lib/story-presentation.ts');
const { loadGame, saveGame } = await loadModule('../lib/storage.ts');
let checks = 0;
const check = (name, run) => {
  run();
  checks++;
  console.log('PASS ' + name);
};
const game = (patch = {}) => ({
  name: 'История',
  goal: 'capital',
  difficulty: 'balance',
  month: 0,
  state: g.initialState('balance', 3),
  plans: [],
  reports: [],
  ...patch,
});
const plan = (month, patch = {}) => ({
  ...g.defaultPlan(month),
  job: 'none',
  study: 16,
  leisure: 3000,
  scenario: 'wallet',
  choice: g.getScenario('wallet').options.at(-1).id,
  roomVersion: 1,
  ...patch,
});
const fromReport = (r) =>
  game({
    month: r.month + 1,
    state: r.after,
    reports: [r],
    plans: Array.from({ length: r.month + 1 }, (_, i) =>
      i === r.month ? r.plan : g.defaultPlan(i),
    ),
  });
check('36 distinct chapters have two complete replies and known recurring speakers', () => {
  assert.equal(CHAPTERS.length, 36);
  assert.equal(new Set(CHAPTERS.map((c) => c.title)).size, 36);
  for (let month = 0; month < 36; month++) {
    const chapter = n.chapterFor(game({ month }));
    assert(chapter.title && chapter.setting && chapter.messages.length);
    assert.equal(chapter.choices.length, 2);
    assert.equal(new Set(chapter.choices.map((c) => c.id)).size, 2);
    assert(chapter.messages.every((m) => n.CAST[m.from] && m.text));
    assert(chapter.choices.every((c) => c.label && c.reply));
    assert(!JSON.stringify(chapter).includes('undefined'));
  }
});
check('Dialogue selection changes only narrative metadata and does not mutate the game', () => {
  const before = game(),
    copy = structuredClone(before),
    progress = n.chooseStory(before, 'together');
  assert.equal(progress.choices[0], 'together');
  assert.deepEqual(before, copy);
  assert.deepEqual(progress.journal, []);
  assert.deepEqual(n.chooseStory({ ...before, month: 36 }, 'together'), {
    choices: {},
    journal: [],
  });
});
check('Later dialogue remembers an actual earlier reply and ignores future choices', () => {
  const shared = n.chapterFor(
    game({ month: 2, narrative: { choices: { 0: 'together' }, journal: [] } }),
  );
  const alone = n.chapterFor(
    game({ month: 2, narrative: { choices: { 0: 'independent' }, journal: [] } }),
  );
  const unanswered = n.chapterFor(game({ month: 2 }));
  assert.notDeepEqual(shared.messages, alone.messages);
  assert.equal(unanswered.messages.length, 1);
  assert.deepEqual(
    n.chapterFor(game({ month: 2, narrative: { choices: { 35: 'together' }, journal: [] } })),
    unanswered,
  );
});
check('Group-project memories require the corresponding past choices', () => {
  const known = n.chapterFor(
    game({
      month: 24,
      narrative: { choices: { 1: 'together', 6: 'together', 9: 'together' }, journal: [] },
    }),
  );
  const independent = n.chapterFor(
    game({
      month: 24,
      narrative: { choices: { 1: 'independent', 6: 'independent', 9: 'independent' }, journal: [] },
    }),
  );
  assert.notDeepEqual(known.messages, independent.messages);
  assert(known.messages[0].text.includes('общих'));
  assert(independent.messages[0].text.includes('свою часть'));
});
check('Moving appears in the next chapter, using the last confirmed housing', () => {
  const initial = g.initialState('balance', 3),
    r = g.settle(initial, plan(0, { housing: 'shared' }), 0);
  const after = fromReport(r);
  assert.match(n.chapterFor(after).recall, /квартиры с друзьями/);
  const next = g.settle(r.after, plan(1, { housing: 'shared' }), 1);
  const following = fromReport(next);
  following.plans[0] = r.plan;
  following.reports = [r, next];
  assert(!/ключ от/.test(n.chapterFor(following).recall || ''));
  assert.equal(n.chapterFor(game()).recall, undefined);
});
check('Business launch, pause and closure have different factual callbacks', () => {
  const initial = { ...g.initialState('balance', 3), cash: 1000000, skills: 6, pilotDone: true };
  const launch = g.settle(initial, plan(12, { project: 'launch' }), 12);
  assert.match(n.chapterFor(fromReport(launch)).recall, /папка своего дела/);
  const pause = g.settle(launch.after, plan(13, { project: 'pause' }), 13);
  assert.match(n.chapterFor(fromReport(pause)).recall, /календаре стало тише/);
  const close = g.settle(pause.after, plan(14, { project: 'close' }), 14);
  assert.match(n.chapterFor(fromReport(close)).recall, /архив/);
});
check('Car purchase and sale are remembered after the actual settlement', () => {
  const initial = { ...g.initialState('balance', 3), cash: 1000000 };
  const bought = g.settle(initial, plan(12, { carAction: 'compact' }), 12);
  assert.match(n.chapterFor(fromReport(bought)).recall, /ещё одна связка ключей/);
  const sold = g.settle(bought.after, plan(13, { carAction: 'sell' }), 13);
  assert.match(n.chapterFor(fromReport(sold)).recall, /больше нет ключей/);
});
check('Furniture, low energy and scholarship concerns use the current confirmed state', () => {
  const state = { ...g.initialState('balance', 3), cash: 100000 };
  const furniture = g.settle(state, plan(0, { roomBuy: ['lamp'] }), 0);
  assert.match(n.chapterFor(fromReport(furniture)).recall, /настольная лампа/);
  const tired = g.settle({ ...state, energy: 0 }, plan(0), 0);
  assert.match(n.chapterFor(fromReport(tired)).recall, /тишине/);
  const study = g.settle({ ...state, education: 40 }, plan(0), 0);
  assert.match(n.chapterFor(fromReport(study)).recall, /конспект/);
});
check('An unfinished or future financial report cannot supply a memory', () => {
  const state = { ...g.initialState('balance', 3), cash: 1000000 };
  const future = g.settle(state, plan(12, { carAction: 'compact' }), 12);
  assert.equal(n.chapterFor(game({ reports: [future] })).recall, undefined);
});
check(
  'A journal snapshots the reply once and survives JSON storage without retelling history',
  () => {
    const original = game(),
      selected = { ...original, narrative: n.chooseStory(original, 'together') };
    const progress = n.recordChapter(selected);
    assert.equal(progress.journal.length, 1);
    assert.equal(progress.journal[0].choice.id, 'together');
    assert.deepEqual(n.normalizeNarrative(JSON.parse(JSON.stringify(progress))), progress);
    assert.equal(n.recordChapter({ ...selected, narrative: progress }).journal.length, 1);
    const later = n.chooseStory({ ...selected, month: 1, narrative: progress }, 'independent');
    assert.deepEqual(later.journal[0], progress.journal[0]);
    assert.deepEqual(original, game());
  },
);
check('Resuming a legacy game never invents past conversations or starts the tutorial', () => {
  let value;
  const storage = { getItem: () => value || null, setItem: (_k, v) => (value = v) };
  const old = game({ month: 3 });
  saveGame(old, storage);
  const loaded = loadGame(storage);
  assert.equal(loaded.tutorial, undefined);
  assert.equal(loaded.narrative, undefined);
  const progress = n.recordChapter(loaded);
  assert.deepEqual(
    progress.journal.map((r) => r.month),
    [3],
  );
  assert.deepEqual(loaded.state, old.state);
});
check('Malformed narrative data is discarded without breaking financial saves', () => {
  const invalid = {
    choices: { 0: 'together', 1: 'wrong', 40: 'together', __proto__: 'independent' },
    journal: [
      null,
      { month: 0, title: 'x', setting: 'x', messages: [{ from: 'unknown', text: 'x' }] },
    ],
  };
  assert.deepEqual(n.normalizeNarrative(invalid), { choices: { 0: 'together' }, journal: [] });
  let raw;
  const storage = { getItem: () => raw, setItem: (_k, v) => (raw = v) };
  saveGame(game({ narrative: invalid }), storage);
  assert.deepEqual(loadGame(storage).state, game().state);
});
check('Financial scene dialogue covers real options and never changes their conditions', () => {
  for (const [id, voice] of Object.entries(SCENE_VOICES)) {
    const scenario = g.getScenario(id),
      before = structuredClone(scenario),
      story = extraStory(id, 12);
    assert.equal(story.speaker, n.CAST[voice.from].name);
    assert.equal(story.response.length, 3);
    assert.deepEqual(Object.keys(voice.replies).sort(), scenario.options.map((o) => o.id).sort());
    assert.deepEqual(scenario, before);
  }
});
check('Epilogues distinguish enough capital from completing every goal condition', () => {
  const beginning = game();
  beginning.narrative = n.recordChapter(beginning);
  const completed = { ...beginning, month: 36, state: { ...beginning.state, cash: 1000000 } };
  assert.match(n.epilogueFor(completed, false).opening, /не все условия/);
  assert.match(
    n.epilogueFor({ ...completed, state: { ...completed.state, cash: 0, savings: 0 } }, false)
      .opening,
    /не хватает/,
  );
  assert.match(n.epilogueFor(completed, true).opening, /Последняя строка/);
  assert.equal(n.epilogueFor(game(), true), null);
});
check('Tutorial steps are ordered and require a real first decision before moving on', () => {
  assert.equal(t.TUTORIAL_STEPS.length, 10);
  assert.equal(new Set(t.TUTORIAL_STEPS.map((s) => s.id)).size, 10);
  assert(t.TUTORIAL_STEPS.every((s) => s.target && s.text && s.title));
  let progress = t.firstTutorial();
  assert.equal(progress.step, 'story');
  progress = t.nextTutorial(progress, false);
  assert.equal(progress.step, 'room');
  progress = t.nextTutorial(progress, false);
  assert.equal(progress.step, 'decisions');
  assert.deepEqual(t.nextTutorial(progress, false), progress);
  progress = t.nextTutorial(progress, true);
  assert.equal(progress.step, 'plan');
  while (progress.status === 'active') progress = t.nextTutorial(progress, true);
  assert.equal(progress.status, 'completed');
  assert.equal(progress.step, 'budget');
});
check('Skipped and completed tutorials do not reactivate; invalid steps normalize safely', () => {
  for (const status of ['skipped', 'completed']) {
    const state = { status, step: 'bank' };
    assert.deepEqual(t.nextTutorial(state, true), state);
    assert.deepEqual(t.normalizeTutorial(state), state);
  }
  assert.deepEqual(t.normalizeTutorial({ status: 'active', step: 'unknown' }), t.firstTutorial());
  assert.equal(t.normalizeTutorial({ status: 'other', step: 'story' }), undefined);
  assert.equal(t.normalizeTutorial(undefined), undefined);
});
check(
  'Narrative and tutorial progress share the existing save without altering money or dates',
  () => {
    let raw;
    const storage = { getItem: () => raw, setItem: (_k, v) => (raw = v) };
    const data = game();
    data.narrative = n.chooseStory(data, 'independent');
    data.tutorial = { status: 'active', step: 'bank' };
    saveGame(data, storage);
    const loaded = loadGame(storage);
    assert.deepEqual(loaded.tutorial, data.tutorial);
    assert.deepEqual(loaded.narrative, data.narrative);
    assert.deepEqual(loaded.state, data.state);
    assert.equal(loaded.month, 0);
  },
);
console.log(JSON.stringify({ status: 'PASS', checks }));
