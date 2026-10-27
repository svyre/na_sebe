import assert from 'node:assert/strict';
import { loadModule } from './load-module.mjs';
const g = await loadModule('../lib/game.ts');
const f = await loadModule('../lib/friends.ts');
const { FRIEND_SITUATIONS } = await loadModule('../lib/game/situations/friends.ts');
const { extraStory } = await loadModule('../lib/story-presentation.ts');
const { storyLocation } = await loadModule('../lib/locations.ts');
const { loadGame, saveGame } = await loadModule('../lib/storage.ts');
let checks = 0;
const check = (name, run) => {
  run();
  checks++;
  console.log('PASS ' + name);
};
const game = (patch = {}) => ({
  name: 'Друзья',
  goal: 'capital',
  difficulty: 'balance',
  month: 0,
  state: g.initialState('balance', 3),
  plans: [],
  reports: [],
  storySeed: 42,
  narrative: { choices: {}, journal: [] },
  friends: f.firstFriends(),
  ...patch,
});
const plan = (id = 'wallet', choice = g.getScenario(id).options.at(-1).id, patch = {}) => ({
  ...g.defaultPlan(0),
  job: 'none',
  study: 16,
  leisure: 3000,
  scenario: id,
  choice,
  roomVersion: 1,
  ...patch,
});
const witness = (accepted, friend = 'sasha') => {
  for (let seed = 0; seed < 1000; seed++) {
    const data = game({ storySeed: seed });
    const friends = f.proposeHousing(data, friend);
    if (friends.invitations[0].accepted === accepted) return { ...data, friends };
  }
  throw new Error('Missing outcome witness');
};

