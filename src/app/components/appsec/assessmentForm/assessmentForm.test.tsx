import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import { defaultTheme } from '~/theme';

import {
  assessmentFormValueToCreateInput,
  assessmentFormValueToUpdateInput,
  assessmentToFormValue,
  createEmptyAssessmentFormValue,
  validateAssessmentFormValue,
} from './assessmentForm.utils';
import AssessmentForm from './assessmentForm.component';

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

{
  const formValue = createEmptyAssessmentFormValue();
  const mappedValue = assessmentToFormValue({
    title: 'Customer Services Portal',
    applicationName: 'https://portal.example',
    assessmentType: 'Web App',
    description: 'Assessment of the customer portal',
    scope: 'Web application',
    status: 'draft',
  });

  assert.equal(mappedValue.name, 'Customer Services Portal');
  assert.equal(mappedValue.applicationName, 'https://portal.example');

  assert.deepEqual(
    validateAssessmentFormValue(
      { ...formValue, applicationName: '' },
      'create',
    ),
    {
      name: 'Assessment name is required.',
      applicationName: 'Application or website is required.',
    },
  );

  assert.deepEqual(
    assessmentFormValueToCreateInput('cmp_1', {
      ...formValue,
      name: 'Customer Services Portal',
      applicationName: 'https://portal.example',
      description: 'Assessment of the customer portal',
      scope: 'Web application',
      typeMode: 'preset',
      presetType: 'Web App',
      customType: '',
      status: 'draft',
    }),
    {
      companyId: 'cmp_1',
      title: 'Customer Services Portal',
      applicationName: 'https://portal.example',
      description: 'Assessment of the customer portal',
      scope: 'Web application',
      status: 'draft',
      assessmentType: 'Web App',
    },
  );

  assert.deepEqual(
    assessmentFormValueToUpdateInput({
      ...formValue,
      name: 'Customer Services Portal',
      applicationName: 'https://portal.example',
      description: 'Assessment of the customer portal',
      scope: 'Web application',
      typeMode: 'custom',
      presetType: 'Web App',
      customType: 'Portal review',
      status: 'in-progress',
    }),
    {
      title: 'Customer Services Portal',
      applicationName: 'https://portal.example',
      description: 'Assessment of the customer portal',
      scope: 'Web application',
      status: 'in-progress',
      assessmentType: 'Portal review',
    },
  );
}

{
  const { container, window } = setupDom();

  assert.ok(container, 'Expected root container to exist');
  const root = createRoot(container);
  const changeEvents = [] as Array<
    ReturnType<typeof createEmptyAssessmentFormValue>
  >;

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <AssessmentForm
          mode="create"
          value={{
            ...createEmptyAssessmentFormValue(),
            name: 'Customer Services Portal',
          }}
          errors={{
            applicationName: 'Application or website is required.',
          }}
          onChange={value => changeEvents.push(value)}
          onSubmit={event => event.preventDefault()}
          onCancel={() => undefined}
        />
      </ThemeProvider>,
    );
    await renderTick();
  });

  assert.ok(
    textContent(container).includes('Application or website'),
    'Expected the application field label to render',
  );
  assert.ok(
    textContent(container).includes(
      'Enter the application name or website covered by this assessment.',
    ),
    'Expected helper text for the application field',
  );
  assert.equal(
    window.document.activeElement?.id,
    'assessment-application-name',
    'Expected the first field error to receive focus',
  );

  const applicationInput = window.document.querySelector(
    '#assessment-application-name',
  ) as HTMLInputElement | null;
  assert.ok(applicationInput, 'Expected the application field to exist');

  await act(async () => {
    applicationInput!.value = 'Customer Portal';
    applicationInput!.dispatchEvent(
      new window.Event('input', { bubbles: true, cancelable: true }),
    );
    await renderTick();
  });

  assert.equal(changeEvents.length, 1);
  assert.equal(changeEvents[0]?.applicationName, 'Customer Portal');

  await act(async () => {
    root.unmount();
  });
}

function textContent(container: HTMLElement) {
  return container.textContent ?? '';
}

console.log('assessment form checks passed');
