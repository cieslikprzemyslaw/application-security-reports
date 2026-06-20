import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import {
  OWASP_TOP_10_CURRENT_VERSION,
  OWASP_TOP_10_OPTIONS,
  getOwaspTop10CategoryOption,
  type Threat,
} from '~/domain';
import { defaultTheme } from '~/theme';

import type { ThreatTableRow } from '~/app/components/appsec/threatTable';

import {
  createEmptyThreatFormValue,
  threatToFormValue,
} from '../assessmentDetails.mapper';
import type { AssessmentDetailsAssessment } from '../assessmentDetails.type';

import AssessmentFindingsSection from './assessmentFindingsSection.component';

const owaspCategoryValue = (code: string) =>
  getOwaspTop10CategoryOption(code)?.value ?? `${code}:2025`;

const renderTick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

const setupDom = () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: 'http://localhost/' },
  );

  const { window } = dom;

  setGlobal('window', window);
  setGlobal('document', window.document);
  setGlobal('navigator', window.navigator);
  setGlobal('HTMLElement', window.HTMLElement);
  setGlobal('Node', window.Node);
  setGlobal(
    'requestAnimationFrame',
    window.requestAnimationFrame?.bind(window) ??
      ((callback: FrameRequestCallback) => window.setTimeout(callback, 16)),
  );
  setGlobal(
    'cancelAnimationFrame',
    window.cancelAnimationFrame?.bind(window) ??
      window.clearTimeout.bind(window),
  );
  setGlobal('IS_REACT_ACT_ENVIRONMENT', true);

  return {
    container: window.document.getElementById('root'),
    window,
  };
};

const finding: Threat = {
  id: 'thr_1',
  assessmentId: 'asm_1',
  title: 'Broken object-level authorization',
  description: 'Customers can access other customers orders.',
  severity: 'high',
  strideCategories: ['spoofing'],
  status: 'open',
  owaspCategoryCode: owaspCategoryValue('A01'),
  customCategory: undefined,
  affectedComponent: 'Orders API',
  affectedEndpoint: '/api/orders/{id}',
  impact: 'Unauthorized access to customer order data.',
  remediation: 'Enforce object-level authorization on every request.',
  observation: 'An authenticated user can request another order by ID.',
  reproductionSteps: 'Log in as user A and request an order owned by user B.',
  references: 'OWASP API1:2023',
  evidenceCount: 2,
  resolutionNote: 'Fixed in release 2026.06.1.',
  acceptedRiskJustification: 'Not applicable.',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-15T09:30:00.000Z',
};

const assessmentBase: AssessmentDetailsAssessment = {
  id: 'asm_1',
  companyId: 'cmp_1',
  companyName: 'Northstar Digital',
  applicationName: 'Customer Services Portal',
  owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
  status: 'in-progress',
  recordVersion: 3,
  findingsCount: 1,
  evidenceCount: 2,
  reportVersionCount: 0,
};

const textContent = (node: ParentNode) => node.textContent ?? '';

