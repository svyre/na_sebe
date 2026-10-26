import { performance } from 'node:perf_hooks';
import { loadModule } from './load-module.mjs';

const game = await loadModule('../lib/game.ts');
const initial = game.initialState();
const plan = game.defaultPlan();
const samples = [];
let checksum = 0;

// Keep benchmark results separate from correctness checks: timing depends on the machine.
for (let run = 0; run < 7; run++) {
  for (let warmup = 0; warmup < 50; warmup++) game.settle(initial, plan, 0);
  let start = performance.now();
  for (let i = 0; i < 5000; i++) {
    checksum += game.rub(i * 137.43).length + game.percent(i / 13).length;
  }
  const formatMs = performance.now() - start;

  start = performance.now();
  for (let i = 0; i < 1000; i++) checksum += game.settle(initial, plan, 0).after.cash;
  samples.push({ formatMs, monthMs: performance.now() - start });
}

const median = (field) => samples.map((sample) => sample[field]).sort((a, b) => a - b)[3];
console.log(
  JSON.stringify(
    {
      node: process.version,
      runs: samples.length,
      formatCalls: 10000,
      settledMonths: 1000,
      medianFormatMs: median('formatMs'),
      medianMonthMs: median('monthMs'),
      checksum,
    },
    null,
    2,
  ),
);
