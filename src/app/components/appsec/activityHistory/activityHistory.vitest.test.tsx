import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Activity } from '~/domain';
import { renderWithProviders, screen, waitFor } from '~/test/render';
import { routes } from '~/routes';

const activityServiceMocks = vi.hoisted(() => ({
  listByCompany: vi.fn(),
  listByAssessment: vi.fn(),
}));

vi.mock('~/services', async importOriginal => {
  const actual = await importOriginal<typeof import('~/services')>();

  return {
    ...actual,
    activityService: activityServiceMocks,
  };
});

import ActivityHistory from './activityHistory.component';

const activity: Activity = {
  id: 'act_00000000-0000-0000-0000-000000000001',
  eventType: 'assessment.completed',
  result: 'success',
  severity: 'informational',
  actor: { type: 'local-user' },
  resource: {
    type: 'assessment',
    id: 'asm_00000000-0000-0000-0000-000000000001',
    companyId: 'cmp_00000000-0000-0000-0000-000000000001',
    assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
  },
  message: 'Assessment completed.',
  createdAt: '2026-07-25T08:00:00.000Z',
};

const companyScope = {
  type: 'company' as const,
  companyId: 'cmp_00000000-0000-0000-0000-000000000001',
};

describe('ActivityHistory', () => {
  beforeEach(() => {
    activityServiceMocks.listByCompany.mockReset();
    activityServiceMocks.listByAssessment.mockReset();
  });

  it('renders loading and populated Company activity states', async () => {
    activityServiceMocks.listByCompany.mockResolvedValue([activity]);

    renderWithProviders(<ActivityHistory scope={companyScope} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading activity');
    const activityLink = await screen.findByRole('link', {
      name: /Assessment completed\./,
    });
    expect(activityLink).toHaveAttribute(
      'href',
      routes.assessmentDetailsOverview(
        companyScope.companyId,
        activity.resource.id,
      ),
    );
    expect(activityServiceMocks.listByCompany).toHaveBeenCalledWith(
      companyScope.companyId,
      50,
      expect.any(AbortSignal),
    );
  });

  it('renders an explicit empty state', async () => {
    activityServiceMocks.listByCompany.mockResolvedValue([]);

    renderWithProviders(
      <ActivityHistory
        scope={companyScope}
        emptyMessage="No Company activity yet."
      />,
    );

    expect(await screen.findByText('No Company activity yet.')).toBeVisible();
  });

  it('renders an error and retries the same scope', async () => {
    activityServiceMocks.listByCompany
      .mockRejectedValueOnce(new Error('Activity unavailable.'))
      .mockResolvedValueOnce([activity]);

    const { user } = renderWithProviders(
      <ActivityHistory scope={companyScope} />,
    );

    expect(await screen.findByText('Activity unavailable.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Assessment completed.')).toBeVisible();
    await waitFor(() =>
      expect(activityServiceMocks.listByCompany).toHaveBeenCalledTimes(2),
    );
  });

  it('does not link deleted resources that no longer have a destination', async () => {
    activityServiceMocks.listByCompany.mockResolvedValue([
      {
        ...activity,
        id: 'act_00000000-0000-0000-0000-000000000002',
        eventType: 'legacy.deleted',
        message: 'Assessment deleted.',
      },
    ]);

    renderWithProviders(<ActivityHistory scope={companyScope} />);

    expect(await screen.findByText('Assessment deleted.')).toBeVisible();
    expect(
      screen.queryByRole('link', { name: /Assessment deleted\./ }),
    ).not.toBeInTheDocument();
  });

  it('uses the Assessment-scoped service for History', async () => {
    activityServiceMocks.listByAssessment.mockResolvedValue([activity]);

    renderWithProviders(
      <ActivityHistory
        scope={{
          type: 'assessment',
          companyId: companyScope.companyId,
          assessmentId: activity.resource.id,
        }}
      />,
    );

    expect(await screen.findByText('Assessment completed.')).toBeVisible();
    expect(activityServiceMocks.listByAssessment).toHaveBeenCalledWith(
      companyScope.companyId,
      activity.resource.id,
      50,
      expect.any(AbortSignal),
    );
  });
});
