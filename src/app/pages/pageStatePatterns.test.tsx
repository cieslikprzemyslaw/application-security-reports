import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import type { CompanyTableRow } from '~/app/components/appsec/companyTable';
import type { AssessmentTableRow } from '~/app/components/appsec/assessmentTable';
import type { GlobalThreatRow } from '~/app/components/appsec/globalThreatTable';
import Dashboard from '~/app/pages/dashboard';
import Companies from '~/app/pages/companies';
import Assessments from '~/app/pages/assessments';
import Threats from '~/app/pages/threats';
import { defaultTheme } from '~/theme';

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

  const container = window.document.getElementById('root');

  assert.ok(container, 'Expected root container to exist');

  return { container };
};

const renderComponent = async (element: React.ReactNode) => {
  const { container } = setupDom();
  const root = createRoot(container);

  await act(async () => {
    root.render(<ThemeProvider theme={defaultTheme}>{element}</ThemeProvider>);
    await renderTick();
    await renderTick();
  });

  return { container, root };
};

const textContent = (container: HTMLElement) => container.textContent ?? '';

const sampleCompany: CompanyTableRow = {
  id: 'cmp_1',
  name: 'Northwind Labs',
  initials: 'NL',
  logoTone: 'blue',
  applicationCount: 2,
  website: 'northwind.example',
  primaryContact: 'security@northwind.example',
  assessmentCount: 4,
  openThreats: 3,
  riskPosture: 'medium',
};

const sampleAssessment: AssessmentTableRow = {
  id: 'asm_1',
  code: 'NWL-2026-001',
  initials: 'NL',
  logoTone: 'indigo',
  applicationName: 'Northwind Portal',
  companyName: 'Northwind Labs',
  assessmentType: 'Web App',
  environment: 'Production',
  overallRisk: 'high',
  findingsCount: 7,
  testerName: 'J. Example',
  status: 'draft',
};

const sampleThreat: GlobalThreatRow = {
  id: 'thr_1',
  title: 'Stored XSS in comment body',
  applicationName: 'Northwind Portal',
  companyName: 'Northwind Labs',
  strideCategory: 'tampering',
  severity: 'high',
  status: 'open',
  updatedAt: '2026-06-14',
};

const baseDashboardProps = {
  stats: {
    totalAssessments: 0,
    totalAssessmentsChange: 0,
    openThreats: 0,
    openThreatsChange: 0,
    criticalHighFindings: 0,
    criticalHighChange: 0,
    retestRequired: 0,
    retestRequiredChange: 0,
  },
  severityDistribution: [],
  assessmentStatuses: [],
  recentAssessments: [],
  recentActivity: [],
  selectedPeriod: '90' as const,
  onPeriodChange: () => undefined,
};

await (async () => {
  {
    const { container, root } = await renderComponent(
      <Companies
        companies={[]}
        searchValue=""
        onSearchChange={() => undefined}
        onCreateCompany={() => undefined}
      />,
    );

    assert.ok(textContent(container).includes('No companies yet'));
    assert.ok(textContent(container).includes('New company'));
    assert.ok(
      container.querySelector('[role="status"]'),
      'Expected the empty state to announce itself politely',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    let clearedSearch = 'not called';

    const { container, root } = await renderComponent(
      <Companies
        companies={[sampleCompany]}
        searchValue="zebra"
        onSearchChange={value => {
          clearedSearch = value;
        }}
      />,
    );

    assert.ok(textContent(container).includes('No companies match "zebra"'));
    assert.ok(textContent(container).includes('Clear search'));

    const clearButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.includes('Clear search'),
    );

    assert.ok(clearButton, 'Expected a clear search action');

    await act(async () => {
      clearButton.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.equal(clearedSearch, '');

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderComponent(
      <Assessments
        assessments={[]}
        searchValue=""
        statusFilter="all"
        riskFilter="all"
        typeFilter="all"
        onSearchChange={() => undefined}
        onStatusFilterChange={() => undefined}
        onRiskFilterChange={() => undefined}
        onTypeFilterChange={() => undefined}
        onCreateAssessment={() => undefined}
      />,
    );

    assert.ok(textContent(container).includes('No assessments yet'));
    assert.ok(textContent(container).includes('New Assessment'));

    await act(async () => {
      root.unmount();
    });
  }

  {
    const updates: string[] = [];

    const { container, root } = await renderComponent(
      <Assessments
        assessments={[sampleAssessment]}
        searchValue="missing"
        statusFilter="draft"
        riskFilter="all"
        typeFilter="all"
        onSearchChange={value => updates.push(`search:${value}`)}
        onStatusFilterChange={value => updates.push(`status:${value}`)}
        onRiskFilterChange={value => updates.push(`risk:${value}`)}
        onTypeFilterChange={value => updates.push(`type:${value}`)}
      />,
    );

    assert.ok(
      textContent(container).includes(
        'No assessments match your current search and filters',
      ),
    );
    assert.ok(textContent(container).includes('Clear filters'));

    const clearButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.includes('Clear filters'),
    );

    assert.ok(clearButton, 'Expected a clear filters action');

    await act(async () => {
      clearButton.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.deepEqual(updates, [
      'search:',
      'status:all',
      'risk:all',
      'type:all',
    ]);

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderComponent(
      <Threats
        threats={[]}
        searchValue=""
        severityFilter="all"
        statusFilter="all"
        applicationFilter="all"
        selectedThreat={undefined}
        isDrawerOpen={false}
        onSearchChange={() => undefined}
        onSeverityFilterChange={() => undefined}
        onStatusFilterChange={() => undefined}
        onApplicationFilterChange={() => undefined}
        onThreatClick={() => undefined}
        onDrawerClose={() => undefined}
      />,
    );

    assert.ok(textContent(container).includes('No findings yet'));

    await act(async () => {
      root.unmount();
    });
  }

  {
    const updates: string[] = [];

    const { container, root } = await renderComponent(
      <Threats
        threats={[sampleThreat]}
        searchValue="missing"
        severityFilter="high"
        statusFilter="all"
        applicationFilter="all"
        selectedThreat={undefined}
        isDrawerOpen={false}
        onSearchChange={value => updates.push(`search:${value}`)}
        onSeverityFilterChange={value => updates.push(`severity:${value}`)}
        onStatusFilterChange={value => updates.push(`status:${value}`)}
        onApplicationFilterChange={value =>
          updates.push(`application:${value}`)
        }
        onThreatClick={() => undefined}
        onDrawerClose={() => undefined}
      />,
    );

    assert.ok(
      textContent(container).includes(
        'No findings match your current search and filters',
      ),
    );
    assert.ok(textContent(container).includes('Clear filters'));

    const clearButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.includes('Clear filters'),
    );

    assert.ok(clearButton, 'Expected a clear filters action');

    await act(async () => {
      clearButton.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.deepEqual(updates, [
      'search:',
      'severity:all',
      'status:all',
      'application:all',
    ]);

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderComponent(
      <Dashboard
        {...baseDashboardProps}
        onCreateAssessment={() => undefined}
      />,
    );

    assert.ok(textContent(container).includes('No assessments yet'));
    assert.ok(textContent(container).includes('New Assessment'));

    await act(async () => {
      root.unmount();
    });
  }

  console.log('page state checks passed');
})();
