import assert from 'node:assert/strict';

import { describe, it, vi } from 'vitest';

import {
  createReportPdfDocumentTitle,
  openReportPdfPrintFlow,
} from './reportPdf';

describe('report PDF browser print flow', () => {
  it('creates a safe document title from saved report metadata', () => {
    const title = createReportPdfDocumentTitle({
      companyName: 'Northstar / Digital\\Security',
      reportTitle: 'Application: Security Report?*',
      versionLabel: 'v1.1',
    });

    assert.equal(
      title,
      'Northstar - Digital - Security - Application Security Report - v1.1',
    );
    assert.equal(/[\\/]/.test(title), false);
  });

  it('uses the safe title while opening print and restores the page title', () => {
    const browserDocument = { title: 'AppSec Report Builder' };
    const print = vi.fn(() => {
      assert.equal(
        browserDocument.title,
        'Northstar Digital - Application Security Report - v1.1',
      );
    });

    openReportPdfPrintFlow(
      'Northstar Digital - Application Security Report - v1.1',
      { print },
      browserDocument,
    );

    assert.equal(print.mock.calls.length, 1);
    assert.equal(browserDocument.title, 'AppSec Report Builder');
  });

  it('restores the page title when the browser print call fails', () => {
    const browserDocument = { title: 'AppSec Report Builder' };

    assert.throws(() =>
      openReportPdfPrintFlow(
        'Northstar Digital - Application Security Report - v1.1',
        {
          print: () => {
            throw new Error('Print failed');
          },
        },
        browserDocument,
      ),
    );

    assert.equal(browserDocument.title, 'AppSec Report Builder');
  });
});
