import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ServerStyleSheet, ThemeProvider } from 'styled-components';

import Button from '../button';
import { defaultTheme } from '~/theme';

import EmptyState from './emptyState.component';

const sheet = new ServerStyleSheet();

try {
  const markup = renderToString(
    sheet.collectStyles(
      <ThemeProvider theme={defaultTheme}>
        <EmptyState
          variant="no-results"
          title="No threats match the current search"
          description={
            <>
              <p>
                Long guidance should wrap safely and keep the action row visible
                on narrow containers.
              </p>
              <p>
                The pattern should remain readable when the layout collapses to
                a single column.
              </p>
            </>
          }
          primaryAction={<Button title="Clear filters" />}
          secondaryAction={<Button title="Create threat" variant="secondary" />}
        />
      </ThemeProvider>,
    ),
  );

  assert.ok(markup.includes('data-variant="no-results"'));

  const markupDocument = new JSDOM(
    `<!doctype html><html><body>${markup}</body></html>`,
  ).window.document;

  const responsiveContainer = markupDocument.querySelector(
    '.empty-state-container',
  );
  const responsiveLayout = markupDocument.querySelector(
    '.empty-state-layout[data-variant="no-results"]',
  );

  assert.ok(
    responsiveContainer,
    'Expected a parent container for responsive layout',
  );
  assert.ok(
    responsiveLayout,
    'Expected a descendant empty-state layout element',
  );
  assert.equal(
    responsiveLayout.parentElement,
    responsiveContainer,
    'Expected the responsive layout to be a descendant of the query container',
  );

  const styles = sheet.getStyleTags();

  assert.match(
    styles,
    /container-type:\s*inline-size\s*;?/,
    'Expected the wrapper to establish an inline-size container',
  );
  assert.match(
    styles,
    /container-name:\s*empty-state\s*;?/,
    'Expected the wrapper to establish the named empty-state container',
  );

  const containerQueryMatch =
    /@container\s+empty-state\s*\(max-width:\s*30rem\)\s*\{/.exec(styles);
  const containerQueryIndex = containerQueryMatch?.index ?? -1;

  assert.ok(
    containerQueryIndex >= 0,
    'Expected the empty state to define a narrow container query',
  );

  const responsiveStyles = styles.slice(containerQueryIndex);

  assert.match(
    responsiveStyles,
    /\.empty-state-layout\.empty-state--first-use/,
    'Expected the query to target the descendant first-use layout',
  );
  assert.match(
    responsiveStyles,
    /\.empty-state-layout\.empty-state--no-results/,
    'Expected the query to target the descendant no-results layout',
  );
  assert.match(
    responsiveStyles,
    /\.empty-state-layout\.empty-state--unavailable/,
    'Expected the query to target the descendant unavailable layout',
  );
  assert.match(
    responsiveStyles,
    /grid-template-columns:\s*1fr\s*;?/,
    'Expected the narrow layout to use one column',
  );
  assert.match(
    responsiveStyles,
    /grid-template-areas:\s*['"]icon['"]\s*['"]copy['"]\s*['"]actions['"]/,
    'Expected the narrow layout to stack icon, copy, and actions',
  );
  assert.match(
    styles,
    /overflow-wrap:\s*anywhere\s*;?/,
    'Expected long copy to wrap without overflow',
  );
  assert.match(
    responsiveStyles,
    /width:\s*100%\s*;?/,
    'Expected narrow action controls to use the available width',
  );
  assert.match(
    responsiveStyles,
    /flex:\s*1\s+1\s+100%\s*;?/,
    'Expected narrow action controls to stretch to full width',
  );
} finally {
  sheet.seal();
}
