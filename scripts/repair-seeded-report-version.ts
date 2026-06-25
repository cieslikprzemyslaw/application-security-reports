import { promises as fs } from 'node:fs';
import path from 'node:path';

import { reportVersionSchema } from '../src/domain/schemas/report.schema.js';
import { prisma } from '../server/lib/prisma.js';

const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const seedFile = path.resolve('prisma/seed/report-versions.json');

const main = async () => {
  const raw = await fs.readFile(seedFile, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  const rows = Array.isArray(parsed) ? parsed : [];
  const seedVersion = reportVersionSchema.parse(rows[0]);

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      status: true,
      latestVersion: true,
      versions: {
        select: { id: true, version: true },
        orderBy: { version: 'asc' },
      },
    },
  });

  if (!report) {
    console.log(`[SKIP] Seeded Report not found: ${reportId}`);
    return;
  }

  if (report.versions.length > 0) {
    const latestVersion =
      report.versions.at(-1)?.version ?? report.latestVersion;

    if (
      report.latestVersion !== latestVersion ||
      report.status !== 'generated'
    ) {
      await prisma.report.update({
        where: { id: reportId },
        data: {
          latestVersion,
          status: 'generated',
        },
      });
    }

    console.log(
      `[OK] Report already has ${report.versions.length} saved version(s).`,
    );
    return;
  }

  await prisma.$transaction(async tx => {
    await tx.reportVersion.create({
      data: {
        id: seedVersion.id,
        reportId: seedVersion.reportId,
        version: seedVersion.version,
        status: seedVersion.status,
        generatedAt: seedVersion.generatedAt,
        filePath: seedVersion.filePath ?? null,
        snapshot: JSON.parse(JSON.stringify(seedVersion.snapshot)),
      },
    });

    await tx.report.update({
      where: { id: reportId },
      data: {
        latestVersion: seedVersion.version,
        status: 'generated',
      },
    });
  });

  console.log(
    `[FIXED] Added saved ReportVersion v${seedVersion.version / 10} for ${reportId}.`,
  );
};

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
