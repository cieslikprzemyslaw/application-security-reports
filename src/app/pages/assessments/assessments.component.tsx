import React from 'react';

import AssessmentTable from '../../components/appsec/assessmentTable';
import Button from '~/app/components/ui/button';
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

        {filteredAssessments.length > 0 ? (
          <AssessmentTable
            assessments={filteredAssessments}
            onAssessmentClick={onAssessmentClick}
          />
        ) : (
          <div className="assessments-empty">No assessments found.</div>
        )}
      </section>
    </StyledAssessments>
  );
};

export default Assessments;
