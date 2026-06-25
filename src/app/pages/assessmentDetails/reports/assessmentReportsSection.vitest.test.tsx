import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { AppThemeProvider } from '~/theme';

import AssessmentReportsSection from './assessmentReportsSection.component';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';

const mounted: Array<() => void> = [];

afterEach(() => {
  mounted.splice(0).forEach(cleanup => cleanup());
});

const renderSection = async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const service = {
    listByAssessmentId: async () => [
      {
        id: 'rpt_00000000-0000-0000-0000-000000000001',
        assessmentId,
        title: 'Customer Portal Security Report',
        status: 'draft' as const,
        selectedThreatIds: [],
        latestVersion: 1,
        createdAt: '2026-06-25T10:00:00.000Z',
        updatedAt: '2026-06-25T11:00:00.000Z',
        versions: [
          {
            id: 'rvs_00000000-0000-0000-0000-000000000001',
            version: 1,
            status: 'draft' as const,
            generatedAt: '2026-06-25' as const,
          },
        ],
      },
    ],
  };

  await act(async () => {
    root.render(
      <MemoryRouter>
        <AppThemeProvider>
          <AssessmentReportsSection
            companyId={companyId}
            assessmentId={assessmentId}
            service={service}
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

  return container;
};

describe('AssessmentReportsSection', () => {
  it('shows saved versions and explains browser PDF storage', async () => {
    const container = await renderSection();

    expect(container.textContent).toContain('Customer Portal Security Report');
    expect(container.textContent).toContain('v0.1');
    expect(container.textContent).toContain('Open preview');
    expect(container.textContent).toContain('not stored by the application');
    const versionLink = container.querySelector<HTMLAnchorElement>(
      'a[aria-label="Open Customer Portal Security Report version 0.1 preview"]',
    );

    expect(versionLink?.getAttribute('href')).toContain('versionId=rvs_');
  });
});
