import { useEffect, useMemo, useState } from 'react';

import ActivityFeed from '~/app/components/common/activityFeed';
import type {
  ActivityItem,
  ActivityTone,
} from '~/app/components/common/activityFeed';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import IconSVG, { type IconName } from '~/app/components/ui/iconSVG';
import { formatDateTime } from '~/app/utils/formatters';
import type { Activity } from '~/domain';
import { activityService } from '~/services';
import { routes } from '~/routes';

type ActivityHistoryScope =
  | { type: 'company'; companyId: string }
  | { type: 'assessment'; companyId: string; assessmentId: string };

export interface ActivityHistoryProps {
  scope: ActivityHistoryScope;
  limit?: number;
  emptyMessage?: string;
}

const toneByResult: Record<Activity['result'], ActivityTone> = {
  success: 'success',
  failure: 'error',
};

const iconByResource: Record<Activity['resource']['type'], IconName> = {
  company: 'company',
  assessment: 'assessment',
  threat: 'finding',
  evidence: 'evidence',
  report: 'report',
  settings: 'settings',
};

const getActivityHref = (activity: Activity): string | undefined => {
  if (activity.eventType === 'legacy.deleted') {
    return undefined;
  }

  const { resource } = activity;

  switch (resource.type) {
    case 'company': {
      const companyId = resource.companyId ?? resource.id;

      return routes.companyWorkspaceOverview(companyId);
    }
    case 'assessment': {
      if (!resource.companyId) {
        return undefined;
      }

      return routes.assessmentDetailsOverview(
        resource.companyId,
        resource.assessmentId ?? resource.id,
      );
    }
    case 'threat':
      return resource.companyId && resource.assessmentId
        ? routes.assessmentDetailsFindings(
            resource.companyId,
            resource.assessmentId,
          )
        : undefined;
    case 'evidence':
      return resource.companyId && resource.assessmentId
        ? routes.assessmentDetailsEvidence(
            resource.companyId,
            resource.assessmentId,
          )
        : undefined;
    case 'report':
      return resource.companyId
        ? routes.reportDetails(resource.companyId, resource.id)
        : undefined;
    case 'settings':
      return routes.settings;
  }
};

const toActivityItem = (activity: Activity): ActivityItem => ({
  id: activity.id,
  title: activity.message,
  meta: `${formatDateTime(activity.createdAt)} · ${activity.eventType}`,
  icon: <IconSVG name={iconByResource[activity.resource.type]} />,
  tone: toneByResult[activity.result],
  href: getActivityHref(activity),
});

const ActivityHistory = ({
  scope,
  limit = 50,
  emptyMessage = 'No activity has been recorded yet.',
}: ActivityHistoryProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);
  const scopeType = scope.type;
  const companyId = scope.companyId;
  const assessmentId =
    scope.type === 'assessment' ? scope.assessmentId : undefined;

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadActivities = async () => {
      setIsLoading(true);
      setLoadError(undefined);

      try {
        const nextActivities =
          scopeType === 'company'
            ? await activityService.listByCompany(
                companyId,
                limit,
                controller.signal,
              )
            : await activityService.listByAssessment(
                companyId,
                assessmentId as string,
                limit,
                controller.signal,
              );

        if (isActive) {
          setActivities(nextActivities);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : 'Unable to load activity.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadActivities();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [assessmentId, companyId, limit, reloadKey, scopeType]);

  const items = useMemo(() => activities.map(toActivityItem), [activities]);
  const retry = () => setReloadKey(key => key + 1);

  if (isLoading && activities.length === 0) {
    return (
      <div role="status" aria-live="polite">
        Loading activity...
      </div>
    );
  }

  if (loadError && activities.length === 0) {
    return (
      <Callout
        variant="error"
        title="Unable to load activity"
        actions={<Button title="Retry" variant="secondary" onClick={retry} />}
      >
        <p>{loadError}</p>
      </Callout>
    );
  }

  return (
    <>
      {isLoading && (
        <div role="status" aria-live="polite">
          Refreshing activity...
        </div>
      )}
      {loadError && (
        <Callout
          variant="warning"
          title="Activity may be out of date"
          actions={<Button title="Retry" variant="secondary" onClick={retry} />}
        >
          <p>{loadError}</p>
        </Callout>
      )}
      <ActivityFeed items={items} emptyState={emptyMessage} />
    </>
  );
};

export default ActivityHistory;
