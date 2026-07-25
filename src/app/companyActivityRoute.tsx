import { useParams } from 'react-router-dom';

import ActivityHistory from '~/app/components/appsec/activityHistory';
import { PageHeader } from '~/app/components/common';
import { routes } from '~/routes';

interface CompanyActivityRouteProps {
  companyName?: string;
}

const CompanyActivityRoute = ({ companyName }: CompanyActivityRouteProps) => {
  const { companyId } = useParams<{ companyId?: string }>();

  return (
    <section>
      <PageHeader
        eyebrow="Company workspace"
        title="Activity"
        context={[
          { label: 'Companies', href: routes.companies },
          {
            label: companyName ?? 'Company',
            href: companyId
              ? routes.companyWorkspaceOverview(companyId)
              : routes.companies,
          },
          { label: 'Activity' },
        ]}
        documentTitle={
          companyName ? `Activity for ${companyName}` : 'Company activity'
        }
        subtitle="Recent actions across the active company workspace."
      />

      {companyId ? (
        <ActivityHistory
          scope={{ type: 'company', companyId }}
          emptyMessage="No Company activity has been recorded yet."
        />
      ) : null}
    </section>
  );
};

export default CompanyActivityRoute;
