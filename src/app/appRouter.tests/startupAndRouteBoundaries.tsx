import {
  act,
  assert,
  renderRouteErrorFixture,
  renderRouteLoadingFixture,
  renderTick,
  textContent,
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
    const { container, root } = await renderRouteErrorFixture('/broken');
    assert.ok(textContent(container).includes('Something went wrong'));
    assert.ok(textContent(container).includes('Back to Dashboard'));
    assert.ok(!textContent(container).includes('Error:'));
    assert.ok(!textContent(container).includes('stack'));

    const dashboardLink = container.querySelector('a[href="/dashboard"]');

    assert.ok(dashboardLink, 'Expected a dashboard recovery link');

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
    assert.ok(textContent(container).includes('Recent companies'));

    await act(async () => {
      root.unmount();
    });
  }
};
