import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import {
  assessmentPresetTypes,
  type AssessmentFormValue,
  type AssessmentPresetType,
} from '~/app/components/appsec/assessmentForm';
import type { AssessmentTemplate } from '~/domain';
import { assessmentTemplateService } from '~/services';

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
      setSelectedTemplateId('');
      setStatusMessage(undefined);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setLoadError(undefined);

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

    const defaultPreset = assessmentPresetTypes[0];
    const hasExistingValues =
      draftValue.environment.trim().length > 0 ||
      draftValue.description.trim().length > 0 ||
      draftValue.scope.trim().length > 0 ||
      draftValue.typeMode === 'custom' ||
      draftValue.presetType !== defaultPreset;

    if (
      hasExistingValues &&
      !window.confirm(
        'Replace the current assessment type, environment, description, and scope?',
      )
    ) {
      return;
    }

    const isPreset = assessmentPresetTypes.includes(
      selectedTemplate.assessmentType as AssessmentPresetType,
    );

    setDraftValue(current => ({
      ...current,
      typeMode: isPreset ? 'preset' : 'custom',
      presetType: isPreset
        ? (selectedTemplate.assessmentType as AssessmentPresetType)
        : current.presetType,
      customType: isPreset ? '' : selectedTemplate.assessmentType,
      environment: selectedTemplate.environment,
      description: selectedTemplate.description ?? '',
      scope: selectedTemplate.scope ?? '',
    }));
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
