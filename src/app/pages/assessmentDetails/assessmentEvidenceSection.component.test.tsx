import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import type { Evidence, Threat } from '~/domain';
import { evidenceService } from '~/services';
import { defaultTheme } from '~/theme';

import AssessmentEvidenceSection from './assessmentEvidenceSection.component';
import { useAssessmentEvidence } from './hooks/useAssessmentEvidence';
import type { AssessmentDetailsAssessment } from './assessmentDetails.type';

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

type TestWindow = ReturnType<typeof setupDom>['window'];

const assessment: AssessmentDetailsAssessment = {
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

const threats: Threat[] = [
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

const seededEvidence: Evidence = {
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

const createEvidenceRecord = (
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

const setInputValue = (
  window: TestWindow,
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) => {
  element.value = value;
  element.dispatchEvent(
    new Event('input', {
      bubbles: true,
      cancelable: true,
    }),
  );
};

const setSelectValue = (
  window: TestWindow,
  element: HTMLSelectElement,
  value: string,
) => {
  element.value = value;
  element.dispatchEvent(
    new Event('change', {
      bubbles: true,
      cancelable: true,
    }),
  );
};

const toggleCheckbox = (
  window: TestWindow,
  element: HTMLInputElement,
  checked: boolean,
) => {
  element.checked = checked;
  element.dispatchEvent(
    new Event('change', {
      bubbles: true,
      cancelable: true,
    }),
  );
};

const setFileSelection = (
  window: TestWindow,
  element: HTMLInputElement,
  files: File[],
) => {
  Object.defineProperty(element, 'files', {
    value: files,
    configurable: true,
  });

  element.dispatchEvent(
    new Event('change', {
      bubbles: true,
      cancelable: true,
    }),
  );
};

const clickButton = (window: TestWindow, button: HTMLButtonElement) => {
  button.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
    }),
  );
};

const findButtonByText = (root: ParentNode, text: string) =>
  Array.from(root.querySelectorAll('button')).find(button =>
    button.textContent?.includes(text),
  ) as HTMLButtonElement | undefined;

const renderHarness = async (evidenceList: Evidence[]) => {
  const { container, window } = setupDom();

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);

  const Harness = () => {
    const controller = useAssessmentEvidence({
      assessmentId: assessment.id,
      assessmentStatus: assessment.status,
    });

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

  evidenceService.list = async () => evidenceList;
  evidenceService.getById = async evidenceId => {
    if (evidenceId === seededEvidence.id) {
      return seededEvidence;
    }

    throw new Error('Evidence not found.');
  };
  evidenceService.create = async input => createEvidenceRecord(input);
  evidenceService.update = async (_id, input) => ({
    ...seededEvidence,
    ...input,
    httpExchanges:
      input.httpExchanges !== undefined
        ? input.httpExchanges
        : seededEvidence.httpExchanges,
  });
  evidenceService.remove = async () => undefined;

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <Harness />
      </ThemeProvider>,
    );
    await renderTick();
    await renderTick();
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

await (async () => {
  {
    const { container, root, restore } = await renderHarness([]);

    assert.ok(textContent(container).includes('No evidence yet'));
    assert.ok(textContent(container).includes('Add evidence'));

    await act(async () => {
      root.unmount();
    });

    restore();
  }

  {
    const originalList = evidenceService.list;
    evidenceService.list = async () => {
      throw new Error('Unable to load evidence.');
    };

    const { container, root, restore, window } = await renderHarness([]);

    await act(async () => {
      await renderTick();
    });

    assert.ok(textContent(container).includes('Unable to load evidence'));

    await act(async () => {
      root.unmount();
    });

    evidenceService.list = originalList;
    restore();
    void window;
  }
})();

await (async () => {
  const { container, root, window, restore } = await renderHarness([]);

  const addButton = findButtonByText(container, 'Add evidence');

  assert.ok(addButton, 'Expected the create button');

  await act(async () => {
    clickButton(window, addButton!);
    await renderTick();
    await renderTick();
  });

  assert.equal(
    window.document.activeElement?.id,
    'evidence-type',
    'Expected the drawer to focus the first control',
  );
  assert.ok(
    textContent(window.document.body).includes(
      'Remove access tokens, session cookies, passwords and secrets, API keys, authentication headers, and sensitive personal data',
    ),
    'Expected the redaction warning to be visible',
  );
  assert.ok(
    !textContent(window.document.body).includes('uploads/evidence/'),
    'Expected internal storage paths to stay hidden from the UI',
  );

  const typeSelect = window.document.body.querySelector(
    '#evidence-type',
  ) as HTMLSelectElement | null;
  const titleInput = window.document.body.querySelector(
    '#evidence-title',
  ) as HTMLInputElement | null;
  const descriptionInput = window.document.body.querySelector(
    '#evidence-description',
  ) as HTMLTextAreaElement | null;
  const contentInput = window.document.body.querySelector(
    '#evidence-content',
  ) as HTMLTextAreaElement | null;
  const capturedDateInput = window.document.body.querySelector(
    '#evidence-captured-at',
  ) as HTMLInputElement | null;
  const threatOne = window.document.body.querySelector(
    '#evidence-threat-thr_00000000-0000-0000-0000-000000000001',
  ) as HTMLInputElement | null;
  const threatTwo = window.document.body.querySelector(
    '#evidence-threat-thr_00000000-0000-0000-0000-000000000002',
  ) as HTMLInputElement | null;

  assert.ok(
    typeSelect &&
      titleInput &&
      descriptionInput &&
      contentInput &&
      capturedDateInput,
  );

  await act(async () => {
    setSelectValue(window, typeSelect!, 'http');
    setInputValue(window, titleInput!, 'Created HTTP evidence');
    setInputValue(window, descriptionInput!, 'Captured trace');
    setInputValue(window, contentInput!, '<script>alert("x")</script>');
    setInputValue(window, capturedDateInput!, '2026-06-12');
    toggleCheckbox(window, threatOne!, true);
    toggleCheckbox(window, threatTwo!, true);
    await renderTick();
  });

  const requestMethodInputs = window.document.body.querySelectorAll(
    'input[id$="requestMethod"]',
  ) as NodeListOf<HTMLInputElement>;
  const requestUrlInputs = window.document.body.querySelectorAll(
    'input[id$="requestUrl"]',
  ) as NodeListOf<HTMLInputElement>;
  const requestBodyInputs = window.document.body.querySelectorAll(
    'textarea[id$="requestBody"]',
  ) as NodeListOf<HTMLTextAreaElement>;
  const responseStatusInputs = window.document.body.querySelectorAll(
    'input[id$="responseStatusCode"]',
  ) as NodeListOf<HTMLInputElement>;
  const responseBodyInputs = window.document.body.querySelectorAll(
    'textarea[id$="responseBody"]',
  ) as NodeListOf<HTMLTextAreaElement>;

  assert.equal(requestMethodInputs.length, 1);

  await act(async () => {
    setInputValue(window, requestMethodInputs[0]!, 'GET');
    setInputValue(window, requestUrlInputs[0]!, '/api/orders/1');
    setInputValue(window, requestBodyInputs[0]!, 'request body');
    setInputValue(window, responseStatusInputs[0]!, '200');
    setInputValue(window, responseBodyInputs[0]!, 'response body');
    await renderTick();
  });

  const addExchangeButton = findButtonByText(
    window.document.body,
    'Add exchange',
  );

  assert.ok(addExchangeButton, 'Expected the add exchange button');

  await act(async () => {
    clickButton(window, addExchangeButton!);
    await renderTick();
  });

  const requestMethodInputsAfterAdd = window.document.body.querySelectorAll(
    'input[id$="requestMethod"]',
  ) as NodeListOf<HTMLInputElement>;
  const secondExchangeMethod = requestMethodInputsAfterAdd[1];
  const secondExchangeUrl = window.document.body.querySelectorAll(
    'input[id$="requestUrl"]',
  )[1] as HTMLInputElement;
  const secondExchangeStatus = window.document.body.querySelectorAll(
    'input[id$="responseStatusCode"]',
  )[1] as HTMLInputElement;

  assert.ok(secondExchangeMethod && secondExchangeUrl && secondExchangeStatus);

  await act(async () => {
    setInputValue(window, secondExchangeMethod!, 'POST');
    setInputValue(window, secondExchangeUrl!, '/api/orders/2');
    setInputValue(window, secondExchangeStatus!, '201');
    await renderTick();
  });

  const moveDownButton = Array.from(
    window.document.body.querySelectorAll('button'),
  ).find(button => button.textContent?.includes('Move down')) as
    | HTMLButtonElement
    | undefined;

  assert.ok(moveDownButton, 'Expected a move down control');

  await act(async () => {
    clickButton(window, moveDownButton!);
    await renderTick();
  });

  const attachmentInput = window.document.body.querySelector(
    '#evidence-attachment',
  ) as HTMLInputElement | null;

  assert.ok(attachmentInput, 'Expected the attachment input');

  await act(async () => {
    setFileSelection(window, attachmentInput!, [
      {
        name: 'capture.json',
        type: 'application/json',
        size: 1234,
      } as unknown as File,
    ]);
    await renderTick();
  });

  assert.ok(textContent(window.document.body).includes('capture.json'));

  const submitButton = findButtonByText(
    window.document.body,
    'Create evidence',
  );
  assert.ok(submitButton, 'Expected the create submit button');

  await act(async () => {
    clickButton(window, submitButton!);
    await renderTick();
    await renderTick();
  });

  assert.ok(
    textContent(window.document.body).includes('Evidence saved.'),
    'Expected a success indication after create',
  );
  assert.ok(
    textContent(window.document.body).includes('Created HTTP evidence'),
  );
  assert.ok(
    textContent(window.document.body).includes('<script>alert("x")</script>'),
  );
  assert.equal(window.document.body.querySelector('script'), null);

  const createdEditButton = findButtonByText(window.document.body, 'Edit');
  assert.ok(createdEditButton, 'Expected the edit action on the evidence card');

  await act(async () => {
    clickButton(window, createdEditButton!);
    await renderTick();
    await renderTick();
  });

  const restoredThreatOne = window.document.body.querySelector(
    '#evidence-threat-thr_00000000-0000-0000-0000-000000000001',
  ) as HTMLInputElement | null;
  const restoredThreatTwo = window.document.body.querySelector(
    '#evidence-threat-thr_00000000-0000-0000-0000-000000000002',
  ) as HTMLInputElement | null;
  const editTypeSelect = window.document.body.querySelector(
    '#evidence-type',
  ) as HTMLSelectElement | null;

  assert.ok(restoredThreatOne?.checked);
  assert.ok(restoredThreatTwo?.checked);

  await act(async () => {
    toggleCheckbox(window, restoredThreatOne!, false);
    toggleCheckbox(window, restoredThreatTwo!, false);
    setSelectValue(window, editTypeSelect!, 'text');
    await renderTick();
  });

  const exchangeSection = window.document.body.querySelector(
    'section[aria-labelledby="evidence-http-exchanges-heading"]',
  );
  assert.equal(
    exchangeSection,
    null,
    'Expected HTTP controls to disappear for text evidence',
  );

  const saveButton = findButtonByText(window.document.body, 'Save evidence');
  assert.ok(saveButton, 'Expected the save submit button');

  await act(async () => {
    clickButton(window, saveButton!);
    await renderTick();
    await renderTick();
  });

  assert.ok(
    textContent(window.document.body).includes('Evidence saved.'),
    'Expected a success indication after update',
  );

  const openButton = window.document.body.querySelector(
    '.assessment-evidence-card-title-button',
  ) as HTMLButtonElement | null;
  assert.ok(openButton, 'Expected the evidence card open button');

  await act(async () => {
    clickButton(window, openButton!);
    await renderTick();
    await renderTick();
  });

  assert.ok(textContent(window.document.body).includes('Delete evidence'));

  const originalGetById = evidenceService.getById;
  evidenceService.getById = async () => {
    throw new Error('Attachment unavailable.');
  };

  const downloadButton = findButtonByText(
    window.document.body,
    'Download attachment',
  );
  assert.ok(downloadButton, 'Expected the attachment download action');

  await act(async () => {
    clickButton(window, downloadButton!);
    await renderTick();
    await renderTick();
  });

  assert.ok(
    textContent(window.document.body).includes('Unable to download attachment'),
    'Expected a safe attachment download error',
  );

  evidenceService.getById = originalGetById;

  const deleteButton = findButtonByText(
    window.document.body,
    'Delete evidence',
  );
  assert.ok(deleteButton, 'Expected the delete action in the drawer');

  await act(async () => {
    clickButton(window, deleteButton!);
    await renderTick();
  });

  assert.ok(
    textContent(window.document.body).includes(
      'Delete the current evidence record',
    ),
  );

  const confirmDeleteButton = findButtonByText(
    window.document.body,
    'Delete evidence',
  );
  assert.ok(confirmDeleteButton, 'Expected the delete confirmation button');

  await act(async () => {
    clickButton(window, confirmDeleteButton!);
    await renderTick();
    await renderTick();
  });

  assert.ok(
    textContent(window.document.body).includes('Evidence deleted.'),
    'Expected a success indication after delete',
  );

  await act(async () => {
    root.unmount();
  });

  restore();
})();

await (async () => {
  const originalGetById = evidenceService.getById;
  const originalCreate = evidenceService.create;
  const originalList = evidenceService.list;

  evidenceService.list = async () => [seededEvidence];
  evidenceService.getById = async () => {
    throw new Error('Evidence not found.');
  };
  evidenceService.create = originalCreate;

  const { container, root, window, restore } = await renderHarness([
    seededEvidence,
  ]);

  const openButton = window.document.body.querySelector(
    '.assessment-evidence-card-title-button',
  ) as HTMLButtonElement | null;

  assert.ok(openButton, 'Expected the open evidence button');

  await act(async () => {
    clickButton(window, openButton!);
    await renderTick();
    await renderTick();
  });

  assert.ok(
    textContent(window.document.body).includes('Unable to load evidence'),
  );
  assert.ok(textContent(window.document.body).includes('Retry'));

  const addButton = findButtonByText(container, 'Add evidence');
  assert.equal(addButton?.textContent?.includes('Add evidence'), true);

  const invalidAttachmentAdd = addButton;
  assert.ok(invalidAttachmentAdd);

  await act(async () => {
    clickButton(window, invalidAttachmentAdd!);
    await renderTick();
    await renderTick();
  });

  const attachmentInput = window.document.body.querySelector(
    '#evidence-attachment',
  ) as HTMLInputElement | null;

  assert.ok(attachmentInput, 'Expected attachment input in the create drawer');

  await act(async () => {
    setFileSelection(window, attachmentInput!, [
      {
        name: 'unsafe.html',
        type: 'text/html',
        size: 10,
      } as unknown as File,
    ]);
    await renderTick();
  });

  assert.ok(
    textContent(window.document.body).includes('evidence attachment allowlist'),
    'Expected file-type validation feedback',
  );

  const bigFile = {
    name: 'big.png',
    type: 'image/png',
    size: 5 * 1024 * 1024 + 1,
  } as unknown as File;

  await act(async () => {
    setFileSelection(window, attachmentInput!, [bigFile]);
    await renderTick();
  });

  assert.ok(
    textContent(window.document.body).includes('5 MB or smaller'),
    'Expected file-size validation feedback',
  );

  await act(async () => {
    root.unmount();
  });

  evidenceService.list = originalList;
  evidenceService.getById = originalGetById;
  restore();
})();

function textContent(container: HTMLElement) {
  return container.textContent ?? '';
}
