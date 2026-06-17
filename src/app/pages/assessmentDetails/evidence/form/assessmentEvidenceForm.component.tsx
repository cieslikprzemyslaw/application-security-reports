import React, { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import {
  evidenceAttachmentFromFile,
  createEmptyEvidenceExchangeFormValue,
  type EvidenceFormValue,
  type EvidenceHttpExchangeFormValue,
} from './assessmentEvidence.mapper';
import type {
  EvidenceFormErrors,
  EvidenceHttpExchangeFieldErrors,
} from './assessmentEvidence.types';

import Button from '~/app/components/ui/button';
import Badge from '~/app/components/ui/badge';
import Callout from '~/app/components/ui/callout';
import Checkbox from '~/app/components/ui/checkbox';
import Dropzone from '~/app/components/ui/dropzone';
import Input from '~/app/components/ui/input';
import Select from '~/app/components/ui/select';
import Textarea from '~/app/components/ui/textarea';
import {
  isEvidenceFileNameCompatibleWithMimeType,
  type SupportedEvidenceMimeType,
} from '~/domain/schemas/request.schema';
import type { Evidence, Threat } from '~/domain';
import StyledEvidenceForm from './assessmentEvidenceForm.styled';

const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

const attachmentAcceptedTypes = [
  'application/json',
  'application/pdf',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  '.gif',
  '.jpeg',
  '.jpg',
  '.json',
  '.pdf',
  '.png',
  '.txt',
  '.webp',
].join(',');

const evidenceTypeOptions: Array<{
  label: string;
  value: Evidence['type'];
}> = [
  { label: 'HTTP', value: 'http' },
  { label: 'Text', value: 'text' },
  { label: 'Terminal', value: 'terminal' },
  { label: 'Log', value: 'log' },
  { label: 'File', value: 'file' },
  { label: 'Note', value: 'note' },
  { label: 'Screenshot', value: 'screenshot' },
  { label: 'Request', value: 'request' },
  { label: 'Response', value: 'response' },
];

const exchangeFieldId = (
  exchangeId: string,
  field:
    | 'requestMethod'
    | 'requestUrl'
    | 'requestBody'
    | 'responseStatusCode'
    | 'responseStatusText'
    | 'responseBody',
) => `evidence-http-${exchangeId}-${field}`;

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getThreatLabel = (threat: Threat) => {
  const severity =
    threat.severity.charAt(0).toUpperCase() + threat.severity.slice(1);

  return `${threat.title} · ${severity}`;
};

const updateExchange = (
  exchanges: EvidenceHttpExchangeFormValue[],
  exchangeId: string,
  field:
    | 'requestMethod'
    | 'requestUrl'
    | 'requestBody'
    | 'responseStatusCode'
    | 'responseStatusText'
    | 'responseBody',
  value: string,
) =>
  exchanges.map(exchange =>
    exchange.localId === exchangeId
      ? {
          ...exchange,
          [field]: value,
        }
      : exchange,
  );

const removeExchange = (
  exchanges: EvidenceHttpExchangeFormValue[],
  exchangeId: string,
) => exchanges.filter(exchange => exchange.localId !== exchangeId);

const moveExchange = (
  exchanges: EvidenceHttpExchangeFormValue[],
  exchangeId: string,
  direction: -1 | 1,
) => {
  const index = exchanges.findIndex(
    exchange => exchange.localId === exchangeId,
  );

  if (index === -1) {
    return exchanges;
  }

  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= exchanges.length) {
    return exchanges;
  }

  const nextExchanges = [...exchanges];
  const [exchange] = nextExchanges.splice(index, 1);

  if (!exchange) {
    return exchanges;
  }

  nextExchanges.splice(nextIndex, 0, exchange);

  return nextExchanges;
};

