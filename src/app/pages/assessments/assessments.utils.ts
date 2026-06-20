import type { AssessmentListItem } from '~/services';

import type { AssessmentListSortKey } from '~/app/components/appsec/assessmentTable';
import type { ListQueryField } from '~/app/hooks/useListQueryState';
import type { ApiError } from '~/services/apiClient';

export const PAGE_SIZE = 25;

export const assessmentStatusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'In Review', value: 'in-review' },
  { label: 'Completed', value: 'completed' },
  { label: 'Archived', value: 'archived' },
] as const;

export const assessmentTypeOptions = [
  { label: 'All types', value: 'all' },
  { label: 'Web App', value: 'Web App' },
  { label: 'API', value: 'API' },
  { label: 'Mobile', value: 'Mobile' },
  { label: 'Custom', value: 'custom' },
] as const;

export const assessmentSortOptions: Array<{
  label: string;
  value: AssessmentListSortKey;
}> = [
  { label: 'Updated', value: 'updated' },
  { label: 'Name', value: 'name' },
  { label: 'Type', value: 'type' },
  { label: 'Status', value: 'status' },
  { label: 'Findings', value: 'findings' },
];

export type AssessmentStatusFilter =
  (typeof assessmentStatusOptions)[number]['value'];
export type AssessmentTypeFilter =
  (typeof assessmentTypeOptions)[number]['value'];
export type AssessmentSortDirection = 'asc' | 'desc';

export interface AssessmentsQueryState {
  search: string;
  status: AssessmentStatusFilter;
  type: AssessmentTypeFilter;
  sortBy: AssessmentListSortKey;
  sortDirection: AssessmentSortDirection;
  page: number;
}

export const defaultQueryState: AssessmentsQueryState = {
  search: '',
  status: 'all',
  type: 'all',
  sortBy: 'updated',
  sortDirection: 'desc',
  page: 1,
};

export const assessmentsQueryFields: ReadonlyArray<
  ListQueryField<AssessmentsQueryState>
> = [
  {
    key: 'search',
    param: 'search',
    defaultValue: defaultQueryState.search,
    parse: value => value ?? defaultQueryState.search,
  },
  {
    key: 'status',
    param: 'status',
    defaultValue: defaultQueryState.status,
    parse: value =>
      isAssessmentStatusFilter(value) ? value : defaultQueryState.status,
  },
  {
    key: 'type',
    param: 'type',
    defaultValue: defaultQueryState.type,
    parse: value =>
      isAssessmentTypeFilter(value) ? value : defaultQueryState.type,
  },
  {
    key: 'sortBy',
    param: 'sort',
    defaultValue: defaultQueryState.sortBy,
    parse: value =>
      isAssessmentSortKey(value) ? value : defaultQueryState.sortBy,
  },
  {
    key: 'sortDirection',
    param: 'direction',
    defaultValue: defaultQueryState.sortDirection,
    parse: value => (value === 'asc' ? 'asc' : defaultQueryState.sortDirection),
  },
  {
    key: 'page',
    param: 'page',
    defaultValue: defaultQueryState.page,
    parse: value => {
      const pageValue = Number(value);

      return Number.isInteger(pageValue) && pageValue > 0
        ? pageValue
        : defaultQueryState.page;
    },
  },
];

const assessmentStatusOrder: Record<string, number> = {
  draft: 0,
  'in-progress': 1,
  'in-review': 2,
  completed: 3,
  archived: 4,
};

export const isAssessmentStatusFilter = (
  value: string | null,
): value is AssessmentStatusFilter =>
  assessmentStatusOptions.some(option => option.value === value);

export const isAssessmentTypeFilter = (
  value: string | null,
): value is AssessmentTypeFilter =>
  assessmentTypeOptions.some(option => option.value === value);

export const isAssessmentSortKey = (
  value: string | null,
): value is AssessmentListSortKey =>
  assessmentSortOptions.some(option => option.value === value);

