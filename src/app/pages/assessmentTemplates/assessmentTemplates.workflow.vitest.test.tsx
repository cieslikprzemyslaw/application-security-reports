import assert from 'node:assert/strict';

import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { describe, it, vi } from 'vitest';

import {
  act,
  createTestDom,
  createTestingLibraryRoot,
  fireEvent,
} from '~/test/vitestLegacyBridge';
import { defaultTheme } from '~/theme';

const service = vi.hoisted(() => ({
  list: vi.fn(),
  archive: vi.fn(),
  restore: vi.fn(),
}));

vi.mock('~/services', () => ({ assessmentTemplateService: service }));

import AssessmentTemplates from './assessmentTemplates.component';

const activeTemplate = {
  id: 'tpl_00000000-0000-0000-0000-000000000001',
  name: 'Active API template',
  assessmentType: 'API',
  environment: 'Production',
  archivedAt: null,
  createdAt: '2026-07-25T09:00:00.000Z',
  updatedAt: '2026-07-25T09:00:00.000Z',
};

const archivedTemplate = {
  ...activeTemplate,
  id: 'tpl_00000000-0000-0000-0000-000000000002',
  name: 'Archived template',
  archivedAt: '2026-07-25T10:00:00.000Z',
};

const waitForRender = () =>
  new Promise<void>(resolve => setTimeout(resolve, 0));

const setupDom = () => {
  const dom = createTestDom(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: 'http://localhost/settings/assessment-templates' },
  );
  const { window } = dom;

  for (const [key, value] of Object.entries({
    window,
    document: window.document,
    navigator: window.navigator,
    HTMLElement: window.HTMLElement,
    Node: window.Node,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  }

  Object.defineProperty(window, 'confirm', {
    value: vi.fn(() => true),
    configurable: true,
  });

  return window.document.getElementById('root') as HTMLElement;
};

describe('Assessment Templates management workflow', () => {
  it('renders active templates and connects the confirmed Archive action', async () => {
    service.list.mockResolvedValue([activeTemplate, archivedTemplate]);
    service.archive.mockResolvedValue({
      ...activeTemplate,
      archivedAt: '2026-07-25T11:00:00.000Z',
    });

    const container = setupDom();
    const root = createTestingLibraryRoot(container);

    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <MemoryRouter initialEntries={['/settings/assessment-templates']}>
            <AssessmentTemplates />
          </MemoryRouter>
        </ThemeProvider>,
      );
      await waitForRender();
    });

    const tableText = container.querySelector('tbody')?.textContent ?? '';
    assert.match(tableText, /Active API template/);
    assert.doesNotMatch(tableText, /Archived template/);

    const archiveButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.trim() === 'Archive',
    );
    assert.ok(archiveButton, 'Expected the Archive action to render');

    await act(async () => {
      fireEvent.click(archiveButton!);
      await waitForRender();
    });

    assert.equal(service.archive.mock.calls[0]?.[0], activeTemplate.id);

    await act(async () => {
      root.unmount();
    });
  });
});
