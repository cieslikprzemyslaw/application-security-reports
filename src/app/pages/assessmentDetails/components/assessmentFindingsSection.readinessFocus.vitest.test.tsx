import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { act, waitFor } from '~/test/vitestLegacyBridge';

import {
  finding,
  renderHarness,
  renderTick,
  textContent,
} from './assessmentFindingsSection.testUtils';

describe('Assessment Findings readiness target', () => {
  it('opens the requested Threat editor, expands the section, and focuses the mapped field', async () => {
    const { root, window, events } = await renderHarness('in-progress', {
      initialEditTarget: {
        threatId: finding.id,
        focusField: 'observation',
      },
    });

    try {
      await waitFor(() => {
        const field = window.document.getElementById('threat-observation');
        const sectionToggle = Array.from(
          window.document.body.querySelectorAll<HTMLButtonElement>('button'),
        ).find(button => button.textContent?.includes('Security details'));

        assert.ok(textContent(window.document.body).includes('Edit threat'));
        assert.ok(field, 'Expected the requested Threat field');
        assert.equal(window.document.activeElement, field);
        assert.equal(sectionToggle?.getAttribute('aria-expanded'), 'true');
      });

      assert.ok(events.includes('edit'));
      assert.ok(events.includes('initial-target-handled'));
    } finally {
      await act(async () => {
        root.unmount();
        await renderTick();
      });
    }
  });
});
