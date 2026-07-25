import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { DirtyFormGuard, PageHeader } from '~/app/components/common';
import { useDirtyFormGuard } from '~/app/hooks/useDirtyFormGuard';
import {
  EntityNotFoundView,
  RouteLoadingView,
} from '~/app/components/routeStateViews';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Input from '~/app/components/ui/input';
import Textarea from '~/app/components/ui/textarea';
import type {
  AssessmentTemplate,
  CreateAssessmentTemplateInput,
} from '~/domain';
import { routes } from '~/routes';
import { assessmentTemplateService } from '~/services';

import StyledAssessmentTemplates from './assessmentTemplates.styled';

const emptyValue: CreateAssessmentTemplateInput = {
  name: '',
  assessmentType: '',
  environment: '',
  description: '',
  scope: '',
};

const normalise = (value: CreateAssessmentTemplateInput) => ({
  name: value.name.trim(),
  assessmentType: value.assessmentType.trim(),
  environment: value.environment.trim(),
  description: value.description?.trim() || undefined,
  scope: value.scope?.trim() || undefined,
});

const AssessmentTemplateForm = () => {
  const { templateId } = useParams<{ templateId?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(templateId);
  const [template, setTemplate] = useState<AssessmentTemplate>();
  const [value, setValue] = useState<CreateAssessmentTemplateInput>(emptyValue);
  const [baseline, setBaseline] =
    useState<CreateAssessmentTemplateInput>(emptyValue);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    if (!templateId) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    void assessmentTemplateService
      .getById(templateId, controller.signal)
      .then(result => {
        if (!active) {
          return;
        }

        const nextValue = {
          name: result.name,
          assessmentType: result.assessmentType,
          environment: result.environment,
          description: result.description ?? '',
          scope: result.scope ?? '',
        };

        setTemplate(result);
        setValue(nextValue);
        setBaseline(nextValue);
      })
      .catch(error => {
        if (!active) {
          return;
        }

        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('not found')
        ) {
          setNotFound(true);
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load the Assessment Template.',
        );
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
  }, [templateId]);

  const isDirty = useMemo(
    () =>
      JSON.stringify(normalise(value)) !== JSON.stringify(normalise(baseline)),
    [baseline, value],
  );

  const dirtyFormGuard = useDirtyFormGuard(isDirty && !isSaving);

  if (isLoading) {
    return <RouteLoadingView />;
  }

  if (notFound) {
    return (
      <EntityNotFoundView
        entityName="Assessment Template"
        listHref={routes.assessmentTemplates}
        listLabel="Return to Assessment Templates"
      />
    );
  }

  const isArchived = Boolean(template?.archivedAt);

  const updateField = (
    field: keyof CreateAssessmentTemplateInput,
    fieldValue: string,
  ) => {
    setValue(current => ({ ...current, [field]: fieldValue }));
    setErrorMessage(undefined);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = normalise(value);

    if (!input.name || !input.assessmentType || !input.environment) {
      setErrorMessage(
        'Template name, Assessment type, and environment are required.',
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(undefined);

    try {
      if (templateId) {
        await assessmentTemplateService.update(templateId, input);
      } else {
        await assessmentTemplateService.create(input);
      }

      navigate(routes.assessmentTemplates);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save the Assessment Template.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StyledAssessmentTemplates>
      <PageHeader
        eyebrow="Assessment templates"
        title={isEdit ? 'Edit template' : 'Create template'}
        context={[
          { label: 'Settings', href: routes.settings },
          {
            label: 'Assessment templates',
            href: routes.assessmentTemplates,
          },
          { label: isEdit ? 'Edit template' : 'New template' },
        ]}
        documentTitle={
          isEdit ? 'Edit Assessment Template' : 'New Assessment Template'
        }
        subtitle="Store reusable defaults without Company or Assessment-specific data."
        primaryAction={{
          id: 'save-assessment-template',
          label: isEdit ? 'Save changes' : 'Create template',
          type: 'submit',
          form: 'assessment-template-form',
          disabled: isArchived || isSaving,
          isLoading: isSaving,
          onActivate: () => undefined,
        }}
      />

      {isArchived && (
        <Callout variant="warning" title="This template is archived">
          <p>
            Restore the template from the management list before editing it.
          </p>
        </Callout>
      )}

      {errorMessage && (
        <Callout variant="error" title="Could not save Assessment Template">
          <p>{errorMessage}</p>
        </Callout>
      )}

      <form
        id="assessment-template-form"
        className="template-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="template-form-grid">
          <Input
            id="template-name"
            label="Template name"
            value={value.name}
            required
            disabled={isArchived}
            onChange={event => updateField('name', event.target.value)}
          />
          <Input
            id="template-assessment-type"
            label="Assessment type"
            value={value.assessmentType}
            required
            disabled={isArchived}
            onChange={event =>
              updateField('assessmentType', event.target.value)
            }
          />
          <Input
            id="template-environment"
            label="Environment"
            value={value.environment}
            required
            disabled={isArchived}
            onChange={event => updateField('environment', event.target.value)}
          />
          <div className="template-form-full">
            <Textarea
              id="template-description"
              label="Description"
              value={value.description ?? ''}
              disabled={isArchived}
              onChange={event => updateField('description', event.target.value)}
            />
          </div>
          <div className="template-form-full">
            <Textarea
              id="template-scope"
              label="Scope"
              value={value.scope ?? ''}
              disabled={isArchived}
              onChange={event => updateField('scope', event.target.value)}
            />
          </div>
        </div>

        <div className="template-form-actions">
          <Button
            title="Cancel"
            variant="secondary"
            disabled={isSaving}
            onClick={() => navigate(routes.assessmentTemplates)}
          />
          <Button
            type="submit"
            title={isEdit ? 'Save changes' : 'Create template'}
            disabled={isArchived}
            isLoading={isSaving}
          />
        </div>
      </form>
      <DirtyFormGuard
        isBlocked={dirtyFormGuard.isBlocked}
        onCancel={dirtyFormGuard.cancel}
        onProceed={dirtyFormGuard.proceed}
      />
    </StyledAssessmentTemplates>
  );
};

export default AssessmentTemplateForm;
