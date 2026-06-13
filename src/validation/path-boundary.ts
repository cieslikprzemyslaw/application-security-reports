import path from 'node:path';

const hasMixedSeparators = (value: string): boolean =>
  value.includes('/') && value.includes('\\');

const isTraversalPath = (value: string): boolean =>
  value.split(/[\\/]/).some(segment => segment === '..');

export const resolvePathWithinRoot = (
  rootDir: string,
  candidatePath: string,
): string | null => {
  const trimmedCandidatePath = candidatePath.trim();

  if (trimmedCandidatePath.length === 0) {
    return null;
  }

  if (hasMixedSeparators(trimmedCandidatePath)) {
    return null;
  }

  if (
    path.posix.isAbsolute(trimmedCandidatePath) ||
    path.win32.isAbsolute(trimmedCandidatePath)
  ) {
    return null;
  }

  if (isTraversalPath(trimmedCandidatePath)) {
    return null;
  }

  const rootPath = path.resolve(rootDir);
  const resolvedPath = path.resolve(process.cwd(), trimmedCandidatePath);
  const normalizedRootPath = rootPath.endsWith(path.sep)
    ? rootPath
    : `${rootPath}${path.sep}`;

  if (
    resolvedPath !== rootPath &&
    !resolvedPath.startsWith(normalizedRootPath)
  ) {
    return null;
  }

  return resolvedPath;
};
