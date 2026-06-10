import React from 'react';

import GlobalThreatTable from '../../components/appsec/globalThreatTable';
import ThreatDrawer from '../../components/appsec/threatDrawer';
import Button from '~/app/components/ui/button';
import SearchInput from '~/app/components/ui/searchInput';
import Select from '~/app/components/ui/select';

import StyledThreats from './threats.styled';

import type { ThreatsProps } from './threats.type';

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
  onThreatClick,
  onDrawerClose,
  onExport,
  onAddThreat,
}: ThreatsProps) => {
  const query = searchValue.toLowerCase();

  const applications = Array.from(
    new Set(threats.map(threat => threat.applicationName)),
  );

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

  return (
    <StyledThreats>
      <header className="threats-header">
        <div>
          <h1 className="threats-title">Threats</h1>

          <p className="threats-subtitle">
            Security findings across all active assessments.
          </p>
        </div>

        <div className="threats-header-actions">
          {onExport && (
            <Button title="Export" variant="secondary" onClick={onExport} />
          )}

          {onAddThreat && <Button title="Add Threat" onClick={onAddThreat} />}
        </div>
      </header>

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
              options={[
                { label: 'All Severity', value: 'all' },
                { label: 'Critical', value: 'Critical' },
                { label: 'High', value: 'High' },
                { label: 'Medium', value: 'Medium' },
                { label: 'Low', value: 'Low' },
              ]}
              onChange={event => onSeverityFilterChange(event.target.value)}
            />

            <Select
              label="Status"
              hideLabel
              value={statusFilter}
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'Open', value: 'Open' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Resolved', value: 'Resolved' },
                { label: 'Retest Required', value: 'Retest Required' },
                { label: 'Accepted Risk', value: 'Accepted Risk' },
              ]}
              onChange={event => onStatusFilterChange(event.target.value)}
            />

            <Select
              label="Application"
              hideLabel
              value={applicationFilter}
              options={[
                { label: 'All Applications', value: 'all' },
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
        />

        <div className="threats-footer">
          <span>Showing {filteredThreats.length} results</span>
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
