import React, { useMemo, useState } from 'react';

import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Modal from '~/app/components/ui/modal';
import Textarea from '~/app/components/ui/textarea';
import {
  parseRawHttpExchange,
  type HttpExchangeParseResult,
} from '~/utils/httpParser';

import type { EvidenceHttpExchangeFormValue } from '../EvidenceForm.mapper';
import {
  applyRawHttpImport,
  hasRawHttpImportConflicts,
} from './rawHttpImport.utils';

interface RawHttpImportDialogProps {
  isOpen: boolean;
  exchange: EvidenceHttpExchangeFormValue;
  onApply: (exchange: EvidenceHttpExchangeFormValue) => void;
  onClose: () => void;
}

const RawHttpImportDialog = ({
  isOpen,
  exchange,
  onApply,
  onClose,
}: RawHttpImportDialogProps) => {
  const [rawRequest, setRawRequest] = useState(exchange.rawRequest ?? '');
  const [rawResponse, setRawResponse] = useState(exchange.rawResponse ?? '');
  const [parseResult, setParseResult] = useState<HttpExchangeParseResult>();
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const hasErrors = Boolean(parseResult?.errors.length);
  const hasConflicts = useMemo(
    () =>
      parseResult ? hasRawHttpImportConflicts(exchange, parseResult) : false,
    [exchange, parseResult],
  );

  const handleParse = () => {
    setParseResult(
      parseRawHttpExchange(
        rawRequest,
        rawResponse.trim().length > 0 ? rawResponse : undefined,
      ),
    );
    setOverwriteConfirmed(false);
  };

  const handleApply = () => {
    if (!parseResult || hasErrors) {
      return;
    }

    if (hasConflicts && !overwriteConfirmed) {
      setOverwriteConfirmed(true);
      return;
    }

    onApply(applyRawHttpImport(exchange, parseResult));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Paste raw HTTP"
      description="Parse inert request and response text before applying supported fields to this unsaved exchange."
      closeLabel="Close raw HTTP import"
      size="large"
      onClose={onClose}
      footer={
        <>
          <Button title="Cancel" variant="secondary" onClick={onClose} />
          <Button
            title="Parse HTTP"
            variant="secondary"
            disabled={rawRequest.trim().length === 0}
            onClick={handleParse}
          />
          <Button
            title={
              hasConflicts && overwriteConfirmed
                ? 'Confirm overwrite'
                : 'Apply parsed data'
            }
            disabled={!parseResult || hasErrors}
            onClick={handleApply}
          />
        </>
      }
    >
      <div className="evidence-raw-http-dialog">
        <Textarea
          id={`raw-http-request-${exchange.localId}`}
          label="Raw HTTP request"
          description="Paste a request start line, headers and optional body. The text is never executed."
          value={rawRequest}
          rows={10}
          required
          data-modal-autofocus="true"
          onChange={event => {
            setRawRequest(event.target.value);
            setParseResult(undefined);
            setOverwriteConfirmed(false);
          }}
        />

        <Textarea
          id={`raw-http-response-${exchange.localId}`}
          label="Raw HTTP response"
          description="Optional. Leave empty for request-only evidence."
          value={rawResponse}
          rows={10}
          onChange={event => {
            setRawResponse(event.target.value);
            setParseResult(undefined);
            setOverwriteConfirmed(false);
          }}
        />

        {parseResult?.errors.length ? (
          <Callout variant="error" title="Unable to parse HTTP">
            <ul>
              {parseResult.errors.map(error => (
                <li key={`${error.field}-${error.message}`}>{error.message}</li>
              ))}
            </ul>
          </Callout>
        ) : null}

        {parseResult?.warnings.length ? (
          <Callout variant="warning" title="Parser warnings">
            <ul>
              {parseResult.warnings.map(warning => (
                <li key={warning.message}>{warning.message}</li>
              ))}
            </ul>
          </Callout>
        ) : null}

        {parseResult && !hasErrors && (
          <section
            className="evidence-raw-http-preview"
            aria-labelledby={`raw-http-preview-${exchange.localId}`}
          >
            <h3 id={`raw-http-preview-${exchange.localId}`}>Parsed preview</h3>
            <dl>
              <div>
                <dt>Request</dt>
                <dd>
                  {parseResult.request?.method} {parseResult.request?.target}{' '}
                  {parseResult.request?.httpVersion}
                </dd>
              </div>
              <div>
                <dt>Request headers</dt>
                <dd>{parseResult.request?.headers.length ?? 0}</dd>
              </div>
              <div>
                <dt>Response</dt>
                <dd>
                  {parseResult.response
                    ? `${parseResult.response.statusCode} ${parseResult.response.reasonPhrase}`.trim()
                    : 'Not supplied'}
                </dd>
              </div>
              <div>
                <dt>Response headers</dt>
                <dd>{parseResult.response?.headers.length ?? 0}</dd>
              </div>
            </dl>
            <p className="evidence-form-help">
              Supported editor fields and original raw text will be retained in
              this draft. Headers remain visible in the raw source and are not
              added to the current Evidence API payload.
            </p>
          </section>
        )}

        {hasConflicts && overwriteConfirmed && (
          <Callout variant="warning" title="Confirm field overwrite">
            <p>
              One or more populated editor fields differ from the parsed data.
              Select Confirm overwrite to replace those unsaved values.
            </p>
          </Callout>
        )}
      </div>
    </Modal>
  );
};

export default RawHttpImportDialog;
