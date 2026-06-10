import React from 'react';

import GlobalThreatTable from '../../components/appsec/globalThreatTable';
import ThreatDrawer from '../../components/appsec/threatDrawer';
import Button from '~/app/components/ui/button';
import SearchInput from '~/app/components/ui/searchInput';
import Select from '~/app/components/ui/select';

import StyledThreats, {
  Card,
  Filters,
  Footer,
  Header,
  HeaderActions,
  SearchWrap,
  Subtitle,
  Summary,
  Title,
  Toolbar,
} from './threats.styled';

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
      <Header>
        <div>
          <Title>Threats</Title>

          <Subtitle>Security findings across all active assessments.</Subtitle>
        </div>

        <HeaderActions>
          {onExport && (
            <Button title="Export" variant="secondary" onClick={onExport} />
          )}

          {onAddThreat && <Button title="Add Threat" onClick={onAddThreat} />}
        </HeaderActions>
      </Header>

      <Card>
        <Toolbar>
          <SearchWrap>
            <SearchInput
              value={searchValue}
              placeholder="Search threats..."
              onChange={event => onSearchChange(event.target.value)}
              onClear={() => onSearchChange('')}
            />
          </SearchWrap>

          <Filters>
            <Select
              label="Severity"
              hideLabel
              value={severityFilter}
              options={[
                {
                  label: 'All Severity',
                  value: 'all',
                },
                {
                  label: 'Critical',
                  value: 'Critical',
                },
                {
                  label: 'High',
                  value: 'High',
                },
                {
                  label: 'Medium',
                  value: 'Medium',
                },
                {
                  label: 'Low',
                  value: 'Low',
                },
              ]}
              onChange={event => onSeverityFilterChange(event.target.value)}
            />

            <Select
              label="Status"
              hideLabel
              value={statusFilter}
              options={[
                {
                  label: 'All Status',
                  value: 'all',
                },
                {
                  label: 'Open',
                  value: 'Open',
                },
                {
                  label: 'In Progress',
                  value: 'In Progress',
                },
                {
                  label: 'Resolved',
                  value: 'Resolved',
                },
                {
                  label: 'Retest Required',
                  value: 'Retest Required',
                },
                {
                  label: 'Accepted Risk',
                  value: 'Accepted Risk',
                },
              ]}
              onChange={event => onStatusFilterChange(event.target.value)}
            />

            <Select
              label="Application"
              hideLabel
              value={applicationFilter}
              options={[
                {
                  label: 'All Applications',
                  value: 'all',
                },
                ...applications.map(application => ({
                  label: application,
                  value: application,
                })),
              ]}
              onChange={event => onApplicationFilterChange(event.target.value)}
            />
          </Filters>

          <Summary>{filteredThreats.length} threats</Summary>
        </Toolbar>

        <GlobalThreatTable
          threats={filteredThreats}
          onThreatClick={onThreatClick}
        />

        <Footer>
          <span>Showing {filteredThreats.length} results</span>

          <span>Page 1 of 1</span>
        </Footer>
      </Card>

      <ThreatDrawer
        isOpen={isDrawerOpen}
        threat={selectedThreat}
        onClose={onDrawerClose}
      />
    </StyledThreats>
  );
};

export default Threats;
