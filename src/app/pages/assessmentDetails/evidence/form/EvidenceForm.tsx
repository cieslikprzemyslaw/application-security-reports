import React, { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import type { Evidence, Threat } from '~/domain';

import AttachmentField from './AttachmentField';
import CommonFields from './CommonFields';
import {
  createEmptyEvidenceExchangeFormValue,
  type EvidenceFormValue,
} from './EvidenceForm.mapper';
import StyledEvidenceForm from './EvidenceForm.styles';
import type { EvidenceFormErrors } from './EvidenceForm.types';
import RedactionWarning from './RedactionWarning';
import ThreatSelector from './ThreatSelector';
import HttpExchangeList from './httpExchanges/HttpExchangeList';
import { exchangeFieldId } from './httpExchanges/HttpExchangeEditor';

interface EvidenceFormProps {
  value: EvidenceFormValue;
  threats: Threat[];
  errors: EvidenceFormErrors;
  formError?: string;
  isSubmitting?: boolean;
  submitLabel: string;
  onChange: (value: EvidenceFormValue) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel?: () => void;
}

const getFirstErrorFieldId = (
  value: EvidenceFormValue,
  errors: EvidenceFormErrors,
  attachmentSelectionError?: string,
) => {
  if (errors.type) return 'evidence-type';
  if (errors.title) return 'evidence-title';
  if (errors.description) return 'evidence-description';
  if (errors.content) return 'evidence-content';
  if (errors.capturedAt) return 'evidence-captured-at';
  if (errors.threatIds) return 'evidence-threats';
  if (errors.attachment || attachmentSelectionError)
    return 'evidence-attachment';
  if (errors.httpExchanges) return 'evidence-http-exchanges';

  for (const exchange of value.httpExchanges) {
    const exchangeErrors = errors.exchangeErrors[exchange.localId] ?? {};

    if (exchangeErrors.requestMethod) {
      return exchangeFieldId(exchange.localId, 'requestMethod');
    }

    if (exchangeErrors.requestUrl) {
      return exchangeFieldId(exchange.localId, 'requestUrl');
    }

    if (exchangeErrors.requestBody) {
      return exchangeFieldId(exchange.localId, 'requestBody');
    }

    if (exchangeErrors.responseStatusCode) {
      return exchangeFieldId(exchange.localId, 'responseStatusCode');
    }

    if (exchangeErrors.responseStatusText) {
      return exchangeFieldId(exchange.localId, 'responseStatusText');
    }

    if (exchangeErrors.responseBody) {
      return exchangeFieldId(exchange.localId, 'responseBody');
    }
  }

  return undefined;
};

const EvidenceForm = ({
  value,
  threats,
  errors,
  formError,
  isSubmitting = false,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: EvidenceFormProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [attachmentSelectionError, setAttachmentSelectionError] = useState<
    string | undefined
  >();

  const firstErrorFieldId = getFirstErrorFieldId(
    value,
    errors,
    attachmentSelectionError,
  );

  useEffect(() => {
    if (!firstErrorFieldId) {
      return;
    }

    const target = formRef.current?.querySelector<HTMLElement>(
      `#${CSS.escape(firstErrorFieldId)}`,
    );

    target?.focus();
    target?.scrollIntoView({ block: 'center' });
  }, [firstErrorFieldId]);

  const handleTypeChange = (nextType: Evidence['type']) => {
    onChange({
      ...value,
      type: nextType,
      httpExchanges:
        nextType === 'http'
          ? value.httpExchanges.length > 0
            ? value.httpExchanges
            : [createEmptyEvidenceExchangeFormValue()]
          : [],
    });
  };

  const handleThreatToggle = (threatId: string, checked: boolean) => {
    onChange({
      ...value,
      threatIds: checked
        ? Array.from(new Set([...value.threatIds, threatId]))
        : value.threatIds.filter(
            existingThreatId => existingThreatId !== threatId,
          ),
    });
  };

  return (
    <StyledEvidenceForm ref={formRef} onSubmit={onSubmit} noValidate>
      {formError && (
        <Callout variant="error" title="Unable to save evidence">
          <p>{formError}</p>
        </Callout>
      )}

      <div className="evidence-form-grid">
        <CommonFields
          value={value}
          errors={errors}
          onChange={onChange}
          onTypeChange={handleTypeChange}
        />

        <ThreatSelector
          threats={threats}
          selectedThreatIds={value.threatIds}
          error={errors.threatIds}
          onToggle={handleThreatToggle}
        />

        <AttachmentField
          attachment={value.attachment}
          error={errors.attachment}
          selectionError={attachmentSelectionError}
          onSelectionError={setAttachmentSelectionError}
          onChange={attachment =>
            onChange({
              ...value,
              attachment,
            })
          }
        />
      </div>

      {value.type === 'http' && (
        <HttpExchangeList
          exchanges={value.httpExchanges}
          errors={errors}
          onChange={httpExchanges =>
            onChange({
              ...value,
              httpExchanges,
            })
          }
        />
      )}

      <RedactionWarning />

      <div className="evidence-form-actions">
        {onCancel && (
          <Button
            type="button"
            title="Cancel"
            variant="secondary"
            disabled={isSubmitting}
            onClick={onCancel}
          />
        )}

        <Button
          type="submit"
          title={submitLabel}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
      </div>
    </StyledEvidenceForm>
  );
};

export default EvidenceForm;
