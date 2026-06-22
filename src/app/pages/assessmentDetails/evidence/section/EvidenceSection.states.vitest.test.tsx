import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { act } from '~/test/vitestLegacyBridge';

import { renderHarness, textContent } from '../testUtils/renderEvidenceTestApp';

describe('EvidenceSection.states', () => {
  it('passes the migrated checks', async () => {
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
        const { container, root, restore, window } = await renderHarness([], {
          list: async () => {
            throw new Error('Unable to load evidence.');
          },
        });

        assert.ok(textContent(container).includes('Unable to load evidence'));

        await act(async () => {
          root.unmount();
        });

        restore();
        void window;
      }
    })();
  }, 15_000);
});
