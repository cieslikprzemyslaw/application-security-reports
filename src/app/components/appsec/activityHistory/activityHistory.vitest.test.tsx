import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Activity } from '~/domain';

const activityServiceMocks = vi.hoisted(() => ({
  listByCompany: vi.fn(),
  listByAssessment: vi.fn(),
}));

vi.mock('~/services', () => ({
  activityService: activityServiceMocks,
}));

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

    render(<ActivityHistory scope={companyScope} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading activity');
    expect(await screen.findByText('Assessment completed.')).toBeVisible();
    expect(activityServiceMocks.listByCompany).toHaveBeenCalledWith(
      companyScope.companyId,
      50,
      expect.any(AbortSignal),
    );
  });

  it('renders an explicit empty state', async () => {
    activityServiceMocks.listByCompany.mockResolvedValue([]);

    render(
      <ActivityHistory
        scope={companyScope}
        emptyMessage="No Company activity yet."
      />,
    );

    expect(await screen.findByText('No Company activity yet.')).toBeVisible();
  });

  it('renders an error and retries the same scope', async () => {
    const user = userEvent.setup();
    activityServiceMocks.listByCompany
      .mockRejectedValueOnce(new Error('Activity unavailable.'))
      .mockResolvedValueOnce([activity]);

    render(<ActivityHistory scope={companyScope} />);

    expect(await screen.findByText('Activity unavailable.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Assessment completed.')).toBeVisible();
    await waitFor(() =>
      expect(activityServiceMocks.listByCompany).toHaveBeenCalledTimes(2),
    );
  });

  it('uses the Assessment-scoped service for History', async () => {
    activityServiceMocks.listByAssessment.mockResolvedValue([activity]);

    render(
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
