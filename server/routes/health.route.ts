import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) =>
  res.json({
    status: 'ok',
    service: 'appsec-report-builder-api',
    storage: 'local-json',
  }),
);
export default router;
