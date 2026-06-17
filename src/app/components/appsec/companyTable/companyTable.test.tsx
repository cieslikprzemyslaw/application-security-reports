import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import { defaultTheme } from '~/theme';

import CompanyTable from './companyTable.component';
import type { CompanyTableRow } from './companyTable.type';

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
    { url: 'http://localhost/' },
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
    container: window.document.getElementById('root') as HTMLElement,
    window,
  };
};

const sampleCompany: CompanyTableRow = {
  id: 'cmp_00000000-0000-0000-0000-000000000001',
  name: 'Northstar Digital',
  initials: 'ND',
  logoTone: 'blue',
  applicationCount: 4,
  website: 'https://northstar.example',
  primaryContact: 'security@northstar.example',
  assessmentCount: 6,
  openThreats: 2,
  riskPosture: 'high',
};

const secondCompany: CompanyTableRow = {
  id: 'cmp_00000000-0000-0000-0000-000000000002',
  name: 'Westgate Corp',
  initials: 'WC',
  logoTone: 'cyan',
  applicationCount: 2,
  website: 'https://westgate.example',
  primaryContact: 'admin@westgate.example',
  assessmentCount: 3,
  openThreats: 0,
  riskPosture: 'low',
};

const renderTable = async (
  props: Partial<{
    activeCompanyId: string;
    onCompanyClick: (company: CompanyTableRow) => void;
    onEditCompany: (company: CompanyTableRow) => void;
  }> = {},
) => {
  const { container, window } = setupDom();

  const root = createRoot(container);

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <CompanyTable companies={[sampleCompany, secondCompany]} {...props} />
      </ThemeProvider>,
    );
    await renderTick();
  });

  return { container, root, window };
};

await (async () => {
  {
    // row click calls onCompanyClick with the clicked company, not onEditCompany
    const clickedIds: string[] = [];
    const editedIds: string[] = [];

    const { container, root, window } = await renderTable({
      onCompanyClick: c => clickedIds.push(c.id),
      onEditCompany: c => editedIds.push(c.id),
    });

    const rows = container.querySelectorAll('.company-table__row');
    assert.equal(rows.length, 2, 'Expected two rows');

    await act(async () => {
      rows[0]!.dispatchEvent(
        new window.MouseEvent('click', { bubbles: true, cancelable: true }),
      );
      await renderTick();
    });

    assert.deepEqual(
      clickedIds,
      [sampleCompany.id],
      'Expected onCompanyClick called with the first company',
    );
    assert.deepEqual(
      editedIds,
      [],
      'Expected onEditCompany NOT called on row click',
    );

    await act(async () => root.unmount());
  }

  {
    // no trailing chevron text character in any row
    const { container, root } = await renderTable();

    const bodyText = container.querySelector('tbody')?.textContent ?? '';
    assert.ok(
      !bodyText.includes('›'),
      'Expected no chevron › character in rows',
    );
    assert.ok(
      !bodyText.includes('>'),
      'Expected no > character as chevron in rows',
    );

    await act(async () => root.unmount());
  }

  {
    // overflow menu button is present with aria-haspopup
    const { container, root } = await renderTable({
      onEditCompany: () => undefined,
    });

    const menuButtons = container.querySelectorAll(
      '.company-table__menu-button',
    );
    assert.equal(menuButtons.length, 2, 'Expected a menu button for each row');

    for (const btn of menuButtons) {
      assert.equal(
        btn.getAttribute('aria-haspopup'),
        'menu',
        'Expected aria-haspopup="menu" on each menu button',
      );
    }

    await act(async () => root.unmount());
  }

  {
    // clicking the menu button opens the menu without triggering row activation
    const clickedIds: string[] = [];

    const { container, root, window } = await renderTable({
      onCompanyClick: c => clickedIds.push(c.id),
      onEditCompany: () => undefined,
    });

    const menuButton = container.querySelector(
      '.company-table__menu-button',
    ) as HTMLButtonElement | null;
    assert.ok(menuButton, 'Expected menu button to exist');

    await act(async () => {
      menuButton!.dispatchEvent(
        new window.MouseEvent('click', { bubbles: true, cancelable: true }),
      );
      await renderTick();
    });

    const menu = container.querySelector('.company-table__menu');
    assert.ok(menu, 'Expected overflow menu to open after button click');
    assert.equal(
      menu?.getAttribute('role'),
      'menu',
      'Expected role="menu" on the dropdown',
    );
    assert.deepEqual(
      clickedIds,
      [],
      'Expected row activation NOT triggered by menu button click',
    );

    await act(async () => root.unmount());
  }

  {
    // clicking Edit in the menu calls onEditCompany and closes the menu without triggering row activation
    const clickedIds: string[] = [];
    const editedIds: string[] = [];

    const { container, root, window } = await renderTable({
      onCompanyClick: c => clickedIds.push(c.id),
      onEditCompany: c => editedIds.push(c.id),
    });

    const menuButton = container.querySelector(
      '.company-table__menu-button',
    ) as HTMLButtonElement | null;
    assert.ok(menuButton, 'Expected menu button');

    await act(async () => {
      menuButton!.dispatchEvent(
        new window.MouseEvent('click', { bubbles: true, cancelable: true }),
      );
      await renderTick();
    });

    const editItem = container.querySelector(
      '.company-table__menu-item',
    ) as HTMLButtonElement | null;
    assert.ok(editItem, 'Expected Edit menu item');

    await act(async () => {
      editItem!.dispatchEvent(
        new window.MouseEvent('click', { bubbles: true, cancelable: true }),
      );
      await renderTick();
    });

    assert.deepEqual(
      editedIds,
      [sampleCompany.id],
      'Expected onEditCompany called with the correct company',
    );
    assert.deepEqual(
      clickedIds,
      [],
      'Expected row activation NOT triggered by menu item click',
    );

    const menuAfter = container.querySelector('.company-table__menu');
    assert.equal(menuAfter, null, 'Expected menu to close after Edit click');

    await act(async () => root.unmount());
  }

  {
    // keyboard row activation: Enter on the row calls onCompanyClick
    const clickedIds: string[] = [];

    const { container, root, window } = await renderTable({
      onCompanyClick: c => clickedIds.push(c.id),
    });

    const row = container.querySelector(
      '.company-table__row',
    ) as HTMLElement | null;
    assert.ok(row, 'Expected row to exist');

    await act(async () => {
      row!.dispatchEvent(
        new window.KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Enter',
        }),
      );
      await renderTick();
    });

    assert.deepEqual(
      clickedIds,
      [sampleCompany.id],
      'Expected onCompanyClick called via Enter key on row',
    );

    await act(async () => root.unmount());
  }

  {
    // active row has aria-current and the active modifier class
    const { container, root } = await renderTable({
      activeCompanyId: sampleCompany.id,
    });

    const activeRow = container.querySelector('.company-table__row--active');
    assert.ok(activeRow, 'Expected active modifier class on the active row');
    assert.equal(
      activeRow?.getAttribute('aria-current'),
      'true',
      'Expected aria-current="true" on the active row',
    );

    const inactiveRows = container.querySelectorAll(
      '.company-table__row:not(.company-table__row--active)',
    );
    for (const row of inactiveRows) {
      assert.equal(
        row.getAttribute('aria-current'),
        null,
        'Expected no aria-current on inactive rows',
      );
    }

    await act(async () => root.unmount());
  }
})();

console.log('CompanyTable behaviour checks passed');
