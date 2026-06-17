import assert from 'node:assert/strict';

import { act } from 'react';

import { evidenceService } from '~/services';

import {
  renderHarness,
  renderTick,
  textContent,
} from '../testUtils/renderEvidenceTestApp';

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

    restore();
    evidenceService.list = originalList;
    void window;
  }
})();
