// 全ステージをソルバーで解き、最短手数を stages.json の par に書き込む。
// 使い方: npm run verify-stages
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseGrid } from '../src/game/board.ts';
import { solve } from '../src/solver/solver.ts';
import type { Stage } from '../src/stages/index.ts';

const ARROW = { up: '↑', down: '↓', left: '←', right: '→' } as const;
const file = fileURLToPath(new URL('../src/stages/stages.json', import.meta.url));
const stages: Stage[] = JSON.parse(readFileSync(file, 'utf8'));

let failed = 0;
let changed = 0;
for (const stage of stages) {
  const t = performance.now();
  const result = solve(parseGrid(stage.grid));
  const ms = Math.round(performance.now() - t);
  const label = `${stage.id}. ${stage.name}`;
  if (result === null || result === 'limit') {
    failed++;
    console.error(`✗ ${label}: ${result === null ? '解けません' : '探索上限を超えました（判定不能）'}`);
    continue;
  }
  if (stage.par !== result.length) {
    console.log(`  par を ${stage.par} → ${result.length} に更新`);
    stage.par = result.length;
    changed++;
  }
  console.log(`✓ ${label}: ${result.length}手  ${result.map((d) => ARROW[d]).join(' ')}  (${ms}ms)`);
}

if (changed) {
  // 1ステージ1行の書式を保って書き戻す
  const body = stages.map((s) => '  ' + JSON.stringify(s).replace(/,"/g, ', "').replace(/":/g, '": ').replace(/^\{/, '{ ').replace(/\}$/, ' }'));
  writeFileSync(file, `[\n${body.join(',\n')}\n]\n`);
  console.log(`\n${changed} ステージの par を stages.json に書き込みました`);
}
if (failed) {
  console.error(`\n${failed} ステージが解けません`);
  process.exit(1);
}
console.log(`\n全 ${stages.length} ステージが解けることを確認しました`);
