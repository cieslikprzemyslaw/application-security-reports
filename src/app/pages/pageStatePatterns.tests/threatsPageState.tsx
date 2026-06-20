import {
  act,
  assert,
  renderComponent,
  renderTick,
  sampleThreat,
  textContent,
  Threats,
} from './support';

export const runThreatsPageStateTests = async () => {
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

    assert.ok(textContent(container).includes('No threats yet'));

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
        'No threats match your current search and filters',
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
};