const renderHarness = async (
  assessmentStatus: AssessmentDetailsAssessment['status'],
) => {
  const { container, window } = setupDom();

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);
  const events: string[] = [];

  const Harness = () => {
    const assessment: AssessmentDetailsAssessment = {
      ...assessmentBase,
      status: assessmentStatus,
    };
    const [drawerMode, setDrawerMode] = React.useState<
      'view' | 'create' | 'edit' | null
    >(null);
    const [selectedFinding, setSelectedFinding] = React.useState<Threat>();
    const [draftValue, setDraftValue] = React.useState(
      createEmptyThreatFormValue(assessmentBase.owaspTaxonomyVersion),
    );

    const openFindingDetails = (threat: Threat | ThreatTableRow) => {
      const nextFinding = 'strideCategories' in threat ? threat : finding;

      events.push('view');
      setSelectedFinding(nextFinding);
      setDraftValue(
        threatToFormValue(
          nextFinding,
          assessment.owaspTaxonomyVersion ?? OWASP_TOP_10_CURRENT_VERSION,
        ),
      );
      setDrawerMode('view');
    };

    const openEditFinding = (threat?: Threat | ThreatTableRow) => {
      const nextFinding =
        threat && 'strideCategories' in threat ? threat : finding;

      events.push('edit');

      setSelectedFinding(nextFinding);
      setDraftValue(
        threatToFormValue(
          nextFinding,
          assessment.owaspTaxonomyVersion ?? OWASP_TOP_10_CURRENT_VERSION,
        ),
      );
      setDrawerMode('edit');
    };

    const openCreateFinding = () => {
      const value = createEmptyThreatFormValue(
        assessment.owaspTaxonomyVersion ?? OWASP_TOP_10_CURRENT_VERSION,
      );

      events.push('create');
      setSelectedFinding(undefined);
      setDraftValue(value);
      setDrawerMode('create');
    };

    return (
      <AssessmentFindingsSection
        assessment={assessment}
        threats={[finding]}
        isLoading={false}
        drawerMode={drawerMode}
        selectedFinding={selectedFinding}
        draftValue={draftValue}
        fieldErrors={{}}
        formError={undefined}
        isSubmitting={false}
        isDeleting={false}
        deleteError={undefined}
        canEditFindings={assessment.status !== 'archived'}
        openCreateFinding={openCreateFinding}
        openEditFinding={openEditFinding}
        openFindingDetails={openFindingDetails}
        closeFindingDrawer={() => {
          setDrawerMode(null);
          setSelectedFinding(undefined);
        }}
        handleFindingChange={value => setDraftValue(value)}
        handleFindingSave={async event => {
          event.preventDefault();
        }}
        handleFindingDelete={async () => {}}
      />
    );
  };

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <Harness />
      </ThemeProvider>,
    );
    await renderTick();
  });

  return { container, root, window, events };
};

