import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { AssessmentFormValue } from '~/app/components/appsec/assessmentForm';
import type { AssessmentTemplate } from '~/domain';
import { assessmentTemplateService } from '~/services';

import {
  applyAssessmentTemplateToForm,
  hasAssessmentTemplateOverwriteTargets,
} from './assessmentTemplateApply.utils';

interface UseAssessmentTemplateApplyOptions {
  drawerMode: 'create' | 'edit' | null;
  draftValue: AssessmentFormValue;
  setDraftValue: Dispatch<SetStateAction<AssessmentFormValue>>;
}

export const useAssessmentTemplateApply = ({
  drawerMode,
  draftValue,
  setDraftValue,
}: UseAssessmentTemplateApplyOptions) => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [statusMessage, setStatusMessage] = useState<string>();

  useEffect(() => {
    if (drawerMode !== 'create') {
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setLoadError(undefined);
    setSelectedTemplateId('');
    setStatusMessage(undefined);

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
  }, [drawerMode]);

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
      hasAssessmentTemplateOverwriteTargets(draftValue) &&
      !window.confirm(
        'Replace the current assessment type, environment, description, and scope?',
      )
    ) {
      return;
    }

    setDraftValue(current =>
      applyAssessmentTemplateToForm(current, selectedTemplate),
    );
    setStatusMessage(`Applied "${selectedTemplate.name}".`);
  };

  return {
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    isLoading,
    loadError,
    statusMessage,
    applyTemplate,
  };
};