check('Roommates can accept or refuse, with reproducible probabilities for each friend', () => {
  for (const friend of f.ROOMMATES) {
    let accepted = 0;
    for (let seed = 0; seed < 2000; seed++) {
      const data = game({ storySeed: seed });
      const invite = f.proposeHousing(data, friend).invitations[0];
      accepted += Number(invite.accepted);
      assert.equal(invite.chance, friend === 'sasha' ? 65 : 55);
      assert.deepEqual(f.proposeHousing(data, friend).invitations[0], invite);
    }
    assert(Math.abs(accepted / 2000 - (friend === 'sasha' ? 0.65 : 0.55)) < 0.04);
  }
});
check(
  'One saved invitation prevents rerolls, switching friends and changed conversation answers',
  () => {
    const data = witness(false),
      before = structuredClone(data);
    for (const friend of f.ROOMMATES)
      assert.deepEqual(f.proposeHousing(data, friend), data.friends);
    assert.deepEqual(data, before);
    const changed = { ...data, narrative: { choices: { 0: 'together' }, journal: [] } };
    assert.deepEqual(f.proposeHousing(changed, 'sasha'), data.friends);
    const next = f.proposeHousing({ ...data, month: 1 }, 'lera');
    assert.equal(next.invitations.length, 2);
    assert.equal(next.invitations[1].month, 1);
  },
);
check('An invitation does not charge money, spend hours or commit housing', () => {
  const data = game(),
    before = structuredClone(data);
  const friends = f.proposeHousing(data, 'sasha');
  assert.equal(friends.invitations.length, 1);
  assert.deepEqual(data, before);
  assert.equal(f.roommateFor({ ...data, friends }), undefined);
  assert.deepEqual(f.proposeHousing({ ...data, month: 36 }, 'sasha'), data.friends);
});
check(
  'Moving into a shared flat requires current consent; other housing is always selectable',
  () => {
    assert(f.housingApprovalError(game(), { housing: 'shared' }));
    assert(f.housingApprovalError(witness(false), { housing: 'shared' }));
    assert.equal(f.housingApprovalError(witness(true), { housing: 'shared' }), null);
    assert(f.housingApprovalError({ ...witness(true), month: 1 }, { housing: 'shared' }));
    for (const housing of ['dorm', 'alone'])
      assert.equal(f.housingApprovalError(witness(false), { housing }), null);
  },
);
check(
  'Confirmed roommates remain while living together and do not require monthly lotteries',
  () => {
    const data = witness(true);
    const moved = { ...data, month: 1, plans: [plan('wallet', undefined, { housing: 'shared' })] };
    assert.equal(f.roommateFor(moved), 'sasha');
    assert.equal(f.housingApprovalError(moved, { housing: 'shared' }), null);
    assert.deepEqual(f.proposeHousing(moved, 'lera'), moved.friends);
    const stayed = {
      ...moved,
      month: 2,
      plans: [...moved.plans, plan('wallet', undefined, { housing: 'shared' })],
    };
    assert.equal(f.roommateFor(stayed), 'sasha');
    const left = { ...stayed, month: 3, plans: [...stayed.plans, plan()] };
    assert.equal(f.roommateFor(left), undefined);
    assert(f.housingApprovalError(left, { housing: 'shared' }));
  },
);
check(
  'Keeping independent plans is not a relationship penalty; trust uses completed actions only',
  () => {
    const a = game({
      month: 3,
      narrative: { choices: { 0: 'together', 2: 'together' }, journal: [] },
    });
    const b = game({
      month: 3,
      narrative: { choices: { 0: 'independent', 2: 'independent' }, journal: [] },
    });
    assert.equal(f.roommateChance(a, 'sasha'), f.roommateChance(b, 'sasha'));
    const state = { ...g.initialState('balance', 3), cash: 100000 };
    const kept = g.settle(state, plan('friend-lera-feedback', 'limited'), 0);
    const broken = g.settle(state, plan('friend-lera-feedback', 'forget'), 0);
    assert(
      f.roommateChance(game({ month: 1, reports: [kept] }), 'lera') >
        f.roommateChance(game(), 'lera'),
    );
    assert(
      f.roommateChance(game({ month: 1, reports: [broken] }), 'lera') <
        f.roommateChance(game(), 'lera'),
    );
    assert.equal(f.roommateChance(game({ reports: [kept] }), 'lera'), 55);
  },
);
check('Twelve friend situations have real financial choices, artwork and matching dialogue', () => {
  assert.equal(Object.keys(FRIEND_SITUATIONS).length, 12);
  const ids = [
    ...g.SITUATION_IDS,
    ...Object.keys(g.CAMPAIGN_STORIES),
    ...Object.keys(FRIEND_SITUATIONS),
  ];
  assert.equal(new Set(ids).size, 144);
  assert.equal(new Set(ids.map((id) => g.getScenario(id).title)).size, 144);
  for (const [id, scene] of Object.entries(FRIEND_SITUATIONS)) {
    const story = extraStory(id);
    assert.equal(story.speaker, { sasha: 'Саша', lera: 'Лера', ilya: 'Илья' }[scene.from]);
    assert.equal(storyLocation(id), scene.location);
    assert.equal(scene.choices.length, 3);
    assert.equal(story.props.length, 3);
    assert(scene.choices.every((choice) => choice.say && choice.reply && choice.description));
    assert.equal(new Set(scene.choices.map((choice) => choice.id)).size, 3);
  }
});
check('Every friend choice settles as a first or additional situation on every difficulty', () => {
  for (const difficulty of Object.keys(g.DIFFICULTIES))
    for (const [id, scene] of Object.entries(FRIEND_SITUATIONS))
      for (const option of scene.choices)
        for (const month of [0, 11, 12, 24, 35]) {
          const state = { ...g.initialState(difficulty, 3), cash: 100000 };
          const first = g.settle(state, plan(id, option.id), month, 'capital', true, difficulty);
          const extra = g.settle(
            state,
            plan('wallet', undefined, { extras: [{ scenario: id, choice: option.id }] }),
            month,
            'capital',
            true,
            difficulty,
          );
          assert(Number.isFinite(first.after.cash) && Number.isFinite(extra.after.cash));
          assert.equal(first.after.cash, extra.after.cash);
          assert(first.hours >= (option.hours || 0));
        }
});
check(
  'New schedules include friends without repeats; existing schedules keep their stories',
  () => {
    const encountered = new Set();
    for (let seed = 0; seed < 100; seed++) {
      const data = game({ storySeed: seed });
      const schedule = g.ensureStorySchedule(data);
      assert.equal(schedule.length, 36);
      assert.equal(new Set(schedule.flat()).size, schedule.flat().length);
      assert(schedule.slice(0, 12).every((month) => month.length >= 1 && month.length <= 3));
      for (const id of schedule.flat()) if (FRIEND_SITUATIONS[id]) encountered.add(id);
      assert.deepEqual(g.ensureStorySchedule({ ...data, storySchedule: schedule }), schedule);
      const old = g.createStorySchedule(seed);
      assert.deepEqual(
        g.ensureStorySchedule({ ...data, state: g.initialState(), storySchedule: old }),
        old,
      );
    }
    assert.equal(encountered.size, 12);
  },
);
check('Friends remain eligible in later years and are not drawn twice', () => {
  const data = game({
    month: 12,
    plans: Array.from({ length: 12 }, (_, month) => ({
      ...plan(),
      scenario: `main-${month}`,
      choice: g.getScenario(`main-${month}`).options.at(-1).id,
    })),
  });
  let found = false;
  for (let seed = 0; seed < 200; seed++) {
    const schedule = g.ensureStorySchedule({ ...data, storySeed: seed });
    assert.equal(new Set(schedule.flat()).size, schedule.flat().length);
    if (schedule[12].some((id) => FRIEND_SITUATIONS[id])) found = true;
  }
  assert(found);
});
check(
  'NPC feedback follows confirmed decisions and accepted moves, never an unfinished plan',
  () => {
    const data = game();
    assert.equal(f.friendReaction(data), undefined);
    const r = g.settle(data.state, plan('friend-lera-feedback', 'limited'), 0);
    assert.equal(f.friendReaction({ ...data, reports: [r] }), undefined);
    assert.equal(
      f.friendReaction({ ...data, month: 1, reports: [r], plans: [r.plan] }).from,
      'lera',
    );
    const accepted = witness(true);
    const moved = g.settle(data.state, plan('wallet', undefined, { housing: 'shared' }), 0);
    assert.match(
      f.friendReaction({ ...accepted, month: 1, reports: [moved], plans: [moved.plan] }).text,
      /переехали/,
    );
  },
);
check(
  'Invitation outcomes round-trip in old storage and malformed records cannot break finances',
  () => {
    let raw;
    const storage = {
      getItem: () => raw,
      setItem: (_key, value) => {
        raw = value;
      },
    };
    const data = witness(false);
    saveGame(data, storage);
    const restored = loadGame(storage);
    assert.deepEqual(restored.friends, data.friends);
    assert.deepEqual(f.proposeHousing(restored, 'lera'), data.friends);
    const invalid = {
      version: 1,
      invitations: [
        null,
        {},
        { ...data.friends.invitations[0], friend: 'unknown' },
        ...data.friends.invitations,
        ...data.friends.invitations,
      ],
    };
    assert.deepEqual(f.normalizeFriends(invalid), data.friends);
    saveGame({ ...data, friends: invalid }, storage);
    assert.deepEqual(loadGame(storage).state, data.state);
    assert.deepEqual(f.normalizeFriends(undefined), f.firstFriends());
  },
);
console.log(JSON.stringify({ status: 'PASS', checks }));
