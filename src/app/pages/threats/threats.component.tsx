import React from 'react';

import GlobalThreatTable from '../../components/appsec/globalThreatTable';
import ThreatDrawer from '../../components/appsec/threatDrawer';
import Button from '~/app/components/ui/button';
import EmptyState from '~/app/components/ui/emptyState';
import SearchInput from '~/app/components/ui/searchInput';
import Select from '~/app/components/ui/select';
import IconSVG from '~/app/components/ui/iconSVG';
import { PageHeader } from '~/app/components/common';

import StyledThreats from './threats.styled';

import type { ThreatsProps } from './threats.type';
import {
  getThreatApplications,
  threatSeverityOptions,
  threatStatusOptions,
} from './threats.utils';

const Threats = ({
  threats,
  searchValue,
  severityFilter,
  statusFilter,
  applicationFilter,
  selectedThreat,
  isDrawerOpen,
  onSearchChange,
  onSeverityFilterChange,
  onStatusFilterChange,
  onApplicationFilterChange,
  onClearControls,
  onThreatClick,
  onDrawerClose,
  onExport,
  onAddThreat,
}: ThreatsProps) => {
  const query = searchValue.toLowerCase();
  const applications = getThreatApplications(threats);

  const filteredThreats = threats.filter(threat => {
    const matchesSearch =
      threat.title.toLowerCase().includes(query) ||
      threat.applicationName.toLowerCase().includes(query);

    const matchesSeverity =
      severityFilter === 'all' || threat.severity === severityFilter;

    const matchesStatus =
      statusFilter === 'all' || threat.status === statusFilter;

    const matchesApplication =
      applicationFilter === 'all' ||
      threat.applicationName === applicationFilter;

    return (
      matchesSearch && matchesSeverity && matchesStatus && matchesApplication
    );
  });
  const hasSearch = searchValue.trim().length > 0;
  const hasFilters =
    hasSearch ||
    severityFilter !== 'all' ||
    statusFilter !== 'all' ||
    applicationFilter !== 'all';
  const showEmptyWorkspace = threats.length === 0;
  const showNoResults = !showEmptyWorkspace && filteredThreats.length === 0;

  const clearFilters = () => {
    if (onClearControls) {
      onClearControls();
      return;
    }

    onSearchChange('');
    onSeverityFilterChange('all');
    onStatusFilterChange('all');
    onApplicationFilterChange('all');
  };

  const emptyState = showEmptyWorkspace ? (
    <EmptyState
      variant="first-use"
      title="No threats yet"
      description="Add the first threat to start tracking security issues across assessments."
      primaryAction={
        onAddThreat ? (
          <Button title="Add threat" onClick={onAddThreat} />
        ) : undefined
      }
    />
  ) : showNoResults ? (
    <EmptyState
      variant="no-results"
      title={
        hasFilters
          ? 'No threats match your current search and filters'
          : 'No threats found'
      }
      description="Clear the search and filters to show all threats again."
      primaryAction={
        <Button
          title="Clear filters"
          variant="secondary"
          onClick={clearFilters}
        />
      }
    />
  ) : undefined;

  return (
    <StyledThreats>
      <PageHeader
        eyebrow="Workspace"
        title="Threats"
        context={[{ label: 'Threats' }]}
        documentTitle="Threats"
        subtitle="Security threats across all active assessments."
        primaryAction={
          onAddThreat
            ? {
                id: 'add-threat',
                label: 'Add threat',
                icon: <IconSVG name="add" />,
                onActivate: onAddThreat,
              }
            : undefined
        }
        secondaryActions={
          onExport
            ? [
                {
                  id: 'export-threats',
                  label: 'Export',
                  icon: <IconSVG name="download" />,
                  onActivate: onExport,
                },
              ]
            : undefined
        }
      />

      <section className="threats-card">
        <div className="threats-toolbar">
          <div className="threats-search-wrap">
            <SearchInput
              value={searchValue}
              placeholder="Search threats..."
              onChange={event => onSearchChange(event.target.value)}
              onClear={() => onSearchChange('')}
            />
          </div>

          <div className="threats-filters">
            <Select
              label="Severity"
              hideLabel
              value={severityFilter}
              options={[...threatSeverityOptions]}
              onChange={event =>
                onSeverityFilterChange(
                  event.target.value as typeof severityFilter,
                )
              }
            />

            <Select
              label="Status"
              hideLabel
              value={statusFilter}
              options={[...threatStatusOptions]}
              onChange={event =>
                onStatusFilterChange(event.target.value as typeof statusFilter)
              }
            />

            <Select
              label="Application"
              hideLabel
              value={applicationFilter}
              options={[
                { label: 'All applications', value: 'all' },
                ...applications.map(application => ({
                  label: application,
                  value: application,
                })),
              ]}
              onChange={event => onApplicationFilterChange(event.target.value)}
            />
          </div>

          <span className="threats-summary">
            {filteredThreats.length} threats
          </span>
        </div>

        <GlobalThreatTable
          threats={filteredThreats}
          onThreatClick={onThreatClick}
          emptyState={emptyState}
        />

        <div className="threats-footer">
          <span>Showing {filteredThreats.length} threats</span>
          <span>Page 1 of 1</span>
        </div>
      </section>

      <ThreatDrawer
        isOpen={isDrawerOpen}
        threat={selectedThreat}
        onClose={onDrawerClose}
      />
    </StyledThreats>
  );
};

export default Threats;
