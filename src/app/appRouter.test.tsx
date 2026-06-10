import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';

import { routes, routePatterns } from '~/routes';

const renderTick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

const setupDom = (pathname: string) => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: `http://localhost${pathname}` },
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

  return {
    container: window.document.getElementById('root'),
  };
};

const Shell = () => (
  <div>
    <nav aria-label="Primary navigation">
      <NavLink to={routes.dashboard}>Dashboard</NavLink>
      <NavLink to={routes.companies}>Companies</NavLink>
      <NavLink to={routes.assessments}>Assessments</NavLink>
      <NavLink to={routes.threats}>Threats</NavLink>
      <NavLink to={routes.reports}>Reports</NavLink>
      <NavLink to={routes.settings}>Settings</NavLink>
    </nav>

    <Outlet />
  </div>
);

const DashboardPage = () => <h1>Security Dashboard</h1>;
const CompaniesPage = () => (
  <section>
    <h1>Companies</h1>
    <p>Manage organisations and the assessments associated with them.</p>
  </section>
);
const AssessmentsPage = () => (
  <section>
    <h1>Assessments</h1>
    <p>All application security assessments across your workspace.</p>
  </section>
);
const ThreatsPage = () => (
  <section>
    <h1>Threats</h1>
    <p>Security findings across all active assessments.</p>
  </section>
);
const ReportsPage = () => <h1>Report Preview</h1>;
const SettingsPage = () => (
  <section>
    <h1>Settings</h1>
    <p>Manage your profile, workspace branding, and report defaults.</p>
  </section>
);

const AssessmentDetailsPage = () => {
  const { assessmentId } = useParams<{
    assessmentId?: string;
  }>();

  return <h1>Assessment ID: {assessmentId ?? 'missing'}</h1>;
};

const NotFoundPage = () => (
  <section>
    <h1>Requested page not found</h1>
    <Link to={routes.dashboard}>Back to Dashboard</Link>
  </section>
);

const TestRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route
        path={routePatterns.root}
        element={<Navigate replace to={routes.dashboard} />}
      />
      <Route element={<Shell />}>
        <Route path={routePatterns.dashboard} element={<DashboardPage />} />
        <Route path={routePatterns.companies} element={<CompaniesPage />} />
        <Route path={routePatterns.assessments} element={<AssessmentsPage />} />
        <Route
          path={routePatterns.assessmentDetails}
          element={<AssessmentDetailsPage />}
        />
        <Route path={routePatterns.threats} element={<ThreatsPage />} />
        <Route path={routePatterns.reports} element={<ReportsPage />} />
        <Route path={routePatterns.settings} element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

const renderApp = async (pathname: string) => {
  const { container } = setupDom(pathname);

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);

  await act(async () => {
    root.render(<TestRouter />);
    await renderTick();
  });

  return { container, root };
};

const textContent = (container: HTMLElement) => container.textContent ?? '';

const assertRouteRenders = async (pathname: string, expectedText: string) => {
  const { container, root } = await renderApp(pathname);

  assert.ok(
    textContent(container).includes(expectedText),
    `Expected route ${pathname} to contain "${expectedText}"`,
  );

  await act(async () => {
    root.unmount();
  });
};

await (async () => {
  {
    const { container, root } = await renderApp('/');

    assert.equal(window.location.pathname, '/dashboard');
    assert.ok(textContent(container).includes('Security Dashboard'));

    await act(async () => {
      root.unmount();
    });
  }

  await assertRouteRenders('/dashboard', 'Security Dashboard');
  await assertRouteRenders(
    '/companies',
    'Manage organisations and the assessments associated with them.',
  );
  await assertRouteRenders(
    '/assessments',
    'All application security assessments across your workspace.',
  );
  await assertRouteRenders(
    '/threats',
    'Security findings across all active assessments.',
  );
  await assertRouteRenders('/reports', 'Report Preview');
  await assertRouteRenders(
    '/settings',
    'Manage your profile, workspace branding, and report defaults.',
  );

  {
    const { container, root } = await renderApp('/assessments/asm_1');

    assert.ok(textContent(container).includes('Assessment ID: asm_1'));
    assert.equal(window.location.pathname, '/assessments/asm_1');

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp('/reports/rpt_1');

    assert.ok(textContent(container).includes('Requested page not found'));
    assert.equal(window.location.pathname, '/reports/rpt_1');

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp('/does-not-exist');

    assert.ok(textContent(container).includes('Requested page not found'));
    assert.ok(textContent(container).includes('Back to Dashboard'));

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root } = await renderApp('/dashboard');
    const companiesLink = container.querySelector('a[href="/companies"]');

    assert.ok(companiesLink, 'Expected companies link in the navigation');

    await act(async () => {
      companiesLink.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.equal(window.location.pathname, '/companies');
    assert.ok(textContent(container).includes('Companies'));

    await act(async () => {
      root.unmount();
    });
  }

  console.log('router checks passed');
})();
