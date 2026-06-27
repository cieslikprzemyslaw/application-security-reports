import { spawnSync } from 'node:child_process';

const gitCheck = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
  stdio: 'ignore',
});

if (gitCheck.status !== 0) {
  console.log('Skipping Git hooks setup: no Git worktree is available.');
  process.exit(0);
}

const configureHooks = spawnSync(
  'git',
  ['config', 'core.hooksPath', '.husky'],
  { stdio: 'inherit' },
);

if (configureHooks.status !== 0) {
  process.exit(configureHooks.status ?? 1);
}
