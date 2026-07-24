import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppThemeProvider } from '~/theme';

import AssessmentTable from './assessmentTable.component';

import type { AssessmentListRow } from './assessmentTable.type';

const assessment: AssessmentListRow = {
  id: 'asm_00000000-0000-0000-0000-000000000001',
  name: 'Customer portal',
  type: 'Web App',
  status: 'in-progress',
  findingsCount: 3,
  updatedAt: '2026-07-24T10:00:00.000Z',
};

describe('AssessmentTable semantic rows', () => {
  it('uses a link for navigation and keeps Edit separate', () => {
    const onEditAssessment = vi.fn();

    render(
      <MemoryRouter>
        <AppThemeProvider>
          <AssessmentTable
            assessments={[assessment]}
            sortBy="updated"
            sortDirection="desc"
            onSortChange={() => undefined}
            getAssessmentHref={item => `/assessments/${item.id}/overview`}
            onEditAssessment={onEditAssessment}
          />
        </AppThemeProvider>
      </MemoryRouter>,
    );

    const primaryAction = screen.getByRole('link', {
      name: `Open ${assessment.name} assessment`,
    });
    const row = primaryAction.closest('tr');
    const editAction = screen.getByRole('button', { name: 'Edit' });

    expect(row).not.toHaveAttribute('tabindex');
    expect(primaryAction).toHaveAttribute(
      'href',
      `/assessments/${assessment.id}/overview`,
    );
    expect(primaryAction.contains(editAction)).toBe(false);

    fireEvent.click(editAction);
    expect(onEditAssessment).toHaveBeenCalledWith(assessment);
  });

  it('keeps callback activation as a button for non-navigation consumers', () => {
    const onAssessmentClick = vi.fn();

    render(
      <AppThemeProvider>
        <AssessmentTable
          assessments={[assessment]}
          sortBy="updated"
          sortDirection="desc"
          onSortChange={() => undefined}
          onAssessmentClick={onAssessmentClick}
        />
      </AppThemeProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: `Open ${assessment.name} assessment`,
      }),
    );

    expect(onAssessmentClick).toHaveBeenCalledWith(assessment);
  });
});
