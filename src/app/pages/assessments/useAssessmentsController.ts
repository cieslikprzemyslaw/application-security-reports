import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { AssessmentListItem } from '~/services';
import { assessmentService } from '~/services';

import type { AssessmentsProps } from './assessments.type';
import {
  defaultQueryState,
  filterAndSortAssessments,
  readQueryState,
  searchDebounceMs,
  type AssessmentListSortKey,
  type AssessmentSortDirection,
  type AssessmentStatusFilter,
  type AssessmentTypeFilter,
  type AssessmentsQueryState,
} from './assessments.utils';
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

const PAGE_SIZE = 25;

const buildQueryState = (
  current: AssessmentsQueryState,
  next: Partial<AssessmentsQueryState>,
) => ({
  ...current,
  ...next,
});

export const useAssessmentsController = ({
  companyId,
}: AssessmentsProps): AssessmentsController => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQueryState = readQueryState(searchParams);
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [searchValue, setSearchValue] = useState(initialQueryState.search);
  const [statusFilter, setStatusFilter] = useState(initialQueryState.status);
  const [typeFilter, setTypeFilter] = useState(initialQueryState.type);
  const [sortBy, setSortBy] = useState(initialQueryState.sortBy);
  const [sortDirection, setSortDirection] = useState(
    initialQueryState.sortDirection,
  );
  const [currentPage, setCurrentPage] = useState(initialQueryState.page);

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
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setAssessments([]);
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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);

      if (searchValue.trim().length > 0) {
        nextParams.set('search', searchValue);
      } else {
        nextParams.delete('search');
      }

      nextParams.delete('page');

      setSearchParams(nextParams, { replace: true });
    }, searchDebounceMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchParams, searchValue, setSearchParams]);

  const writeQueryState = (next: Partial<AssessmentsQueryState>) => {
    const mergedState = buildQueryState(
      {
        search: searchValue,
        status: statusFilter,
        type: typeFilter,
        sortBy,
        sortDirection,
        page: currentPage,
      },
      next,
    );

    const nextParams = new URLSearchParams(searchParams);

    if (mergedState.search.trim().length > 0) {
      nextParams.set('search', mergedState.search);
    } else {
      nextParams.delete('search');
    }

    if (mergedState.status !== 'all') {
      nextParams.set('status', mergedState.status);
    } else {
      nextParams.delete('status');
    }

    if (mergedState.type !== 'all') {
      nextParams.set('type', mergedState.type);
    } else {
      nextParams.delete('type');
    }

    if (mergedState.sortBy !== defaultQueryState.sortBy) {
      nextParams.set('sort', mergedState.sortBy);
    } else {
      nextParams.delete('sort');
    }

    if (mergedState.sortDirection !== defaultQueryState.sortDirection) {
      nextParams.set('direction', mergedState.sortDirection);
    } else {
      nextParams.delete('direction');
    }

    if (mergedState.page > 1) {
      nextParams.set('page', String(mergedState.page));
    } else {
      nextParams.delete('page');
    }

    setSearchParams(nextParams, { replace: true });
  };

  const filteredAssessments = useMemo(
    () =>
      filterAndSortAssessments(assessments, {
        search: searchValue,
        status: statusFilter,
        type: typeFilter,
        sortBy,
        sortDirection,
        page: currentPage,
      }),
    [
      assessments,
      currentPage,
      searchValue,
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

  const showEmptyWorkspace =
    !isLoading && !loadError && assessments.length === 0;
  const showNoResults =
    !isLoading &&
    !loadError &&
    !showEmptyWorkspace &&
    filteredAssessments.length === 0;

  const drawerController = useAssessmentDrawerController({
    companyId,
    reloadAssessments: () => setReloadKey(key => key + 1),
  });

  const clearFilters = () => {
    setSearchValue('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSortBy(defaultQueryState.sortBy);
    setSortDirection(defaultQueryState.sortDirection);
    setCurrentPage(1);
    writeQueryState({
      search: '',
      status: 'all',
      type: 'all',
      sortBy: defaultQueryState.sortBy,
      sortDirection: defaultQueryState.sortDirection,
      page: 1,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: AssessmentStatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
    writeQueryState({ status: value, page: 1 });
  };

  const handleTypeFilterChange = (value: AssessmentTypeFilter) => {
    setTypeFilter(value);
    setCurrentPage(1);
    writeQueryState({ type: value, page: 1 });
  };

  const handleSortChange = (nextSortBy: AssessmentListSortKey) => {
    const nextDirection =
      sortBy === nextSortBy && sortDirection === 'desc' ? 'asc' : 'desc';

    setSortBy(nextSortBy);
    setSortDirection(nextDirection);
    setCurrentPage(1);
    writeQueryState({
      sortBy: nextSortBy,
      sortDirection: nextDirection,
      page: 1,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    writeQueryState({ page });
  };

  return {
    assessments,
    filteredAssessments,
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
