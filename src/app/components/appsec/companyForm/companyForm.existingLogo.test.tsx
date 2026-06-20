import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import { defaultTheme } from '~/theme';

import CompanyForm from './companyForm.component';
import type { CompanyFormValue } from './companyForm.type';

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

  window.URL.createObjectURL = () => 'blob:mock-preview-url';
  window.URL.revokeObjectURL = () => undefined;

  setGlobal('window', window);
  setGlobal('document', window.document);
  setGlobal('navigator', window.navigator);
  setGlobal('HTMLElement', window.HTMLElement);
  setGlobal('Node', window.Node);
  setGlobal('URL', window.URL);
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
  Object.defineProperty(window.HTMLElement.prototype, 'attachEvent', {
    value: () => undefined,
    configurable: true,
  });
  Object.defineProperty(window.HTMLElement.prototype, 'detachEvent', {
    value: () => undefined,
    configurable: true,
  });

  return {
    container: window.document.getElementById('root'),
    window,
  };
};

const emptyValue: CompanyFormValue = {
  name: 'Acme Corp',
  description: '',
  website: '',
  contactName: '',
  contactEmail: '',
  footerText: '',
  logoFile: null,
  hasExistingLogo: false,
};

await (async () => {
  // Existing logo preview renders when hasExistingLogo is true
  {
    const { container, window } = setupDom();
    assert.ok(container, 'Expected root container to exist');
    const root = createRoot(container);
    const existingLogoValue: CompanyFormValue = {
      ...emptyValue,
      hasExistingLogo: true,
    };
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <CompanyForm
            value={existingLogoValue}
            existingLogoUrl="http://localhost/api/companies/cmp_00000000-0000-0000-0000-000000000001/logo"
            onChange={() => undefined}
            onSubmit={event => event.preventDefault()}
            onCancel={() => undefined}
          />
        </ThemeProvider>,
      );
      await renderTick();
    });

    const previewImg = window.document.querySelector(
      '.company-logo-preview-img',
    ) as HTMLImageElement | null;
    assert.ok(
      previewImg,
      'Expected preview image to render when hasExistingLogo is true',
    );
    assert.ok(
      previewImg.src.includes('/api/companies/'),
      'Expected preview src to use the existing logo URL',
    );

    const logoInput = window.document.querySelector('#company-logo');
    assert.ok(
      !logoInput,
      'Expected dropzone to be hidden when existing logo is shown',
    );
    await act(async () => root.unmount());
  }

  // Remove button on existing logo sets hasExistingLogo to false
  {
    const { container, window } = setupDom();
    assert.ok(container, 'Expected root container to exist');
    const root = createRoot(container);
    const changeEvents: CompanyFormValue[] = [];
    const existingLogoValue: CompanyFormValue = {
      ...emptyValue,
      hasExistingLogo: true,
    };
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <CompanyForm
            value={existingLogoValue}
            existingLogoUrl="http://localhost/api/companies/cmp_00000000-0000-0000-0000-000000000001/logo"
            onChange={v => changeEvents.push(v)}
            onSubmit={event => event.preventDefault()}
            onCancel={() => undefined}
          />
        </ThemeProvider>,
      );
      await renderTick();
    });

    const removeButton = Array.from(
      window.document.querySelectorAll<HTMLButtonElement>('button'),
    ).find(btn => btn.textContent?.includes('Remove logo'));
    assert.ok(
      removeButton,
      'Expected a Remove logo button when showing existing logo',
    );
    await act(async () => {
      removeButton.dispatchEvent(
        new window.MouseEvent('click', { bubbles: true }),
      );
      await renderTick();
    });

    assert.equal(changeEvents.length, 1, 'Expected one onChange event');
    assert.equal(
      changeEvents[0].hasExistingLogo,
      false,
      'Expected hasExistingLogo to be false after removing existing logo',
    );
    assert.equal(
      changeEvents[0].logoFile,
      null,
      'Expected logoFile to be null after removing existing logo',
    );
    await act(async () => root.unmount());
  }

  // Without existingLogoUrl, hasExistingLogo=true still shows dropzone
  {
    const { container, window } = setupDom();
    assert.ok(container, 'Expected root container to exist');
    const root = createRoot(container);
    const existingLogoValue: CompanyFormValue = {
      ...emptyValue,
      hasExistingLogo: true,
    };
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <CompanyForm
            value={existingLogoValue}
            onChange={() => undefined}
            onSubmit={event => event.preventDefault()}
            onCancel={() => undefined}
          />
        </ThemeProvider>,
      );
      await renderTick();
    });

    const logoInput = window.document.querySelector('#company-logo');
    assert.ok(
      logoInput,
      'Expected dropzone when hasExistingLogo is true but no existingLogoUrl provided',
    );
    await act(async () => root.unmount());
  }
})();
