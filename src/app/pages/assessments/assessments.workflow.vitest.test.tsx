import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import {
  act,
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  routes,
  setFetch,
  textContent,
  waitFor,
} from '~/app/appRouter.tests/support';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const assessmentsPath = `/api/assessments?companyId=${companyId}`;

const companyResponse = {
  data: [
    {
      id: companyId,
      name: 'Northstar Digital',
      website: 'https://northstar.example',
      contactEmail: 'security@northstar.example',
      assessmentCount: 1,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-22T00:00:00.000Z',
    },
  ],
};

const assessmentResponse = {
  data: [
    {
      id: assessmentId,
      companyId,
      name: 'Customer Portal Review',
      applicationName: 'Customer Portal',
      type: 'Web App',
      status: 'in-progress',
      findingsCount: 4,
      updatedAt: '2026-06-22T09:00:00.000Z',
      description: 'Assessment of the public customer portal.',
      scope: 'Frontend application and supporting APIs.',
    },
  ],
};

type AssessmentResponseFactory = () => Response | Promise<Response>;

const setupAssessmentListFetch = (
  getAssessmentResponse: AssessmentResponseFactory,
) => {
  setFetch(async input => {
    const path = String(input);

    if (path === '/api/companies') {
      return createJsonResponse(companyResponse);
    }

    if (path === assessmentsPath) {
      return getAssessmentResponse();
    }

    throw new Error(`Unexpected request: ${path}`);
  });
};

const unmount = async (root: { unmount: () => void }) => {
  await act(async () => {
    root.unmount();
  });
};

describe('assessment workflow states', () => {
  it('shows loading before the empty Assessment workspace', async () => {
    let resolveAssessments: ((response: Response) => void) | undefined;
    const pendingAssessments = new Promise<Response>(resolve => {
      resolveAssessments = resolve;
    });

    setupAssessmentListFetch(() => pendingAssessments);

    try {
      const { container, root } = await renderApp(
        routes.companyWorkspaceAssessments(companyId),
        false,
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Loading assessments...'));
      });

      await act(async () => {
        resolveAssessments?.(createJsonResponse({ data: [] }));
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes('No assessments yet'));
        assert.ok(
          textContent(container).includes(
            'Create the first assessment for this company.',
          ),
        );
      });

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });

  it('renders a populated Assessment workspace through the production router', async () => {
    setupAssessmentListFetch(() => createJsonResponse(assessmentResponse));

    try {
      const { container, root } = await renderApp(
        routes.companyWorkspaceAssessments(companyId),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Customer Portal Review'));
      });

      assert.ok(textContent(container).includes('1 assessments'));
      assert.ok(textContent(container).includes('Web App'));
      assert.ok(textContent(container).includes('In Progress'));

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });

  it('renders a safe Assessment load error without stale populated content', async () => {
    setupAssessmentListFetch(() =>
      createJsonResponse(
        {
          error: {
            code: 'ASSESSMENTS_UNAVAILABLE',
            message: 'Assessment list unavailable.',
            details: [],
          },
        },
        { status: 500 },
      ),
    );

    try {
      const { container, root } = await renderApp(
        routes.companyWorkspaceAssessments(companyId),
      );

      await waitFor(() => {
        assert.ok(
          textContent(container).includes('Unable to load assessments'),
        );
        assert.ok(
          textContent(container).includes('Assessment list unavailable.'),
        );
      });

      assert.equal(
        textContent(container).includes('Customer Portal Review'),
        false,
      );
      assert.ok(
        Array.from(container.querySelectorAll('button')).some(button =>
          button.textContent?.includes('Retry'),
        ),
      );

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });
});
