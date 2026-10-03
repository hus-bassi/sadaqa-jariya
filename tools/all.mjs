import { spawnSync } from 'child_process';

const steps = [
  ['build CSS', 'tools/build-css.mjs'],
  ['build HTML', 'tools/build.mjs'],
  ['check structure', 'tools/check.mjs'],
  ['static verify', 'tools/verify.mjs'],
  ['audio gating', 'tools/audio-test.mjs'],
  ['counters', 'tools/counters-test.mjs'],
  ['smoke test', 'tools/smoke.mjs'],
];

let failed = 0;
for (const [label, file] of steps) {
  const r = spawnSync(process.execPath, [file], { stdio: ['ignore', 'pipe', 'pipe'] });
  const out = (r.stdout || '').toString() + (r.stderr || '').toString();
  const ok = r.status === 0;
  if (!ok) failed++;
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}`);
  if (!ok) console.log(out.trim().split('\n').map((l) => '       ' + l).join('\n'));
}

console.log('---');
console.log(failed ? `${failed} step(s) FAILED` : '*** ALL STEPS PASSED ***');
process.exitCode = failed ? 1 : 0;
