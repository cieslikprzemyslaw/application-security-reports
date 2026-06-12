import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const prismaBin = path.resolve(
  process.cwd(),
  'node_modules/prisma/build/index.js',
);
const schemaEnginePath = path.resolve(
  process.cwd(),
  'node_modules/@prisma/engines/schema-engine-windows.exe',
);

const env = { ...process.env };

if (!env.PRISMA_SCHEMA_ENGINE_BINARY && existsSync(schemaEnginePath)) {
  env.PRISMA_SCHEMA_ENGINE_BINARY = schemaEnginePath;
}

const child = spawn(process.execPath, [prismaBin, ...args], {
  stdio: 'inherit',
  env,
});

child.on('exit', code => {
  process.exitCode = code ?? 1;
});
