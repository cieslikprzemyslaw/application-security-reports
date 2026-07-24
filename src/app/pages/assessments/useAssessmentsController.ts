import { useEffect, useMemo, useRef, useState } from 'react';

import type { AssessmentListItem } from '~/services';
import { assessmentService } from '~/services';
import { useListQueryState } from '~/app/hooks/useListQueryState';

import type { AssessmentsProps } from './assessments.type';
import {
  PAGE_SIZE,
  assessmentsQueryFields,
  filterAndSortAssessments,
  nextSortDirection,
  type AssessmentSortDirection,
  type AssessmentStatusFilter,
  type AssessmentTypeFilter,
} from './assessments.utils';
import type { AssessmentListSortKey } from '~/app/components/appsec/assessmentTable';
import {
  useAssessmentDrawerController,
  type AssessmentDrawerController,
} from './useAssessmentDrawerController';

export interface AssessmentsController extends AssessmentDrawerController {
  assessments: AssessmentListItem[];
  filteredAssessments: AssessmentListItem[];
  pagedAssessments: AssessmentListItem[];
  totalPages: number;
  safePage: number;
  isLoading: boolean;
  isRefreshing: boolean;
  hasLoadedAssessments: boolean;
  loadError?: string;
  searchValue: string;
  statusFilter: AssessmentStatusFilter;
  typeFilter: AssessmentTypeFilter;
  sortBy: AssessmentListSortKey;
  sortDirection: AssessmentSortDirection;
  currentPage: number;
  showEmptyWorkspace: boolean;
  showNoResults: boolean;
  handleSearchChange: (value: string) => void;
  handleStatusFilterChange: (value: AssessmentStatusFilter) => void;
  handleTypeFilterChange: (value: AssessmentTypeFilter) => void;
  handleSortChange: (sortBy: AssessmentListSortKey) => void;
  handlePageChange: (page: number) => void;
  clearFilters: () => void;
  reloadAssessments: () => void;
}

export const useAssessmentsController = ({
  companyId,
}: AssessmentsProps): AssessmentsController => {
  const query = useListQueryState({
    fields: assessmentsQueryFields,
    pageKey: 'page',
    searchKey: 'search',
  });
  const {
    search,
    status: statusFilter,
    type: typeFilter,
    sortBy,
    sortDirection,
    page: currentPage,
  } = query.state;
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedAssessments, setHasLoadedAssessments] = useState(false);
  const hasLoadedAssessmentsRef = useRef(false);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadAssessments = async () => {
      setIsLoading(true);
      setLoadError(undefined);

      try {
        const nextAssessments = await assessmentService.list(
          {
            companyId,
          },
          controller.signal,
        );

        if (isActive) {
          setAssessments(nextAssessments);
          hasLoadedAssessmentsRef.current = true;
          setHasLoadedAssessments(true);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        if (!hasLoadedAssessmentsRef.current) {
          setAssessments([]);
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load assessments.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadAssessments();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [companyId, reloadKey]);

  const filteredAssessments = useMemo(
    () =>
      filterAndSortAssessments(assessments, {
        search,
        status: statusFilter,
        type: typeFilter,
        sortBy,
        sortDirection,
        page: currentPage,
      }),
    [
      assessments,
      currentPage,
      search,
      sortBy,
      sortDirection,
      statusFilter,
      typeFilter,
    ],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssessments.length / PAGE_SIZE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pagedAssessments = filteredAssessments.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const isRefreshing = isLoading && hasLoadedAssessments;
  const showEmptyWorkspace = hasLoadedAssessments && assessments.length === 0;
  const showNoResults =
    hasLoadedAssessments &&
    !showEmptyWorkspace &&
    filteredAssessments.length === 0;

  const drawerController = useAssessmentDrawerController({
    companyId,
    reloadAssessments: () => setReloadKey(key => key + 1),
  });

  const clearFilters = () => {
    query.clearControls();
  };

  const handleSearchChange = (value: string) => {
    query.setSearchValue(value);
  };

  const handleStatusFilterChange = (value: AssessmentStatusFilter) => {
    query.setControl({ status: value });
  };

  const handleTypeFilterChange = (value: AssessmentTypeFilter) => {
    query.setControl({ type: value });
  };

  const handleSortChange = (nextSortBy: AssessmentListSortKey) => {
    query.setControl({
      sortBy: nextSortBy,
      sortDirection: nextSortDirection(sortBy, nextSortBy, sortDirection),
    });
  };

  const handlePageChange = (page: number) => {
    query.setControl({ page }, { resetPage: false });
  };

  return {
    assessments,
    filteredAssessments,
    pagedAssessments,
    totalPages,
    safePage,
    isLoading,
    isRefreshing,
    hasLoadedAssessments,
    loadError,
    searchValue: query.searchValue,
    statusFilter,
    typeFilter,
    sortBy,
    sortDirection,
    currentPage,
    showEmptyWorkspace,
    showNoResults,
    handleSearchChange,
    handleStatusFilterChange,
    handleTypeFilterChange,
    handleSortChange,
    handlePageChange,
    clearFilters,
    reloadAssessments: () => setReloadKey(key => key + 1),
    ...drawerController,
  };
};
