import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { PageHeader } from '~/app/components/common';
import { RouteLoadingView } from '~/app/components/routeStateViews';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import EmptyState from '~/app/components/ui/emptyState';
import Select from '~/app/components/ui/select';
import type { AssessmentTemplate } from '~/domain';
import { routes } from '~/routes';
import { assessmentTemplateService } from '~/services';

import StyledAssessmentTemplates from './assessmentTemplates.styled';

type TemplateFilter = 'active' | 'archived' | 'all';

const AssessmentTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [filter, setFilter] = useState<TemplateFilter>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [pendingId, setPendingId] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void assessmentTemplateService
      .list({ includeArchived: true }, controller.signal)
      .then(result => {
        if (active) {
          setTemplates(result);
          setLoadError(undefined);
        }
      })
      .catch(error => {
        if (
          active &&
          !(error instanceof DOMException && error.name === 'AbortError')
        ) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Unable to load Assessment Templates.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const visibleTemplates = useMemo(
    () =>
      templates.filter(template => {
        if (filter === 'all') {
          return true;
        }

        return filter === 'archived'
          ? Boolean(template.archivedAt)
          : !template.archivedAt;
      }),
    [filter, templates],
  );

  const runTransition = async (
    template: AssessmentTemplate,
    command: 'archive' | 'restore',
  ) => {
    if (
      command === 'archive' &&
      !window.confirm(`Archive the "${template.name}" template?`)
    ) {
      return;
    }

    setPendingId(template.id);
    setActionError(undefined);

    try {
      await assessmentTemplateService[command](template.id);
      setReloadKey(key => key + 1);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : `Unable to ${command} the Assessment Template.`,
      );
    } finally {
      setPendingId(undefined);
    }
  };

  if (isLoading) {
    return <RouteLoadingView />;
  }

  return (
    <StyledAssessmentTemplates>
      <PageHeader
        eyebrow="Settings"
        title="Assessment templates"
        context={[
          { label: 'Settings', href: routes.settings },
          { label: 'Assessment templates' },
        ]}
        documentTitle="Assessment templates"
        subtitle="Manage reusable defaults for new Assessments."
        primaryAction={{
          id: 'new-assessment-template',
          label: 'New template',
          onActivate: () => navigate(routes.assessmentTemplatesNew),
        }}
      />

      {loadError && (
        <Callout
          variant="error"
          title="Unable to load Assessment Templates"
          actions={
            <Button
              title="Retry"
              variant="secondary"
              onClick={() => {
                setIsLoading(true);
                setReloadKey(key => key + 1);
              }}
            />
          }
        >
          <p>{loadError}</p>
        </Callout>
      )}

      {actionError && (
        <Callout variant="error" title="Template action failed">
          <p>{actionError}</p>
        </Callout>
      )}

      <div className="template-toolbar">
        <Select
          label="Template status"
          value={filter}
          options={[
            { label: 'Active templates', value: 'active' },
            { label: 'Archived templates', value: 'archived' },
            { label: 'All templates', value: 'all' },
          ]}
          onChange={event => setFilter(event.target.value as TemplateFilter)}
        />
      </div>

      <div className="template-card">
        {visibleTemplates.length === 0 ? (
          <EmptyState
            title={
              filter === 'active'
                ? 'No active Assessment Templates'
                : 'No Assessment Templates in this view'
            }
            description="Create a template to reuse assessment type, environment, description, and scope."
            primaryAction={
              <Button
                title="Create template"
                onClick={() => navigate(routes.assessmentTemplatesNew)}
              />
            }
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th scope="col">Template</th>
                <th scope="col">Assessment type</th>
                <th scope="col">Environment</th>
                <th scope="col">Updated</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleTemplates.map(template => {
                const isArchived = Boolean(template.archivedAt);

                return (
                  <tr key={template.id}>
                    <td>
                      {isArchived ? (
                        template.name
                      ) : (
                        <Link to={routes.assessmentTemplateEdit(template.id)}>
                          {template.name}
                        </Link>
                      )}
                    </td>
                    <td>{template.assessmentType}</td>
                    <td>{template.environment}</td>
                    <td>{new Date(template.updatedAt).toLocaleDateString()}</td>
                    <td
                      className={
                        isArchived
                          ? 'template-status template-status--archived'
                          : 'template-status'
                      }
                    >
                      {isArchived ? 'Archived' : 'Active'}
                    </td>
                    <td>
                      <div className="template-actions">
                        {!isArchived && (
                          <Button
                            title="Edit"
                            variant="secondary"
                            onClick={() =>
                              navigate(
                                routes.assessmentTemplateEdit(template.id),
                              )
                            }
                          />
                        )}
                        <Button
                          title={isArchived ? 'Restore' : 'Archive'}
                          variant="secondary"
                          isLoading={pendingId === template.id}
                          disabled={Boolean(pendingId)}
                          onClick={() =>
                            void runTransition(
                              template,
                              isArchived ? 'restore' : 'archive',
                            )
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </StyledAssessmentTemplates>
  );
};

export default AssessmentTemplates;
