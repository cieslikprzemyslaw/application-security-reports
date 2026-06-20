import {
  act,
  assert,
  Assessments,
  Companies,
  Dashboard,
  renderComponent,
  renderTick,
  textContent,
} from './support';

export const runDashboardRecentCompaniesStateTests = async () => {
  {
    const openedCompanyIds: string[] = [];

    const { container, root } = await renderComponent(
      <Dashboard
        companies={[
          {
            id: 'cmp_1',
            name: 'Northstar Digital',
            assessmentCount: 6,
            latestAssessment: {
              id: 'asm_1',
              name: 'Customer Services Portal',
              status: 'in-progress',
            },
          },
          {
            id: 'cmp_2',
            name: 'Meridian Finance',
            assessmentCount: 4,
            latestAssessment: {
              id: 'asm_2',
              name: 'Online Banking Portal',
              status: 'completed',
            },
          },
          {
            id: 'cmp_3',
            name: 'Summit Health',
            assessmentCount: 2,
          },
        ]}
        onOpenCompany={company => openedCompanyIds.push(company.id)}
      />,
      {
        'appsec-company-switcher-recents': JSON.stringify(['cmp_2', 'cmp_1']),
        'appsec-company-switcher-recent-open-times': JSON.stringify({
          cmp_2: '2026-06-14T16:45:00.000Z',
          cmp_1: '2026-06-15T08:15:00.000Z',
        }),
      },
    );

    const companyNames = Array.from(
      container.querySelectorAll('.dashboard-company-name'),
    ).map(node => node.textContent);

    assert.deepEqual(companyNames, [
      'Meridian Finance',
      'Northstar Digital',
      'Summit Health',
    ]);
    assert.ok(textContent(container).includes('Last opened'));
    assert.ok(textContent(container).includes('Active assessments'));
    assert.ok(textContent(container).includes('Latest assessment'));

    const companyRows = Array.from(
      container.querySelectorAll('.dashboard-recent-company-row'),
    ) as HTMLButtonElement[];

    assert.equal(companyRows.length, 3, 'Expected three recent company rows');
    assert.equal(
      companyRows[0]?.tagName,
      'BUTTON',
      'Expected the recent company item to be a button',
    );
    assert.equal(
      companyRows[0]?.getAttribute('type'),
      'button',
      'Expected the row button to use type="button"',
    );

    companyRows[0]?.focus();
    assert.equal(
      window.document.activeElement,
      companyRows[0],
      'Expected the row button to receive focus for keyboard interaction',
    );

    await act(async () => {
      companyRows[0]?.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.deepEqual(openedCompanyIds, ['cmp_2']);

    await act(async () => {
      root.unmount();
    });
  }

  {
    const originalInnerWidth = window.innerWidth;
    try {
      Object.defineProperty(window, 'innerWidth', {
        value: 320,
        configurable: true,
      });

      const { container, root } = await renderComponent(
        <Dashboard
          companies={[
            {
              id: 'cmp_1',
              name: 'Northstar Digital',
              assessmentCount: 6,
              latestAssessment: {
                id: 'asm_1',
                name: 'Customer Services Portal',
                status: 'in-progress',
              },
            },
          ]}
          onOpenCompany={() => undefined}
        />,
      );

      assert.equal(
        container.querySelectorAll('.dashboard-recent-company-row').length,
        1,
        'Expected a single recent company row',
      );
      assert.ok(
        container.querySelector('.dashboard-company-details'),
        'Expected the metadata block to stay present at narrow widths',
      );
      assert.ok(
        textContent(container).includes('Customer Services Portal'),
        'Expected the latest assessment name to remain readable',
      );
      assert.ok(
        textContent(container).includes('Last opened —'),
        'Expected the missing last-opened metadata to remain readable',
      );
      assert.ok(
        textContent(container).includes('Active assessments'),
        'Expected the assessment count label to remain readable',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        configurable: true,
      });
    }
  }

  {
    const { container, root } = await renderComponent(
      <Dashboard companies={[]} onCreateCompany={() => undefined} />,
    );

    assert.ok(textContent(container).includes('Recent companies'));
    assert.ok(textContent(container).includes('No companies yet'));
    assert.ok(textContent(container).includes('Create company'));
    assert.ok(
      !textContent(container).includes('Active assessments'),
      'Expected the empty state to replace the recent company rows',
    );

    await act(async () => {
      root.unmount();
    });
  }
};