const exchangeErrorFor = (
  errors: EvidenceFormErrors['exchangeErrors'],
  exchangeId: string,
): EvidenceHttpExchangeFieldErrors => errors[exchangeId] ?? {};

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

  const threatOptions = threats.map(threat => ({
    id: threat.id,
    label: getThreatLabel(threat),
  }));

  let firstErrorFieldId: string | undefined;

  if (errors.type) {
    firstErrorFieldId = 'evidence-type';
  } else if (errors.title) {
    firstErrorFieldId = 'evidence-title';
  } else if (errors.description) {
    firstErrorFieldId = 'evidence-description';
  } else if (errors.content) {
    firstErrorFieldId = 'evidence-content';
  } else if (errors.capturedAt) {
    firstErrorFieldId = 'evidence-captured-at';
  } else if (errors.threatIds) {
    firstErrorFieldId = 'evidence-threats';
  } else if (errors.attachment || attachmentSelectionError) {
    firstErrorFieldId = 'evidence-attachment';
  } else if (errors.httpExchanges) {
    firstErrorFieldId = 'evidence-http-exchanges';
  } else {
    for (const exchange of value.httpExchanges) {
      const exchangeErrors = exchangeErrorFor(
        errors.exchangeErrors,
        exchange.localId,
      );

      if (exchangeErrors.requestMethod) {
        firstErrorFieldId = exchangeFieldId(exchange.localId, 'requestMethod');
        break;
      }

      if (exchangeErrors.requestUrl) {
        firstErrorFieldId = exchangeFieldId(exchange.localId, 'requestUrl');
        break;
      }

      if (exchangeErrors.requestBody) {
        firstErrorFieldId = exchangeFieldId(exchange.localId, 'requestBody');
        break;
      }

      if (exchangeErrors.responseStatusCode) {
        firstErrorFieldId = exchangeFieldId(
          exchange.localId,
          'responseStatusCode',
        );
        break;
      }

      if (exchangeErrors.responseStatusText) {
        firstErrorFieldId = exchangeFieldId(
          exchange.localId,
          'responseStatusText',
        );
        break;
      }

      if (exchangeErrors.responseBody) {
        firstErrorFieldId = exchangeFieldId(exchange.localId, 'responseBody');
        break;
      }
    }
  }

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
    const nextValue: EvidenceFormValue = {
      ...value,
      type: nextType,
      httpExchanges:
        nextType === 'http'
          ? value.httpExchanges.length > 0
            ? value.httpExchanges
            : [createEmptyEvidenceExchangeFormValue()]
          : [],
    };

    onChange(nextValue);
  };

  const handleThreatToggle = (threatId: string, checked: boolean) => {
    const nextThreatIds = checked
      ? Array.from(new Set([...value.threatIds, threatId]))
      : value.threatIds.filter(
          existingThreatId => existingThreatId !== threatId,
        );

    onChange({
      ...value,
      threatIds: nextThreatIds,
    });
  };

  const handleAttachmentSelection = (files: File[]) => {
    const file = files[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      setAttachmentSelectionError(
        'Evidence attachment must be 5 MB or smaller.',
      );
      return;
    }

    if (!file.type) {
      setAttachmentSelectionError(
        'The selected file type is not supported by the evidence attachment allowlist.',
      );
      return;
    }

    if (
      !isEvidenceFileNameCompatibleWithMimeType(
        file.name,
        file.type as SupportedEvidenceMimeType,
      )
    ) {
      setAttachmentSelectionError(
        'The selected file name extension does not match the selected file type.',
      );
      return;
    }

    setAttachmentSelectionError(undefined);
    onChange({
      ...value,
      attachment: evidenceAttachmentFromFile(file),
    });
  };

  const handleExchangeChange = (
    exchangeId: string,
    field:
      | 'requestMethod'
      | 'requestUrl'
      | 'requestBody'
      | 'responseStatusCode'
      | 'responseStatusText'
      | 'responseBody',
    nextValue: string,
  ) => {
    onChange({
      ...value,
      httpExchanges: updateExchange(
        value.httpExchanges,
        exchangeId,
        field,
        nextValue,
      ),
    });
  };

  const renderExchangeErrors = (exchangeId: string) =>
    exchangeErrorFor(errors.exchangeErrors, exchangeId);

  const currentAttachmentDescription =
    value.attachment != null
      ? `${value.attachment.fileName} · ${value.attachment.mimeType} · ${formatFileSize(value.attachment.attachmentSizeBytes)}`
      : 'No attachment selected.';

  return (
    <StyledEvidenceForm ref={formRef} onSubmit={onSubmit} noValidate>
      {formError && (
        <Callout variant="error" title="Unable to save evidence">
          <p>{formError}</p>
        </Callout>
      )}

      <div className="evidence-form-grid">
        <Select
          id="evidence-type"
          label="Evidence type"
          value={value.type}
          error={errors.type}
          required
          options={evidenceTypeOptions}
          onChange={event =>
            handleTypeChange(event.target.value as Evidence['type'])
          }
        />

        <div className="evidence-form-full-width">
          <Input
            id="evidence-title"
            label="Title"
            value={value.title}
            error={errors.title}
            required
            onChange={event =>
              onChange({
                ...value,
                title: event.target.value,
              })
            }
          />
        </div>

        <div className="evidence-form-full-width">
          <Textarea
            id="evidence-description"
            label="Description"
            value={value.description}
            error={errors.description}
            onChange={event =>
              onChange({
                ...value,
                description: event.target.value,
              })
            }
          />
        </div>

        <div className="evidence-form-full-width">
          <Textarea
            id="evidence-content"
            label="Content"
            description={
              value.type === 'http'
                ? 'Optional plain-text notes that accompany the HTTP exchanges.'
                : 'Plain-text evidence content such as terminal output, logs, or notes.'
            }
            value={value.content}
            error={errors.content}
            onChange={event =>
              onChange({
                ...value,
                content: event.target.value,
              })
            }
          />
        </div>

        <div className="evidence-form-full-width">
          <Input
            id="evidence-captured-at"
            label="Captured date"
            type="date"
            value={value.capturedAt}
            error={errors.capturedAt}
            onChange={event =>
              onChange({
                ...value,
                capturedAt: event.target.value,
              })
            }
          />
        </div>

        <div
          className="evidence-form-full-width evidence-form-threats"
          id="evidence-threats"
        >
          <fieldset className="evidence-form-threats-fieldset">
            <legend className="evidence-form-label">Linked threats</legend>
            <p className="evidence-form-help">
              Choose zero, one, or multiple threats from this assessment.
            </p>

            {errors.threatIds && (
              <p className="evidence-form-error">{errors.threatIds}</p>
            )}

            <div className="evidence-form-threat-list">
              {threatOptions.length > 0 ? (
                threatOptions.map(threat => {
                  const isChecked = value.threatIds.includes(threat.id);

                  return (
                    <Checkbox
                      key={threat.id}
                      id={`evidence-threat-${threat.id}`}
                      label={threat.label}
                      labelAddon={
                        <Badge
                          label={isChecked ? 'Selected' : 'Threat'}
                          variant={isChecked ? 'success' : 'neutral'}
                          size="small"
                        />
                      }
                      checked={isChecked}
                      onChange={event =>
                        handleThreatToggle(threat.id, event.target.checked)
                      }
                    />
                  );
                })
              ) : (
                <p className="evidence-form-help">
                  No threats are available for this assessment yet.
                </p>
              )}
            </div>
          </fieldset>
        </div>

        <div className="evidence-form-full-width">
          <Dropzone
            id="evidence-attachment"
            label="Attachment"
            description={`Accepted file types: PNG, JPEG, GIF, WEBP, PDF, JSON, TXT. Maximum size: ${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)}.`}
            error={errors.attachment ?? attachmentSelectionError}
            acceptedTypes={attachmentAcceptedTypes}
            multiple={false}
            onFilesSelected={handleAttachmentSelection}
          />

          <p className="evidence-form-help evidence-form-attachment-summary">
            {currentAttachmentDescription}
          </p>
        </div>
      </div>

      {value.type === 'http' && (
        <section
          className="evidence-form-http"
          aria-labelledby="evidence-http-exchanges-heading"
        >
          <div className="evidence-form-http-header">
            <div>
              <h3 id="evidence-http-exchanges-heading">HTTP exchanges</h3>
              <p className="evidence-form-help">
                HTTP evidence must include at least one complete exchange.
              </p>
            </div>

            <Button
              type="button"
              title="Add exchange"
              variant="secondary"
              onClick={() =>
                onChange({
                  ...value,
                  httpExchanges: [
                    ...value.httpExchanges,
                    createEmptyEvidenceExchangeFormValue(),
                  ],
                })
              }
            />
          </div>

          {errors.httpExchanges && (
            <Callout variant="error" title="HTTP exchange validation">
              <p>{errors.httpExchanges}</p>
            </Callout>
          )}

          <div className="evidence-form-exchange-list">
            {value.httpExchanges.map((exchange, index) => {
              const exchangeErrors = renderExchangeErrors(exchange.localId);
              const isFirst = index === 0;
              const isLast = index === value.httpExchanges.length - 1;
              const canRemove = value.httpExchanges.length > 1;

              return (
                <fieldset
                  key={exchange.localId}
                  className="evidence-form-exchange"
                >
                  <legend className="evidence-form-exchange-legend">
                    Exchange {index + 1}
                  </legend>

                  <div className="evidence-form-exchange-actions">
                    <Button
                      type="button"
                      title="Move up"
                      variant="secondary"
                      size="small"
                      disabled={isFirst}
                      onClick={() =>
                        onChange({
                          ...value,
                          httpExchanges: moveExchange(
                            value.httpExchanges,
                            exchange.localId,
                            -1,
                          ),
                        })
                      }
                    />
                    <Button
                      type="button"
                      title="Move down"
                      variant="secondary"
                      size="small"
                      disabled={isLast}
                      onClick={() =>
                        onChange({
                          ...value,
                          httpExchanges: moveExchange(
                            value.httpExchanges,
                            exchange.localId,
                            1,
                          ),
                        })
                      }
                    />
                    <Button
                      type="button"
                      title="Remove"
                      variant="destructive"
                      size="small"
                      disabled={!canRemove}
                      onClick={() =>
                        canRemove
                          ? onChange({
                              ...value,
                              httpExchanges: removeExchange(
                                value.httpExchanges,
                                exchange.localId,
                              ),
                            })
                          : undefined
                      }
                    />
                  </div>

                  <div className="evidence-form-exchange-grid">
                    <Input
                      id={exchangeFieldId(exchange.localId, 'requestMethod')}
                      label="Request method"
                      value={exchange.requestMethod}
                      error={exchangeErrors.requestMethod}
                      required
                      onChange={event =>
                        handleExchangeChange(
                          exchange.localId,
                          'requestMethod',
                          event.target.value,
                        )
                      }
                    />

                    <Input
                      id={exchangeFieldId(exchange.localId, 'requestUrl')}
                      label="Request URL"
                      value={exchange.requestUrl}
                      error={exchangeErrors.requestUrl}
                      required
                      onChange={event =>
                        handleExchangeChange(
                          exchange.localId,
                          'requestUrl',
                          event.target.value,
                        )
                      }
                    />

                    <div className="evidence-form-full-width">
                      <Textarea
                        id={exchangeFieldId(exchange.localId, 'requestBody')}
                        label="Request body"
                        value={exchange.requestBody}
                        error={exchangeErrors.requestBody}
                        onChange={event =>
                          handleExchangeChange(
                            exchange.localId,
                            'requestBody',
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <Input
                      id={exchangeFieldId(
                        exchange.localId,
                        'responseStatusCode',
                      )}
                      label="Response status code"
                      type="number"
                      value={exchange.responseStatusCode}
                      error={exchangeErrors.responseStatusCode}
                      required
                      onChange={event =>
                        handleExchangeChange(
                          exchange.localId,
                          'responseStatusCode',
                          event.target.value,
                        )
                      }
                    />

                    <Input
                      id={exchangeFieldId(
                        exchange.localId,
                        'responseStatusText',
                      )}
                      label="Response status text"
                      value={exchange.responseStatusText}
                      error={exchangeErrors.responseStatusText}
                      onChange={event =>
                        handleExchangeChange(
                          exchange.localId,
                          'responseStatusText',
                          event.target.value,
                        )
                      }
                    />

                    <div className="evidence-form-full-width">
                      <Textarea
                        id={exchangeFieldId(exchange.localId, 'responseBody')}
                        label="Response body"
                        value={exchange.responseBody}
                        error={exchangeErrors.responseBody}
                        onChange={event =>
                          handleExchangeChange(
                            exchange.localId,
                            'responseBody',
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  {!canRemove && (
                    <p className="evidence-form-help">
                      At least one exchange is required.
                    </p>
                  )}
                </fieldset>
              );
            })}
          </div>
        </section>
      )}

      <Callout
        variant="warning"
        title="Redact sensitive evidence before saving"
      >
        <p>
          Remove access tokens, session cookies, passwords and secrets, API
          keys, authentication headers, and sensitive personal data before you
          save evidence for reporting.
        </p>
      </Callout>

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