export const readQueryState = (
  searchParams: URLSearchParams,
): AssessmentsQueryState => {
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const sortBy = searchParams.get('sort');
  const sortDirection = searchParams.get('direction');
  const pageValue = Number(searchParams.get('page'));

  return {
    search: searchParams.get('search') ?? defaultQueryState.search,
    status: isAssessmentStatusFilter(status)
      ? status
      : defaultQueryState.status,
    type: isAssessmentTypeFilter(type) ? type : defaultQueryState.type,
    sortBy: isAssessmentSortKey(sortBy) ? sortBy : defaultQueryState.sortBy,
    sortDirection:
      sortDirection === 'asc' ? 'asc' : defaultQueryState.sortDirection,
    page:
      Number.isInteger(pageValue) && pageValue > 0
        ? pageValue
        : defaultQueryState.page,
  };
};

export const isCustomType = (type: string) =>
  !['Web App', 'API', 'Mobile'].includes(type);

export const matchesSearch = (assessment: AssessmentListItem, query: string) =>
  [
    assessment.name,
    assessment.type,
    assessment.description,
    assessment.scope,
  ].some(value => Boolean(value?.toLowerCase().includes(query)));

export const filterAndSortAssessments = (
  assessments: AssessmentListItem[],
  queryState: AssessmentsQueryState,
) => {
  const query = queryState.search.trim().toLowerCase();

  const filteredAssessments = assessments.filter(assessment => {
    const matchesText = query.length === 0 || matchesSearch(assessment, query);
    const matchesStatus =
      queryState.status === 'all' || assessment.status === queryState.status;
    const matchesType =
      queryState.type === 'all' ||
      (queryState.type === 'custom'
        ? isCustomType(assessment.type)
        : assessment.type === queryState.type);

    return matchesText && matchesStatus && matchesType;
  });

  const sortedAssessments = [...filteredAssessments].sort((left, right) => {
    const directionFactor = queryState.sortDirection === 'asc' ? 1 : -1;

    switch (queryState.sortBy) {
      case 'name':
        return (
          left.name.localeCompare(right.name, undefined, {
            sensitivity: 'base',
          }) * directionFactor
        );
      case 'type':
        return (
          left.type.localeCompare(right.type, undefined, {
            sensitivity: 'base',
          }) * directionFactor
        );
      case 'status':
        return (
          ((assessmentStatusOrder[left.status] ?? 99) -
            (assessmentStatusOrder[right.status] ?? 99)) *
          directionFactor
        );
      case 'findings':
        return (left.findingsCount - right.findingsCount) * directionFactor;
      case 'updated':
      default:
        return (
          (new Date(left.updatedAt).getTime() -
            new Date(right.updatedAt).getTime()) *
          directionFactor
        );
    }
  });

  return sortedAssessments;
};

export const nextSortDirection = (
  currentSortBy: AssessmentListSortKey,
  nextSortBy: AssessmentListSortKey,
  currentDirection: AssessmentSortDirection,
): AssessmentSortDirection =>
  currentSortBy === nextSortBy && currentDirection === 'asc' ? 'desc' : 'asc';

export const createAssessmentValidationErrorMap = (
  details: ApiError['details'],
  valueType: 'preset' | 'custom',
) => {
  const fieldErrors: Partial<Record<string, string>> = {};
  const generalErrors: string[] = [];

  for (const detail of details) {
    const path = detail.path.split('.')[0];

    if (path === 'title' && !fieldErrors.name) {
      fieldErrors.name = detail.message;
      continue;
    }

    if (path === 'applicationName' && !fieldErrors.applicationName) {
      fieldErrors.applicationName = detail.message;
      continue;
    }

    if (path === 'assessmentType') {
      const targetField = valueType === 'custom' ? 'customType' : 'presetType';

      if (!fieldErrors[targetField]) {
        fieldErrors[targetField] = detail.message;
      }

      continue;
    }

    if (
      [
        'description',
        'scope',
        'status',
        'name',
        'applicationName',
        'presetType',
        'customType',
      ].includes(path) &&
      !fieldErrors[path]
    ) {
      fieldErrors[path] = detail.message;
      continue;
    }

    generalErrors.push(detail.message);
  }

  return { fieldErrors, generalErrors };
};
