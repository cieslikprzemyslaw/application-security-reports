import path from 'node:path';
import express, {
  Router,
  type ErrorRequestHandler,
  type RequestHandler,
  type Response,
} from 'express';

import { resolvePathWithinRoot } from '../../src/validation/index.js';

const evidenceRoot = 'uploads/evidence';
const evidenceRootPath = path.resolve(process.cwd(), evidenceRoot);

const allowedEvidenceExtensions = new Set([
  '.gif',
  '.jpeg',
  '.jpg',
  '.json',
  '.pdf',
  '.png',
  '.txt',
  '.webp',
]);

const contentTypeByExtension: Record<string, string> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

const sendStaticNotFound = (res: Response): void => {
  res.status(404).type('text/plain').send('Not found');
};

const validateEvidenceRequestPath: RequestHandler = (req, res, next) => {
  const relativePath = req.path.replace(/^\/+/, '');

  if (relativePath.length === 0) {
    sendStaticNotFound(res);
    return;
  }

  let decodedPath: string;

  try {
    decodedPath = decodeURIComponent(relativePath);
  } catch {
    sendStaticNotFound(res);
    return;
  }

  const candidatePath = `${evidenceRoot}/${decodedPath}`;

  if (!resolvePathWithinRoot(evidenceRoot, candidatePath)) {
    sendStaticNotFound(res);
    return;
  }

  const extension = path.extname(decodedPath).toLowerCase();

  if (!allowedEvidenceExtensions.has(extension)) {
    sendStaticNotFound(res);
    return;
  }

  next();
};

const staticErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 404
  ) {
    sendStaticNotFound(res);
    return;
  }

  next(error);
};

export const createEvidenceStaticRouter = (): Router => {
  const router = Router();

  router.use(validateEvidenceRequestPath);
  router.use(
    express.static(evidenceRootPath, {
      fallthrough: false,
      index: false,
      redirect: false,
      setHeaders(res, filePath) {
        const extension = path.extname(filePath).toLowerCase();
        const contentType = contentTypeByExtension[extension];

        if (contentType) {
          res.setHeader('Content-Type', contentType);
        }

        if (extension === '.json') {
          res.setHeader('Content-Disposition', 'attachment');
        }
      },
    }),
  );
  router.use(staticErrorHandler);

  return router;
};
