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
};

await (async () => {
  // Dropzone renders when no logo file is selected
  {
    const { container, window } = setupDom();
    assert.ok(container, 'Expected root container to exist');
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <CompanyForm
            value={emptyValue}
            onChange={() => undefined}
            onSubmit={event => event.preventDefault()}
            onCancel={() => undefined}
          />
        </ThemeProvider>,
      );
      await renderTick();
    });

    const logoInput = window.document.querySelector('#company-logo');
    assert.ok(logoInput, 'Expected company logo dropzone input to be present');

    const previewImg = window.document.querySelector(
      '.company-logo-preview-img',
    );
    assert.ok(
      !previewImg,
      'Expected no preview image when no file is selected',
    );
    await act(async () => root.unmount());
  }

  // Invalid file type (SVG) shows an error and does not call onChange
  {
    const { container, window } = setupDom();
    assert.ok(container, 'Expected root container to exist');
    const root = createRoot(container);
    const changeEvents: CompanyFormValue[] = [];
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <CompanyForm
            value={emptyValue}
            onChange={v => changeEvents.push(v)}
            onSubmit={event => event.preventDefault()}
            onCancel={() => undefined}
          />
        </ThemeProvider>,
      );
      await renderTick();
    });

    const input = window.document.querySelector(
      '#company-logo',
    ) as HTMLInputElement | null;
    assert.ok(input, 'Expected logo dropzone input');

    const svgFile = new window.File(['<svg/>'], 'logo.svg', {
      type: 'image/svg+xml',
    });
    await act(async () => {
      Object.defineProperty(input, 'files', {
        value: { 0: svgFile, length: 1, item: () => svgFile },
        configurable: true,
      });
      input.dispatchEvent(new window.Event('change', { bubbles: true }));
      await renderTick();
    });

    const error = window.document.querySelector('.dropzone-error');
    assert.ok(error, 'Expected an error message for an unsupported file type');
    assert.ok(
      error.textContent?.includes('not supported'),
      'Expected error text to mention file type is not supported',
    );
    assert.equal(
      changeEvents.length,
      0,
      'Expected onChange not to be called for an invalid file',
    );
    await act(async () => root.unmount());
  }

  // Unknown / empty MIME type shows an error
  {
    const { container, window } = setupDom();
    assert.ok(container, 'Expected root container to exist');
    const root = createRoot(container);
    const changeEvents: CompanyFormValue[] = [];
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <CompanyForm
            value={emptyValue}
            onChange={v => changeEvents.push(v)}
            onSubmit={event => event.preventDefault()}
            onCancel={() => undefined}
          />
        </ThemeProvider>,
      );
      await renderTick();
    });

    const input = window.document.querySelector(
      '#company-logo',
    ) as HTMLInputElement | null;
    assert.ok(input, 'Expected logo dropzone input');

    const unknownFile = new window.File(['data'], 'logo.bmp', { type: '' });
    await act(async () => {
      Object.defineProperty(input, 'files', {
        value: { 0: unknownFile, length: 1, item: () => unknownFile },
        configurable: true,
      });
      input.dispatchEvent(new window.Event('change', { bubbles: true }));
      await renderTick();
    });

    assert.equal(
      changeEvents.length,
      0,
      'Expected onChange not to be called for an unknown MIME type',
    );
    await act(async () => root.unmount());
  }

  // Valid JPEG file calls onChange with the file and shows preview
  {
    const { container, window } = setupDom();
    assert.ok(container, 'Expected root container to exist');
    const root = createRoot(container);
    const changeEvents: CompanyFormValue[] = [];
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <CompanyForm
            value={emptyValue}
            onChange={v => changeEvents.push(v)}
            onSubmit={event => event.preventDefault()}
            onCancel={() => undefined}
          />
        </ThemeProvider>,
      );
      await renderTick();
    });

    const input = window.document.querySelector(
      '#company-logo',
    ) as HTMLInputElement | null;
    assert.ok(input, 'Expected logo dropzone input');

    const jpegFile = new window.File(['fake-jpeg'], 'logo.jpg', {
      type: 'image/jpeg',
    });
    await act(async () => {
      Object.defineProperty(input, 'files', {
        value: { 0: jpegFile, length: 1, item: () => jpegFile },
        configurable: true,
      });
      input.dispatchEvent(new window.Event('change', { bubbles: true }));
      await renderTick();
    });

    assert.equal(changeEvents.length, 1, 'Expected one onChange event');
    assert.equal(
      changeEvents[0].logoFile,
      jpegFile,
      'Expected logoFile to be set to the selected file',
    );
    await act(async () => root.unmount());
  }

  // Valid PNG file calls onChange with the file
  {
    const { container, window } = setupDom();
    assert.ok(container, 'Expected root container to exist');
    const root = createRoot(container);
    const changeEvents: CompanyFormValue[] = [];
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <CompanyForm
            value={emptyValue}
            onChange={v => changeEvents.push(v)}
            onSubmit={event => event.preventDefault()}
            onCancel={() => undefined}
          />
        </ThemeProvider>,
      );
      await renderTick();
    });

    const input = window.document.querySelector(
      '#company-logo',
    ) as HTMLInputElement | null;
    assert.ok(input, 'Expected logo dropzone input');

    const pngFile = new window.File(['fake-png'], 'logo.png', {
      type: 'image/png',
    });
    await act(async () => {
      Object.defineProperty(input, 'files', {
        value: { 0: pngFile, length: 1, item: () => pngFile },
        configurable: true,
      });
      input.dispatchEvent(new window.Event('change', { bubbles: true }));
      await renderTick();
    });

    assert.equal(
      changeEvents[0].logoFile,
      pngFile,
      'Expected logoFile to be set for PNG',
    );
    await act(async () => root.unmount());
  }

  // Preview image renders and remove button calls onChange with null
  {
    const { container, window } = setupDom();
    assert.ok(container, 'Expected root container to exist');
    const root = createRoot(container);
    const changeEvents: CompanyFormValue[] = [];

    const pngFile = new window.File(['fake-png'], 'logo.png', {
      type: 'image/png',
    });
    const valueWithFile: CompanyFormValue = {
      ...emptyValue,
      logoFile: pngFile,
    };
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <CompanyForm
            value={valueWithFile}
            onChange={v => changeEvents.push(v)}
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
    assert.ok(previewImg, 'Expected preview image to render when file is set');
    assert.equal(
      previewImg.src,
      'blob:mock-preview-url',
      'Expected preview src from createObjectURL',
    );

    const removeButton = Array.from(
      window.document.querySelectorAll<HTMLButtonElement>('button'),
    ).find(btn => btn.textContent?.includes('Remove logo'));
    assert.ok(removeButton, 'Expected a Remove logo button in the preview');
    await act(async () => {
      removeButton.dispatchEvent(
        new window.MouseEvent('click', { bubbles: true }),
      );
      await renderTick();
    });

    assert.equal(
      changeEvents.length,
      1,
      'Expected onChange to be called after remove',
    );
    assert.equal(
      changeEvents[0].logoFile,
      null,
      'Expected logoFile to be null after remove',
    );
    await act(async () => root.unmount());
  }

  // Replace button is rendered alongside the preview
  {
    const { container, window } = setupDom();
    assert.ok(container, 'Expected root container to exist');
    const root = createRoot(container);

    const webpFile = new window.File(['fake-webp'], 'logo.webp', {
      type: 'image/webp',
    });
    const valueWithFile: CompanyFormValue = {
      ...emptyValue,
      logoFile: webpFile,
    };
    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <CompanyForm
            value={valueWithFile}
            onChange={() => undefined}
            onSubmit={event => event.preventDefault()}
            onCancel={() => undefined}
          />
        </ThemeProvider>,
      );
      await renderTick();
    });

    const replaceButton = Array.from(
      window.document.querySelectorAll<HTMLButtonElement>('button'),
    ).find(btn => btn.textContent?.includes('Replace logo'));
    assert.ok(replaceButton, 'Expected a Replace logo button in the preview');
    await act(async () => root.unmount());
  }
})();
