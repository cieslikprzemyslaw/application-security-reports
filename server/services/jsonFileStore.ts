import { promises as fs } from 'node:fs';
import path from 'node:path';
const dataDirectory = path.resolve(process.cwd(), 'data');
const resolveDataPath = (filename: string) =>
  path.join(dataDirectory, path.basename(filename));
export const readJsonFile = async <T>(filename: string): Promise<T> =>
  JSON.parse(await fs.readFile(resolveDataPath(filename), 'utf8')) as T;
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
