import type { Router } from 'express';

export const registerHealthRoute = (router: Router): void => {
  router.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
    });
  });
};
