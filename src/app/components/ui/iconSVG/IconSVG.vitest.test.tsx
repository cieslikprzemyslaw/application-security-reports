import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { renderToStaticMarkup } from 'react-dom/server';

import IconSVG from './IconSVG';

describe('IconSVG', () => {
  it('passes the migrated checks', async () => {
    const decorativeMarkup = renderToStaticMarkup(<IconSVG name="upload" />);

    assert.ok(
      decorativeMarkup.includes('aria-hidden="true"'),
      'Expected decorative icons to be hidden from assistive technology',
    );
    assert.ok(
      decorativeMarkup.includes('stroke="currentColor"'),
      'Expected icon strokes to inherit currentColor',
    );
    assert.ok(
      decorativeMarkup.includes('width="1rem"'),
      'Expected the default icon size to use shared sizing',
    );

    const labelledMarkup = renderToStaticMarkup(
      <IconSVG name="settings" label="Workspace settings" size="large" />,
    );

    assert.ok(
      labelledMarkup.includes('role="img"'),
      'Expected labelled icons to be announced as images',
    );
    assert.ok(
      labelledMarkup.includes('aria-label="Workspace settings"'),
      'Expected labelled icons to expose the supplied accessible name',
    );
    assert.ok(
      labelledMarkup.includes('width="1.25rem"'),
      'Expected the large icon size to be applied consistently',
    );

    console.log('IconSVG checks passed');
  });
});