await (async () => {
  {
    const { container, root, window, events } =
      await renderHarness('in-progress');

    assert.ok(
      textContent(container).includes('A01:2025 - Broken Access Control'),
      'Expected the threat table to render the registry-driven OWASP label',
    );

    const row = Array.from(
      container.querySelectorAll('.data-table-row--clickable'),
    ).find(item =>
      item.textContent?.includes('Broken object-level authorization'),
    ) as HTMLTableRowElement | undefined;

    assert.ok(row, 'Expected a clickable threats row');

    await act(async () => {
      row!.focus();
      row!.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
      await renderTick();
    });

    assert.deepEqual(events, ['view']);
    assert.ok(
      textContent(window.document.body).includes(
        'Broken object-level authorization',
      ),
    );
    assert.ok(textContent(window.document.body).includes('High'));
    assert.ok(
      textContent(window.document.body).includes(
        'A01:2025 - Broken Access Control',
      ),
    );
    assert.ok(textContent(window.document.body).includes('Orders API'));
    assert.ok(
      textContent(window.document.body).includes(
        'Unauthorized access to customer order data.',
      ),
    );
    assert.ok(
      textContent(window.document.body).includes('Enforce object-level'),
    );
    assert.ok(textContent(window.document.body).includes('Threat details'));

    const getCloseButton = () =>
      window.document.body.querySelector(
        'button[aria-label="Close threat details"]',
      ) as HTMLButtonElement | null;

    const closeButton = getCloseButton();

    assert.ok(closeButton, 'Expected the drawer close button');
    assert.equal(window.document.activeElement, closeButton);

    await act(async () => {
      closeButton!.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
      await renderTick();
    });

    assert.equal(window.document.activeElement, row);
    assert.ok(
      !textContent(window.document.body).includes('Threat details'),
      'Expected the read-only drawer to close',
    );

    await act(async () => {
      row!.dispatchEvent(
        new window.KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Enter',
        }),
      );
      await renderTick();
      await renderTick();
    });

    assert.deepEqual(events, ['view', 'view']);
    assert.ok(
      textContent(window.document.body).includes(
        'Broken object-level authorization',
      ),
    );

    const reopenedCloseButton = getCloseButton();

    assert.ok(
      reopenedCloseButton,
      'Expected the drawer close button to return',
    );

    await act(async () => {
      reopenedCloseButton!.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
      await renderTick();
    });

    await act(async () => {
      row!.dispatchEvent(
        new window.KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: ' ',
        }),
      );
      await renderTick();
      await renderTick();
    });

    assert.deepEqual(events, ['view', 'view', 'view']);

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root, window, events } =
      await renderHarness('in-progress');

    const editButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.trim() === 'Edit threat',
    ) as HTMLButtonElement | undefined;

    assert.ok(editButton, 'Expected the row edit action');

    await act(async () => {
      editButton!.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
      await renderTick();
    });

    assert.deepEqual(events, ['edit']);
    assert.ok(
      !textContent(window.document.body).includes('Threat details'),
      'Expected the edit action to open the editor instead of the details view',
    );
    assert.ok(
      window.document.body.querySelector('#threat-title'),
      'Expected the editable threat form to render',
    );
    assert.ok(
      textContent(window.document.body).includes('Save threat'),
      'Expected the drawer action to switch to the edit form',
    );

    const owaspSelect = window.document.body.querySelector(
      '#threat-owasp-category-code',
    ) as HTMLSelectElement | null;

    assert.ok(owaspSelect, 'Expected the OWASP category select');
    assert.equal(owaspSelect?.value, owaspCategoryValue('A01'));
    assert.deepEqual(
      Array.from(owaspSelect?.options ?? []).map(option => option.value),
      [...OWASP_TOP_10_OPTIONS.map(option => option.value), 'custom'],
    );
    assert.deepEqual(
      Array.from(owaspSelect?.options ?? []).map(option => option.textContent),
      [...OWASP_TOP_10_OPTIONS.map(option => option.label), 'Custom'],
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root, window } = await renderHarness('in-progress');

    const addButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.trim() === 'Add threat',
    ) as HTMLButtonElement | undefined;

    assert.ok(addButton, 'Expected the create action');

    await act(async () => {
      addButton!.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
      await renderTick();
    });

    const createSelect = window.document.body.querySelector(
      '#threat-owasp-category-code',
    ) as HTMLSelectElement | null;

    assert.ok(createSelect, 'Expected the create form OWASP select');
    assert.equal(createSelect?.value, owaspCategoryValue('A01'));

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root, window } = await renderHarness('archived');

    assert.equal(
      Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.trim() === 'Edit threat',
      ) ?? null,
      null,
      'Expected archived assessments to hide the edit action',
    );

    const row = Array.from(
      container.querySelectorAll('.data-table-row--clickable'),
    ).find(item =>
      item.textContent?.includes('Broken object-level authorization'),
    ) as HTMLTableRowElement | undefined;

    assert.ok(row, 'Expected the archived threat row');

    await act(async () => {
      row!.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
      await renderTick();
    });

    assert.ok(
      textContent(window.document.body).includes(
        'Broken object-level authorization',
      ),
      'Expected archived threats to still open the details drawer',
    );
    assert.equal(
      Array.from(window.document.body.querySelectorAll('button')).find(
        button => button.textContent?.trim() === 'Edit threat',
      ) ?? null,
      null,
      'Expected the drawer not to expose edit actions for archived threats',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderHarness('in-progress');

    assert.ok(
      textContent(container).includes('Threats'),
      'Expected Threat terminology in the section heading',
    );
    assert.ok(
      !textContent(container).includes('Findings'),
      'Expected no Finding terminology in the section',
    );

    const editButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.trim() === 'Edit threat',
    );

    assert.ok(editButton, 'Expected Edit threat action label');
    assert.ok(
      !Array.from(container.querySelectorAll('button')).some(
        button => button.textContent?.trim() === 'Edit finding',
      ),
      'Expected no Edit finding label',
    );

    assert.ok(
      textContent(container).includes('/api/orders/{id}'),
      'Expected the endpoint value to appear in the row',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const threatWithoutEndpoint: Threat = {
      ...finding,
      id: 'thr_2',
      affectedEndpoint: undefined,
    };

    const { container } = setupDom();
    assert.ok(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <AssessmentFindingsSection
            assessment={{ ...assessmentBase, status: 'in-progress' }}
            threats={[threatWithoutEndpoint]}
            isLoading={false}
            drawerMode={null}
            selectedFinding={undefined}
            draftValue={createEmptyThreatFormValue(
              assessmentBase.owaspTaxonomyVersion,
            )}
            fieldErrors={{}}
            formError={undefined}
            isSubmitting={false}
            canEditFindings={true}
            openCreateFinding={() => undefined}
            openEditFinding={() => undefined}
            openFindingDetails={() => undefined}
            closeFindingDrawer={() => undefined}
            handleFindingChange={() => undefined}
            handleFindingSave={async event => {
              event.preventDefault();
            }}
          />
        </ThemeProvider>,
      );
      await renderTick();
    });

    assert.ok(
      textContent(container).includes('—'),
      'Expected em dash for absent endpoint',
    );

    await act(async () => {
      root.unmount();
    });
  }
})();
