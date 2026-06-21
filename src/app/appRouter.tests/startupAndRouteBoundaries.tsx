import {
  act,
  assert,
  createJsonResponse,
  renderApplicationErrorFixture,
  renderRouteLoadingFixture,
  renderApp,
  renderTick,
  textContent,
  restoreFetch,
  setFetch,
} from './support';

export const runStartupAndRouteBoundaryTests = async () => {
  await assert.doesNotReject(async () => import('../appRouter'));

  {
    const { container, root } = await renderRouteLoadingFixture('/dashboard');

    assert.ok(
      container.querySelector('[role="status"]'),
      'Expected route loading view to expose a status role',
    );
    assert.ok(
      textContent(container).includes('Loading route content'),
      'Expected the shared loading view to render',
    );

    await act(async () => {
      await new Promise(resolve => window.setTimeout(resolve, 60));
      await renderTick();
    });

    assert.ok(textContent(container).includes('Loaded page'));

    await act(async () => {
      root.unmount();
    });
  }

  {
    let reloadCount = 0;
    const { container, root } = await renderApplicationErrorFixture(
      '/broken',
      () => {
        reloadCount += 1;
      },
    );

    assert.ok(textContent(container).includes('Application error'));
    assert.ok(textContent(container).includes('Something went wrong'));
    assert.ok(textContent(container).includes('Reload application'));
    assert.ok(textContent(container).includes('Back to Dashboard'));
    assert.ok(!textContent(container).includes('Error:'));
    assert.ok(!textContent(container).includes('stack'));

    const reloadButton = container.querySelector(
      'button',
    ) as HTMLButtonElement | null;
    const dashboardLink = container.querySelector('a[href="/dashboard"]');

    assert.ok(reloadButton, 'Expected a reload recovery button');
    assert.ok(dashboardLink, 'Expected a dashboard recovery link');

    await act(async () => {
      reloadButton.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.equal(reloadCount, 1);

    await act(async () => {
      dashboardLink.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
      await renderTick();
    });

    assert.equal(window.location.pathname, '/dashboard');
    assert.ok(textContent(container).includes('Security Dashboard'));

    await act(async () => {
      root.unmount();
    });
  }

  {
    setFetch(async input => {
      const request = String(input);

      if (request === '/api/companies') {
        return createJsonResponse({ data: [] });
      }

      if (request === '/api/settings') {
        return createJsonResponse(
          {
            error: {
              code: 'SETTINGS_NOT_FOUND',
              message: 'Settings not found',
              details: [],
            },
          },
          { status: 404 },
        );
      }

      throw new Error(`Unexpected request: ${request}`);
    });

    try {
      const { container, root } = await renderApp('/settings');

      await act(async () => {
        await renderTick();
        await renderTick();
      });

      assert.ok(
        textContent(container).includes('Route error'),
        'Expected the settings API failure to stay on the route-level error state',
      );
      assert.ok(
        !textContent(container).includes('Application error'),
        'Expected the settings API failure not to trigger the application boundary',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
};
