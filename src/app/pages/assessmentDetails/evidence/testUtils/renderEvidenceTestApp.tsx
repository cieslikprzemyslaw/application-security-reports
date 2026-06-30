import assert from 'node:assert/strict';

import {
  createTestDom,
  createTestingLibraryRoot,
  act,
  fireEvent,
  waitFor,
} from '~/test/vitestLegacyBridge';

import { useEffect, useRef } from 'react';
import { ThemeProvider } from 'styled-components';

import type { Evidence, Threat } from '~/domain';
import { evidenceService } from '~/services';
import { defaultTheme } from '~/theme';

import AssessmentEvidenceSection from '../section/EvidenceSection';
import { useAssessmentEvidence } from '../hooks/useAssessmentEvidence';
import type { AssessmentDetailsAssessment } from '../../assessmentDetails.type';

export const renderTick = () =>
  new Promise<void>(resolve => setTimeout(resolve, 0));

export const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
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

export type TestWindow = ReturnType<typeof setupDom>['window'];

export const assessment: AssessmentDetailsAssessment = {
  id: 'asm_00000000-0000-0000-0000-000000000001',
  companyId: 'cmp_00000000-0000-0000-0000-000000000001',
  companyName: 'Northstar Digital',
  applicationName: 'Customer Services Portal',
  status: 'in-progress',
  recordVersion: 3,
  findingsCount: 2,
  evidenceCount: 1,
  reportVersionCount: 0,
};

export const threats: Threat[] = [
  {
    id: 'thr_00000000-0000-0000-0000-000000000001',
    assessmentId: assessment.id,
    title: 'Missing Server-Side Authorization',
    description: 'The endpoint returns another customer order.',
    severity: 'critical',
    strideCategories: ['spoofing', 'tampering'],
    status: 'accepted-risk',
    affectedAsset: '/api/v1/orders/{id}',
    impact: 'Unauthorised access to customer order data',
    recommendation: 'Apply object-level authorization on every request.',
    observation: 'An authenticated user can access another customer order.',
    affectedComponent: 'Orders API',
    affectedEndpoint: '/api/v1/orders/{id}',
    risk: 'Sensitive order data is exposed.',
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-11T09:00:00.000Z',
  },
  {
    id: 'thr_00000000-0000-0000-0000-000000000002',
    assessmentId: assessment.id,
    title: 'Verbose error handling',
    description: 'Detailed errors reveal implementation details.',
    severity: 'medium',
    strideCategories: ['information-disclosure'],
    status: 'open',
    affectedAsset: '/api/v1/debug',
    impact: 'Attackers learn internal details',
    recommendation: 'Return generic errors.',
    observation: 'Stack traces are exposed in debug mode.',
    affectedComponent: 'Debug endpoint',
    affectedEndpoint: '/api/v1/debug',
    risk: 'Implementation details are visible.',
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-11T09:00:00.000Z',
  },
];

export const seededEvidence: Evidence = {
  id: 'evd_00000000-0000-0000-0000-000000000001',
  assessmentId: assessment.id,
  threatIds: [threats[0].id, threats[1].id],
  type: 'http',
  title: 'HTTP capture',
  description: 'Captured request and response trace.',
  content: '<script>alert("x")</script>',
  fileName: 'capture.json',
  filePath:
    'uploads/evidence/evd_00000000-0000-0000-0000-000000000001/capture.json',
  storageKey:
    'uploads/evidence/evd_00000000-0000-0000-0000-000000000001/capture.json',
  mimeType: 'application/json',
  attachmentSizeBytes: 1234,
  capturedAt: '2026-06-05',
  httpExchanges: [
    {
      request: {
        method: 'GET',
        url: '/api/orders/1',
        body: 'request body <script>',
      },
      response: {
        statusCode: 200,
        statusText: 'OK',
        body: 'response body <script>',
      },
    },
  ],
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-06T00:00:00.000Z',
};

export const createEvidenceRecord = (
  input: Parameters<typeof evidenceService.create>[0],
): Evidence => ({
  id: 'evd_00000000-0000-0000-0000-000000000002',
  assessmentId: input.assessmentId,
  threatIds: [...input.threatIds],
  type: input.type,
  title: input.title,
  description: input.description,
  content: input.content,
  fileName: input.fileName,
  filePath: input.fileName
    ? `uploads/evidence/evd_00000000-0000-0000-0000-000000000002/${input.fileName}`
    : undefined,
  storageKey: input.fileName
    ? `uploads/evidence/evd_00000000-0000-0000-0000-000000000002/${input.fileName}`
    : undefined,
  mimeType: input.mimeType,
  attachmentSizeBytes: input.attachmentSizeBytes,
  capturedAt: input.capturedAt,
  httpExchanges:
    input.type === 'http'
      ? (input.httpExchanges ?? [])
      : (input.httpExchanges ?? []),
  createdAt: '2026-06-10T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
});

