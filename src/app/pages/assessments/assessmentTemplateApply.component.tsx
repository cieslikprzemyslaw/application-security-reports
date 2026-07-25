import React, { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { AssessmentFormValue } from '~/app/components/appsec/assessmentForm';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Select from '~/app/components/ui/select';
import type { AssessmentTemplate } from '~/domain';
import { assessmentTemplateService } from '~/services';

import {
  applyAssessmentTemplateToForm,
  hasAssessmentTemplateOverwriteTargets,
} from './assessmentTemplateApply.utils';

interface AssessmentTemplateApplyProps {
  value: AssessmentFormValue;
  onChange: Dispatch<SetStateAction<AssessmentFormValue>>;
}

const AssessmentTemplateApply = ({
  value,
  onChange,
}: AssessmentTemplateApplyProps) => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [statusMessage, setStatusMessage] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void assessmentTemplateService
      .list(undefined, controller.signal)
      .then(result => {
        if (active) {
          setTemplates(result);
        }
      })
      .catch(error => {
        if (
          active &&
          !(error instanceof DOMException && error.name === 'AbortError')
        ) {
          setTemplates([]);
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Assessment Templates are unavailable.',
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
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find(template => template.id === selectedTemplateId),
    [selectedTemplateId, templates],
  );

  const applyTemplate = () => {
    if (!selectedTemplate) {
      setStatusMessage('Choose an active Assessment Template first.');
      return;
    }

    if (
      hasAssessmentTemplateOverwriteTargets(value) &&
      !window.confirm(
        'Replace the current assessment type, environment, description, and scope?',
      )
    ) {
      return;
    }

    onChange(current =>
      applyAssessmentTemplateToForm(current, selectedTemplate),
    );
    setStatusMessage(`Applied "${selectedTemplate.name}".`);
  };

  return (
    <section aria-labelledby="assessment-template-selector-heading">
      <h3 id="assessment-template-selector-heading">Start from template</h3>
      <p>
        Selecting a template does not change the form until you choose Apply.
      </p>

      {loadError && (
        <Callout variant="warning" title="Templates are unavailable">
          <p>{loadError} You can still create the Assessment manually.</p>
        </Callout>
      )}

      <div className="assessment-template-apply">
        <Select
          label="Assessment Template"
          value={selectedTemplateId}
          disabled={isLoading}
          options={[
            {
              label: isLoading ? 'Loading templates...' : 'Choose a template',
              value: '',
            },
            ...templates.map(template => ({
              label: `${template.name} — ${template.environment}`,
              value: template.id,
            })),
          ]}
          onChange={event => setSelectedTemplateId(event.target.value)}
        />
        <Button
          title="Apply template"
          variant="secondary"
          disabled={isLoading || selectedTemplateId.length === 0}
          onClick={applyTemplate}
        />
      </div>

      {statusMessage && (
        <p role="status" aria-live="polite">
          {statusMessage}
        </p>
      )}
    </section>
  );
};

export default AssessmentTemplateApply;
