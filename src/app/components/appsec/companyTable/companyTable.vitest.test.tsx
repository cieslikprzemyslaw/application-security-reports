import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen, within } from '~/test/render';

import CompanyTable from './companyTable.component';
import type { CompanyTableProps, CompanyTableRow } from './companyTable.type';

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

const companies = [sampleCompany, secondCompany];

const renderTable = (props: Partial<CompanyTableProps> = {}) =>
  renderWithProviders(<CompanyTable companies={companies} {...props} />);

const getCompanyRow = (companyName: string) => {
  const companyNameElement = screen.getByText(companyName);
  const row = companyNameElement.closest('tr');

  if (!row) {
    throw new Error(`Could not find the table row for ${companyName}.`);
  }

  return row;
};

describe('CompanyTable', () => {
  it('activates the selected company when its row is clicked', async () => {
    const onCompanyClick = vi.fn();
    const onEditCompany = vi.fn();

    const { user } = renderTable({
      onCompanyClick,
      onEditCompany,
    });

    await user.click(getCompanyRow(sampleCompany.name));

    expect(onCompanyClick).toHaveBeenCalledOnce();
    expect(onCompanyClick).toHaveBeenCalledWith(sampleCompany);

    expect(onEditCompany).not.toHaveBeenCalled();
  });

  it('does not render a trailing chevron in company rows', () => {
    const { container } = renderTable();

    const body = container.querySelector('tbody');

    expect(body).not.toBeNull();

    const bodyText = body?.textContent ?? '';

    expect(bodyText).not.toContain('›');
    expect(bodyText).not.toContain('>');
  });

  it('renders an accessible overflow menu button for every company', () => {
    renderTable({
      onEditCompany: vi.fn(),
    });

    const firstMenuButton = screen.getByRole('button', {
      name: `Actions for ${sampleCompany.name}`,
    });

    const secondMenuButton = screen.getByRole('button', {
      name: `Actions for ${secondCompany.name}`,
    });

    expect(firstMenuButton).toHaveAttribute('aria-haspopup', 'menu');

    expect(secondMenuButton).toHaveAttribute('aria-haspopup', 'menu');

    expect(firstMenuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the overflow menu without activating the company row', async () => {
    const onCompanyClick = vi.fn();

    const { user } = renderTable({
      onCompanyClick,
      onEditCompany: vi.fn(),
    });

    const menuButton = screen.getByRole('button', {
      name: `Actions for ${sampleCompany.name}`,
    });

    await user.click(menuButton);

    expect(screen.getByRole('menu')).toBeInTheDocument();

    expect(
      screen.getByRole('menuitem', {
        name: 'Edit',
      }),
    ).toBeInTheDocument();

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    expect(onCompanyClick).not.toHaveBeenCalled();
  });

  it('edits the correct company and closes the overflow menu', async () => {
    const onCompanyClick = vi.fn();
    const onEditCompany = vi.fn();

    const { user } = renderTable({
      onCompanyClick,
      onEditCompany,
    });

    await user.click(
      screen.getByRole('button', {
        name: `Actions for ${sampleCompany.name}`,
      }),
    );

    await user.click(
      screen.getByRole('menuitem', {
        name: 'Edit',
      }),
    );

    expect(onEditCompany).toHaveBeenCalledOnce();
    expect(onEditCompany).toHaveBeenCalledWith(sampleCompany);

    expect(onCompanyClick).not.toHaveBeenCalled();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('supports activating a company row with Enter', async () => {
    const onCompanyClick = vi.fn();

    const { user } = renderTable({
      onCompanyClick,
    });

    const row = getCompanyRow(sampleCompany.name);

    row.focus();

    expect(row).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(onCompanyClick).toHaveBeenCalledOnce();
    expect(onCompanyClick).toHaveBeenCalledWith(sampleCompany);
  });

  it('marks only the active company row', () => {
    renderTable({
      activeCompanyId: sampleCompany.id,
    });

    const activeRow = getCompanyRow(sampleCompany.name);
    const inactiveRow = getCompanyRow(secondCompany.name);

    expect(activeRow).toHaveClass('company-table__row--active');

    expect(activeRow).toHaveAttribute('aria-current', 'true');

    expect(inactiveRow).not.toHaveClass('company-table__row--active');

    expect(inactiveRow).not.toHaveAttribute('aria-current');

    expect(within(activeRow).getByText(sampleCompany.name)).toBeInTheDocument();
  });
});
