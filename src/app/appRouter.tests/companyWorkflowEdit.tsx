import {
  act,
  assert,
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  setFetch,
} from './support';

const company = {
  id: 'cmp_00000000-0000-0000-0000-000000000201',
  name: 'Northwind Labs',
  description: 'Cloud security partner',
  website: 'https://northwind.example',
  contactName: 'Alex Example',
  contactEmail: 'security@northwind.example',
  logoUrl:
    'http://localhost/api/companies/cmp_00000000-0000-0000-0000-000000000201/logo',
  footerText: 'Confidential',
  assessmentCount: 2,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

const getRequestDetails = (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : undefined;

  return {
    method: (init?.method ?? request?.method ?? 'GET').toUpperCase(),
    path: new URL(request?.url ?? String(input), 'http://localhost').pathname,
  };
};

const createErrorResponse = (status: number, message: string) =>
  createJsonResponse(
    {
      error: {
        code: 'COMPANY_UPDATE_FAILED',
        message,
        details: [],
      },
    },
    { status },
  );

const click = async (element: HTMLElement) => {
  await act(async () => {
    element.dispatchEvent(
      new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );

    await renderTick();
    await renderTick();
    await renderTick();
  });
};

const findButton = (text: string) =>
  Array.from(
    window.document.querySelectorAll<HTMLButtonElement>('button'),
  ).find(button => button.textContent?.trim() === text);

export const runCompanyWorkflowEditTests = async () => {
  let updateAttempts = 0;

  setFetch(async (input, init) => {
    const request = getRequestDetails(input, init);

    if (request.method === 'GET' && request.path === '/api/companies') {
      return createJsonResponse({ data: [company] });
    }

    if (
      request.method === 'PATCH' &&
      request.path === `/api/companies/${company.id}`
    ) {
      updateAttempts += 1;

      return createErrorResponse(500, 'Unable to update company.');
    }

    throw new Error(`Unexpected request: ${request.method} ${request.path}`);
  });

  try {
    const { container, root } = await renderApp('/companies');

    const actionsButton = container.querySelector<HTMLButtonElement>(
      `button[aria-label="Actions for ${company.name}"]`,
    );

    assert.ok(actionsButton, 'Expected the Company row actions');

    await click(actionsButton);

    const editButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
    ).find(button => button.textContent?.trim() === 'Edit');

    assert.ok(editButton, 'Expected the Edit company action');

    await click(editButton);

    const drawer = window.document.querySelector<HTMLElement>('.drawer-panel');

    assert.ok(drawer, 'Expected the Edit company drawer');
    assert.ok(
      drawer.querySelector('.company-logo-preview-img'),
      'Expected the existing company logo',
    );

    const removeLogoButton = Array.from(
      drawer.querySelectorAll<HTMLButtonElement>('button'),
    ).find(button => button.textContent?.trim() === 'Remove logo');

    assert.ok(removeLogoButton, 'Expected the Remove logo action');

    await click(removeLogoButton);

    assert.equal(
      window.document.querySelector('.drawer-panel .company-logo-preview-img'),
      null,
      'Expected the existing logo preview to be removed',
    );
    assert.ok(
      window.document.querySelector('.drawer-panel input#company-logo'),
      'Expected the logo dropzone after removing the logo',
    );

    const cancelButton = Array.from(
      window.document.querySelectorAll<HTMLButtonElement>(
        '.drawer-panel button',
      ),
    ).find(button => button.textContent?.trim() === 'Cancel');

    assert.ok(cancelButton, 'Expected the drawer cancel action');

    await click(cancelButton);

    const keepEditingButton = findButton('Keep editing');

    assert.ok(
      keepEditingButton,
      'Expected the dirty form discard confirmation',
    );
    await click(keepEditingButton);

    assert.ok(
      window.document.querySelector('.drawer-panel'),
      'Expected rejected discard confirmation to keep the drawer open',
    );
    assert.ok(
      window.document.querySelector('.drawer-panel input#company-logo'),
      'Expected the unsaved logo removal to be preserved',
    );

    const saveButton = window.document.querySelector<HTMLButtonElement>(
      '.drawer-panel button[type="submit"]',
    );

    assert.ok(saveButton, 'Expected the Save changes action');

    await click(saveButton);

    assert.equal(updateAttempts, 1);
    assert.ok(
      window.document.body.textContent?.includes('Unable to update company.'),
      'Expected the safe update failure message',
    );
    assert.ok(
      window.document.querySelector('.drawer-panel input#company-logo'),
      'Expected entered changes to remain after failed save',
    );
    assert.equal(
      container.querySelector('.company-table__name')?.textContent,
      company.name,
      'Expected failed save to preserve confirmed table state',
    );

    const finalCancelButton = Array.from(
      window.document.querySelectorAll<HTMLButtonElement>(
        '.drawer-panel button',
      ),
    ).find(button => button.textContent?.trim() === 'Cancel');

    assert.ok(finalCancelButton, 'Expected the final cancel action');

    await click(finalCancelButton);

    const discardButton = findButton('Discard changes');

    assert.ok(discardButton, 'Expected the confirmed discard action');
    await click(discardButton);

    assert.equal(
      window.document.querySelector('.drawer-panel'),
      null,
      'Expected confirmed discard to close the drawer',
    );

    await act(async () => {
      root.unmount();
    });
  } finally {
    restoreFetch();
  }
};
