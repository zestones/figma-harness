/* Linux-only validation runner. Every worker belongs to its own bounded user
 * service, outside the graphical-session service. There is no unsafe fallback. */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { getHeapStatistics } from 'node:v8';

const ROOT = path.resolve(__dirname, '../..');
const MEMORY_MAX = 1024 * 1024 * 1024;
const DEFAULT_HEAP_MB = 512;
const A11Y_HEAP_MB = 640;
const TASKS = new Set([
  'preflight', 'test', 'guard', 'guard:scope', 'lint', 'typecheck', 'build', 'build:check', 'diagnose:memory',
  'tokens:check', 'icons:check',
  'audit', 'audit:contrast', 'audit:a11y', 'audit:theme',
  'design:signature', 'design:check', 'design:components', 'design:components:check',
  'render:svg', 'render:png', 'render:fonts:check',
]);

function checkedCgroup(): string {
  const entry = readFileSync('/proc/self/cgroup', 'utf8').trim().split('\n')
    .find(line => line.startsWith('0::'));
  const group = entry?.slice(3);
  if (!group || !/\/app\.slice\/figma-harness-check-[\w-]+\.service$/.test(group)
    || group.includes('wayland-wm')) throw new Error('Refusing validation outside the isolated service');
  const directory = path.join('/sys/fs/cgroup', group);
  const limit = readFileSync(path.join(directory, 'memory.max'), 'utf8').trim();
  const swap = readFileSync(path.join(directory, 'memory.swap.max'), 'utf8').trim();
  const oomGroup = readFileSync(path.join(directory, 'memory.oom.group'), 'utf8').trim();
  if (!Number.isFinite(Number(limit)) || Number(limit) <= 0 || Number(limit) > MEMORY_MAX
    || swap !== '0' || oomGroup !== '1') throw new Error('Refusing validation without effective memory and OOM limits');
  console.log(JSON.stringify({
    cgroup: group, memoryMaxBytes: Number(limit), swapMaxBytes: Number(swap),
    oomGroup: Number(oomGroup), heapLimitBytes: getHeapStatistics().heap_size_limit,
  }));
  return directory;
}

function worker(npmCli: string, task: string, args: string[]): void {
  const directory = checkedCgroup();
  const reportPeak = () => {
    console.log('Cgroup memory peak bytes: ' + readFileSync(path.join(directory, 'memory.peak'), 'utf8').trim());
    console.log('Cgroup task peak: ' + readFileSync(path.join(directory, 'pids.peak'), 'utf8').trim()
      + '; events: ' + readFileSync(path.join(directory, 'pids.events'), 'utf8').trim());
  };
  if (task === 'preflight') { reportPeak(); return; }
  const heapMb = task === 'audit:a11y' ? A11Y_HEAP_MB : DEFAULT_HEAP_MB;
  let command: string[];
  if (task === 'test') {
    if (!args.length) throw new Error('Select explicit test files; there is no implicit whole-suite task');
    const files = args;
    for (const file of files) {
      if (!/^tools\/tests\/[\w-]+\.test\.ts$/.test(file) || !existsSync(path.join(ROOT, file))) {
        throw new Error('Expected an existing tools/tests/<name>.test.ts selector');
      }
    }
    command = [`--max-old-space-size=${heapMb}`, '--import', 'tsx', '--test', '--test-concurrency=1', ...files];
  } else {
    command = [`--max-old-space-size=${heapMb}`, npmCli, 'run', task, ...(args.length ? ['--', ...args] : [])];
  }
  const result = spawnSync(process.execPath, command, { cwd: ROOT, stdio: 'inherit' });
  reportPeak();
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

function main(): void {
  const input = process.argv.slice(2);
  if (input[0] === '--worker') {
    const [, npmCli, task, ...args] = input;
    if (!TASKS.has(task)) throw new Error('Unknown isolated task');
    worker(npmCli, task, args);
    return;
  }
  const [task, ...args] = input;
  if (process.platform !== 'linux' || !TASKS.has(task)) {
    throw new Error('Usage on Linux: npm run isolated -- <preflight|test|audit|guard|...> [arguments]. No raw verify task.');
  }
  const npmCli = process.env['npm_execpath'];
  if (!npmCli || !existsSync(npmCli)) throw new Error('Start this runner through npm run isolated');
  const unit = 'figma-harness-check-' + process.pid + '-' + Date.now() + '.service';
  const heapMb = task === 'audit:a11y' ? A11Y_HEAP_MB : DEFAULT_HEAP_MB;
  const launch = spawnSync('systemd-run', [
    '--user', '--wait', '--pipe',
    '--unit=' + unit, '--slice=app.slice', '--working-directory=' + ROOT,
    '--property=MemoryAccounting=yes', '--property=MemoryHigh=768M', '--property=MemoryMax=1G',
    '--property=MemorySwapMax=0', '--property=OOMPolicy=kill', '--property=TasksMax=64',
    '--property=CPUQuota=100%', '--property=RuntimeMaxSec=180', '--property=TimeoutStopSec=5',
    '--property=LimitCORE=0',
    `--setenv=NODE_OPTIONS=--max-old-space-size=${heapMb} --v8-pool-size=1`,
    '--setenv=UV_THREADPOOL_SIZE=2', '--setenv=GOMAXPROCS=1', '--setenv=RAYON_NUM_THREADS=1',
    '--setenv=PATH=' + path.dirname(process.execPath) + ':' + (process.env['PATH'] || '/usr/bin:/bin'),
    '--', process.execPath, `--max-old-space-size=${heapMb}`, '--import', 'tsx', __filename,
    '--worker', npmCli, task, ...args,
  ], { cwd: ROOT, stdio: 'inherit' });
  // Successful transient units are collected automatically. A failed unit may
  // remain loaded; report and release only the unit created by this invocation.
  const state = spawnSync('systemctl', ['--user', 'show', unit, '-p', 'LoadState', '--value'], { encoding: 'utf8' });
  if (state.status === 0 && state.stdout.trim() === 'loaded') {
    spawnSync('systemctl', ['--user', 'show', unit,
      '-p', 'Result', '-p', 'ExecMainStatus', '-p', 'MemoryPeak', '-p', 'ControlGroup'], { stdio: 'inherit' });
    spawnSync('systemctl', ['--user', 'stop', unit], { stdio: 'inherit' });
    spawnSync('systemctl', ['--user', 'reset-failed', unit], { stdio: 'ignore' });
  }
  if (launch.error) throw launch.error;
  process.exitCode = launch.status ?? 1;
}

try { main(); } catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
