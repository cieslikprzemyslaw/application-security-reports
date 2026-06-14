import React from 'react';

import AssessmentTable from '../../components/appsec/assessmentTable';
import Button from '~/app/components/ui/button';
import EmptyState from '~/app/components/ui/emptyState';
import SearchInput from '~/app/components/ui/searchInput';
import Select from '~/app/components/ui/select';

import StyledAssessments from './assessments.styled';

import type { AssessmentsProps } from './assessments.type';

const Assessments = ({
  assessments,
  searchValue,
  statusFilter,
  riskFilter,
  typeFilter,
  onSearchChange,
  onStatusFilterChange,
  onRiskFilterChange,
  onTypeFilterChange,
  onCreateAssessment,
  onAssessmentClick,
}: AssessmentsProps) => {
  const query = searchValue.toLowerCase();

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch =
      assessment.applicationName.toLowerCase().includes(query) ||
      assessment.companyName.toLowerCase().includes(query) ||
      assessment.code.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'all' || assessment.status === statusFilter;

    const matchesRisk =
      riskFilter === 'all' || assessment.overallRisk === riskFilter;

    const matchesType =
      typeFilter === 'all' || assessment.assessmentType === typeFilter;

    return matchesSearch && matchesStatus && matchesRisk && matchesType;
  });
  const hasSearch = searchValue.trim().length > 0;
  const hasFilters =
    hasSearch ||
    statusFilter !== 'all' ||
    riskFilter !== 'all' ||
    typeFilter !== 'all';
  const showEmptyWorkspace = assessments.length === 0;
  const showNoResults = !showEmptyWorkspace && filteredAssessments.length === 0;

  const clearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onRiskFilterChange('all');
    onTypeFilterChange('all');
  };

  const emptyState = showEmptyWorkspace ? (
    <EmptyState
      title="No assessments yet"
      description="Create the first assessment to track an application security review."
      primaryAction={
        onCreateAssessment ? (
          <Button title="New Assessment" onClick={onCreateAssessment} />
        ) : undefined
      }
    />
  ) : showNoResults ? (
    <EmptyState
      title={
        hasFilters
          ? 'No assessments match your current search and filters'
          : 'No assessments found'
      }
      description="Clear the filters to show all assessments again."
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
    <StyledAssessments>
      <header className="assessments-header">
        <div className="assessments-header-text">
          <h1 className="assessments-title">Assessments</h1>

          <p className="assessments-subtitle">
            All application security assessments across your workspace.
          </p>
        </div>

        <div className="assessments-header-actions">
          <div className="assessments-search-wrapper">
            <SearchInput
              value={searchValue}
              placeholder="Search assessments..."
              onChange={event => onSearchChange(event.target.value)}
              onClear={() => onSearchChange('')}
            />
          </div>

          {onCreateAssessment && (
            <Button title="New Assessment" onClick={onCreateAssessment} />
          )}
        </div>
      </header>

      <section className="assessments-card">
        <div className="assessments-toolbar">
          <div className="assessments-filters">
            <Select
              label="Status"
              hideLabel
              value={statusFilter}
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'Draft', value: 'draft' },
                { label: 'In Progress', value: 'in-progress' },
                { label: 'In Review', value: 'in-review' },
                { label: 'Completed', value: 'completed' },
                { label: 'Archived', value: 'archived' },
              ]}
              onChange={event => onStatusFilterChange(event.target.value)}
            />

            <Select
              label="Risk"
              hideLabel
              value={riskFilter}
              options={[
                { label: 'All Risk', value: 'all' },
                { label: 'Critical', value: 'critical' },
                { label: 'High', value: 'high' },
                { label: 'Medium', value: 'medium' },
                { label: 'Low', value: 'low' },
              ]}
              onChange={event => onRiskFilterChange(event.target.value)}
            />

            <Select
              label="Type"
              hideLabel
              value={typeFilter}
              options={[
                { label: 'All Types', value: 'all' },
                { label: 'Web App', value: 'Web App' },
                { label: 'API', value: 'API' },
                { label: 'Mobile', value: 'Mobile' },
              ]}
              onChange={event => onTypeFilterChange(event.target.value)}
            />
          </div>

          <span className="assessments-summary">
            {filteredAssessments.length} assessments
          </span>
        </div>

        <AssessmentTable
          assessments={filteredAssessments}
          onAssessmentClick={onAssessmentClick}
          emptyState={emptyState}
        />
      </section>
    </StyledAssessments>
  );
};

export default Assessments;
