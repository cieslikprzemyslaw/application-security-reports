import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ZodTypeAny } from 'zod';

import { parseJsonData } from '../../src/validation/index.js';

const resolveDataPath = (filename: string) =>
  path.join(path.resolve(process.cwd(), 'data'), path.basename(filename));
export const readJsonFile = async <T extends ZodTypeAny>(
  filename: string,
  schema: T,
): Promise<import('zod').output<T>> =>
  parseJsonData(await fs.readFile(resolveDataPath(filename), 'utf8'), schema);
export const writeJsonFile = async <T>(
  filename: string,
  value: T,
): Promise<void> => {
  const filePath = resolveDataPath(filename);
  const tempPath = `${filePath}.tmp`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
};
