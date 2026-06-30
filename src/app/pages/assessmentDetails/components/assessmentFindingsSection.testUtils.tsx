import assert from 'node:assert/strict';

import {
  createTestDom,
  createTestingLibraryRoot,
  act,
} from '~/test/vitestLegacyBridge';

import React from 'react';
import { ThemeProvider } from 'styled-components';

import {
  OWASP_TOP_10_CURRENT_VERSION,
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

export const owaspCategoryValue = (code: string) =>
  getOwaspTop10CategoryOption(code)?.value ?? `${code}:2025`;

export const renderTick = () =>
  new Promise<void>(resolve => setTimeout(resolve, 0));

const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

export const setupDom = () => {
  const dom = createTestDom(
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

export const finding: Threat = {
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

export const assessmentBase: AssessmentDetailsAssessment = {
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

export const textContent = (node: ParentNode) => node.textContent ?? '';

export const renderHarness = async (
  assessmentStatus: AssessmentDetailsAssessment['status'],
) => {
  const { container, window } = setupDom();

  assert.ok(container, 'Expected root container to exist');

  const root = createTestingLibraryRoot(container);
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
        handleFindingDelete={async threat => {
          events.push(
            `delete:${threat?.id ?? selectedFinding?.id ?? 'unknown'}`,
          );
        }}
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
