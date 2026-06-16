import React from 'react';
import { useNavigate } from 'react-router-dom';

import AssessmentForm from '~/app/components/appsec/assessmentForm';
import AssessmentTable, {
  type AssessmentListRow,
} from '~/app/components/appsec/assessmentTable';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Drawer from '~/app/components/ui/drawer';
import EmptyState from '~/app/components/ui/emptyState';
import Pagination from '~/app/components/ui/pagination';
import SearchInput from '~/app/components/ui/searchInput';
import Select from '~/app/components/ui/select';
import {
  FilterToolbar,
  PageHeader,
  TableFooter,
} from '~/app/components/common';
import { routes } from '~/routes';

import StyledAssessments from './assessments.styled';
import type { AssessmentsProps } from './assessments.type';
import { useAssessmentsController } from './useAssessmentsController';
import {
  assessmentSortOptions,
  assessmentStatusOptions,
  assessmentTypeOptions,
} from './assessments.utils';

const Assessments = ({ companyId, companyName }: AssessmentsProps) => {
  const navigate = useNavigate();
  const controller = useAssessmentsController({ companyId, companyName });

  const {
    pagedAssessments,
    totalPages,
    safePage,
    isLoading,
    loadError,
    searchValue,
    statusFilter,
    typeFilter,
    sortBy,
    sortDirection,
    drawerMode,
    draftValue,
    fieldErrors,
    formErrorMessage,
    isSubmitting,
    showEmptyWorkspace,
    showNoResults,
    openCreateDrawer,
    openEditDrawer,
    requestCloseDrawer,
    handleSave,
    handleSearchChange,
    handleStatusFilterChange,
    handleTypeFilterChange,
    handleSortChange,
    handlePageChange,
    clearFilters,
    setDraftValue,
  } = controller;
  const openAssessmentWorkspace = (assessment: AssessmentListRow) => {
    navigate(routes.assessmentDetailsOverview(companyId, assessment.id));
  };

  const emptyState = showEmptyWorkspace ? (
    <EmptyState
      title="No assessments yet"
      description="Create the first assessment for this company."
      primaryAction={
        <Button title="New assessment" onClick={openCreateDrawer} />
      }
    />
  ) : showNoResults ? (
    <EmptyState
      title="No assessments match your current search and filters"
      description="Clear the search and filters to show all assessments again."
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
      <PageHeader
        eyebrow="Company workspace"
        title="Assessments"
        breadcrumbs={[
          {
            label: companyName ?? 'Company',
          },
          {
            label: 'Assessments',
          },
        ]}
        subtitle={
          companyName
            ? `Manage assessments for ${companyName}.`
            : 'Manage assessments for the active company.'
        }
        actions={<Button title="New assessment" onClick={openCreateDrawer} />}
      />

      <section className="assessments-card">
        <FilterToolbar
          search={
            <SearchInput
              value={searchValue}
              placeholder="Search assessments..."
              onChange={event => handleSearchChange(event.target.value)}
              onClear={() => handleSearchChange('')}
            />
          }
          filters={
            <>
              <Select
                label="Status"
                hideLabel
                value={statusFilter}
                options={[...assessmentStatusOptions]}
                onChange={event =>
                  handleStatusFilterChange(
                    event.target.value as typeof statusFilter,
                  )
                }
              />

              <Select
                label="Type"
                hideLabel
                value={typeFilter}
                options={[...assessmentTypeOptions]}
                onChange={event =>
                  handleTypeFilterChange(
                    event.target.value as typeof typeFilter,
                  )
                }
              />

              <Select
                label="Sort"
                hideLabel
                value={sortBy}
                options={assessmentSortOptions}
                onChange={event =>
                  handleSortChange(event.target.value as typeof sortBy)
                }
              />
            </>
          }
          summary={`${controller.filteredAssessments.length} assessments`}
        />

        {loadError ? (
          <div className="assessments-status">
            <Callout
              variant="error"
              title="Unable to load assessments"
              actions={
                <Button
                  title="Retry"
                  variant="secondary"
                  onClick={controller.reloadAssessments}
                />
              }
            >
              <p>{loadError}</p>
            </Callout>
          </div>
        ) : isLoading ? (
          <div className="assessments-status" role="status" aria-live="polite">
            Loading assessments...
          </div>
        ) : (
          <>
            <AssessmentTable
              assessments={pagedAssessments}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              onAssessmentClick={openAssessmentWorkspace}
              onEditAssessment={openEditDrawer}
              emptyState={emptyState}
            />

            {controller.filteredAssessments.length > 25 && (
              <TableFooter
                summary={
                  <span>
                    Showing {(safePage - 1) * 25 + 1}-
                    {Math.min(
                      safePage * 25,
                      controller.filteredAssessments.length,
                    )}{' '}
                    of {controller.filteredAssessments.length} assessments
                  </span>
                }
                pagination={
                  <Pagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    ariaLabel="Assessments pagination"
                  />
                }
              />
            )}
          </>
        )}
      </section>

      <Drawer
        isOpen={drawerMode !== null}
        title={drawerMode === 'edit' ? 'Edit assessment' : 'Create assessment'}
        description={
          drawerMode === 'edit'
            ? 'Update the assessment name, type, description, scope, and status.'
            : 'Create a new assessment for the active company.'
        }
        onClose={requestCloseDrawer}
        size="large"
      >
        <AssessmentForm
          mode={drawerMode === 'edit' ? 'edit' : 'create'}
          value={draftValue}
          errors={fieldErrors}
          errorMessage={formErrorMessage}
          isSubmitting={isSubmitting}
          submitLabel={
            drawerMode === 'edit' ? 'Save changes' : 'Create assessment'
          }
          onChange={setDraftValue}
          onSubmit={handleSave}
          onCancel={requestCloseDrawer}
        />
      </Drawer>
    </StyledAssessments>
  );
};

export default Assessments;
