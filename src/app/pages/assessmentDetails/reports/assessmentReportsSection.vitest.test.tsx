import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppThemeProvider } from '~/theme';

import AssessmentReportsSection from './assessmentReportsSection.component';

import type { AssessmentReportListItem } from '~/domain';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const versionId = 'rvs_00000000-0000-0000-0000-000000000001';

const mounted: Array<() => void> = [];

const reportFixture: AssessmentReportListItem = {
  id: reportId,
  assessmentId,
  title: 'Customer Portal Security Report',
  status: 'draft',
  selectedThreatIds: [],
  latestVersion: 1,
  createdAt: '2026-06-25T10:00:00.000Z',
  updatedAt: '2026-06-25T11:00:00.000Z',
  versions: [
    {
      id: versionId,
      version: 1,
      status: 'final',
      generatedAt: '2026-06-25' as const,
    },
  ],
};

afterEach(() => {
  mounted.splice(0).forEach(cleanup => cleanup());
  document.body.innerHTML = '';
});

const renderSection = async (
  options: {
    reports?: AssessmentReportListItem[];
    deleteVersion?: ReturnType<typeof vi.fn>;
  } = {},
) => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const service = {
    listByAssessmentId: vi.fn(async () => options.reports ?? [reportFixture]),
  };
  const versionService = {
    deleteVersion:
      options.deleteVersion ??
      vi.fn(async () => ({
        reportId,
        deletedVersionId: versionId,
        latestVersion: 0,
      })),
  };

  await act(async () => {
    root.render(
      <MemoryRouter>
        <AppThemeProvider>
          <AssessmentReportsSection
            companyId={companyId}
            assessmentId={assessmentId}
            service={service}
            versionService={versionService}
          />
        </AppThemeProvider>
      </MemoryRouter>,
    );
  });

  await act(async () => {
    await Promise.resolve();
  });

  mounted.push(() => {
    root.unmount();
    container.remove();
  });

  return { container, service, versionService };
};

describe('AssessmentReportsSection', () => {
  it('shows saved versions and explains browser PDF storage', async () => {
    const { container } = await renderSection();

    expect(container.textContent).toContain('Customer Portal Security Report');
    expect(container.textContent).toContain('v0.1');
    expect(container.textContent).toContain('Open preview');
    expect(container.textContent).toContain('not stored by the application');
    const versionLink = container.querySelector<HTMLAnchorElement>(
      'a[aria-label="Open Customer Portal Security Report version 0.1 preview"]',
    );

    expect(versionLink?.getAttribute('href')).toContain('versionId=rvs_');
  });

  it('requires exact version confirmation before deleting a final version', async () => {
    const deleteVersion = vi.fn(async () => ({
      reportId,
      deletedVersionId: versionId,
      latestVersion: 0,
    }));
    const { versionService } = await renderSection({ deleteVersion });

    const deleteButton = Array.from(document.querySelectorAll('button')).find(
      button =>
        button.getAttribute('aria-label') ===
        'Delete Customer Portal Security Report version 0.1',
    );

    expect(deleteButton).toBeInstanceOf(HTMLButtonElement);

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(document.body.textContent).toContain('Final version deletion');
    const confirmButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Delete version'),
    ) as HTMLButtonElement | undefined;
    expect(confirmButton?.disabled).toBe(true);

    const input = document.querySelector<HTMLInputElement>(
      '.assessment-report-delete-input',
    );
    expect(input).toBeInstanceOf(HTMLInputElement);

    await act(async () => {
      input!.value = 'v0.1';
      input!.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(confirmButton?.disabled).toBe(false);

    await act(async () => {
      confirmButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(versionService.deleteVersion).toHaveBeenCalledWith(
      reportId,
      versionId,
      expect.any(AbortSignal),
    );
  });
});