export const setInputValue = (
  _window: TestWindow,
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) => {
  fireEvent.change(element, {
    target: { value },
  });
};

export const setSelectValue = (
  _window: TestWindow,
  element: HTMLSelectElement,
  value: string,
) => {
  fireEvent.change(element, {
    target: { value },
  });
};

export const toggleCheckbox = (
  _window: TestWindow,
  element: HTMLInputElement,
  checked: boolean,
) => {
  if (element.checked !== checked) {
    fireEvent.click(element);
  }
};

export const setFileSelection = (
  _window: TestWindow,
  element: HTMLInputElement,
  files: File[],
) => {
  fireEvent.change(element, {
    target: { files },
  });
};

export const clickButton = (window: TestWindow, button: HTMLButtonElement) => {
  button.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
    }),
  );
};

export const findButtonByText = (root: ParentNode, text: string) =>
  Array.from(root.querySelectorAll('button')).find(button =>
    button.textContent?.includes(text),
  ) as HTMLButtonElement | undefined;

type EvidenceServiceOverrides = Partial<
  Pick<
    typeof evidenceService,
    'list' | 'getById' | 'create' | 'update' | 'remove'
  >
>;

interface RenderHarnessOptions {
  openEvidenceId?: string;
  onMutationSuccess?: (delta: number) => void;
}

export const renderHarness = async (
  evidenceList: Evidence[],
  serviceOverrides: EvidenceServiceOverrides = {},
  options: RenderHarnessOptions = {},
) => {
  const { openEvidenceId, onMutationSuccess } = options;
  const { container, window } = setupDom();

  assert.ok(container, 'Expected root container to exist');

  const root = createTestingLibraryRoot(container);

  const Harness = () => {
    const controller = useAssessmentEvidence({
      assessmentId: assessment.id,
      assessmentStatus: assessment.status,
      onMutationSuccess,
    });
    const initialOpenEvidenceIdRef = useRef(openEvidenceId);
    const initialOpenHandledRef = useRef(false);

    useEffect(() => {
      const initialOpenEvidenceId = initialOpenEvidenceIdRef.current;

      if (!initialOpenEvidenceId || initialOpenHandledRef.current) {
        return;
      }

      initialOpenHandledRef.current = true;
      controller.openEvidenceDetails(initialOpenEvidenceId);
    }, [controller]);

    return (
      <AssessmentEvidenceSection
        assessment={assessment}
        threats={threats}
        controller={controller}
      />
    );
  };

  const originalService = {
    list: evidenceService.list,
    getById: evidenceService.getById,
    create: evidenceService.create,
    update: evidenceService.update,
    remove: evidenceService.remove,
  };

  let records = [...evidenceList];

  evidenceService.list = serviceOverrides.list ?? (async () => [...records]);
  evidenceService.getById =
    serviceOverrides.getById ??
    (async evidenceId => {
      const record = records.find(item => item.id === evidenceId);

      if (record) {
        return record;
      }

      throw new Error('Evidence not found.');
    });
  evidenceService.create =
    serviceOverrides.create ??
    (async input => {
      const created = createEvidenceRecord(input);
      records = [...records, created];
      return created;
    });
  evidenceService.update =
    serviceOverrides.update ??
    (async (id, input) => {
      const current = records.find(item => item.id === id) ?? seededEvidence;
      const updated: Evidence = {
        ...current,
        ...input,
        httpExchanges:
          input.httpExchanges !== undefined
            ? input.httpExchanges
            : current.httpExchanges,
      };

      records = records.map(item => (item.id === id ? updated : item));
      return updated;
    });
  evidenceService.remove =
    serviceOverrides.remove ??
    (async id => {
      records = records.filter(item => item.id !== id);
    });

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <Harness />
      </ThemeProvider>,
    );
    await renderTick();
    await renderTick();
  });

  await waitFor(() => {
    assert.equal(
      textContent(container).includes('Loading evidence'),
      false,
      'Expected the initial evidence request to settle',
    );
  });

  return {
    container,
    root,
    window,
    restore: () => {
      evidenceService.list = originalService.list;
      evidenceService.getById = originalService.getById;
      evidenceService.create = originalService.create;
      evidenceService.update = originalService.update;
      evidenceService.remove = originalService.remove;
    },
  };
};

export function textContent(container: HTMLElement) {
  return container.textContent ?? '';
}
