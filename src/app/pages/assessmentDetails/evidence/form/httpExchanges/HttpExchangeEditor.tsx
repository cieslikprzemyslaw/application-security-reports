import React, { useState } from 'react';

import Button from '~/app/components/ui/button';
import Input from '~/app/components/ui/input';
import Textarea from '~/app/components/ui/textarea';

import type { EvidenceHttpExchangeFormValue } from '../EvidenceForm.mapper';
import type { EvidenceHttpExchangeFieldErrors } from '../EvidenceForm.types';
import HttpExchangeControls from './HttpExchangeControls';
import RawHttpImportDialog from './RawHttpImportDialog';

export type HttpExchangeField =
  | 'requestMethod'
  | 'requestUrl'
  | 'requestBody'
  | 'responseStatusCode'
  | 'responseStatusText'
  | 'responseBody';

export const exchangeFieldId = (exchangeId: string, field: HttpExchangeField) =>
  `evidence-http-${exchangeId}-${field}`;

interface HttpExchangeEditorProps {
  exchange: EvidenceHttpExchangeFormValue;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  errors: EvidenceHttpExchangeFieldErrors;
  onChange: (
    exchangeId: string,
    field: HttpExchangeField,
    value: string,
  ) => void;
  onImport: (exchange: EvidenceHttpExchangeFormValue) => void;
  onMove: (exchangeId: string, direction: -1 | 1) => void;
  onRemove: (exchangeId: string) => void;
}

const HttpExchangeEditor = ({
  exchange,
  index,
  isFirst,
  isLast,
  canRemove,
  errors,
  onChange,
  onImport,
  onMove,
  onRemove,
}: HttpExchangeEditorProps) => {
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <fieldset className="evidence-form-exchange">
      <legend className="evidence-form-exchange-legend">
        Exchange {index + 1}
      </legend>

      <div className="evidence-form-exchange-header">
        <Button
          type="button"
          title="Paste raw HTTP"
          variant="secondary"
          onClick={() => setIsImportOpen(true)}
        />

        <HttpExchangeControls
          isFirst={isFirst}
          isLast={isLast}
          canRemove={canRemove}
          onMoveUp={() => onMove(exchange.localId, -1)}
          onMoveDown={() => onMove(exchange.localId, 1)}
          onRemove={() => onRemove(exchange.localId)}
        />
      </div>

      <div className="evidence-form-exchange-grid">
        <Input
          id={exchangeFieldId(exchange.localId, 'requestMethod')}
          label="Request method"
          value={exchange.requestMethod}
          error={errors.requestMethod}
          required
          onChange={event =>
            onChange(exchange.localId, 'requestMethod', event.target.value)
          }
        />

        <Input
          id={exchangeFieldId(exchange.localId, 'requestUrl')}
          label="Request URL"
          value={exchange.requestUrl}
          error={errors.requestUrl}
          required
          onChange={event =>
            onChange(exchange.localId, 'requestUrl', event.target.value)
          }
        />

        <div className="evidence-form-full-width">
          <Textarea
            id={exchangeFieldId(exchange.localId, 'requestBody')}
            label="Request body"
            value={exchange.requestBody}
            error={errors.requestBody}
            onChange={event =>
              onChange(exchange.localId, 'requestBody', event.target.value)
            }
          />
        </div>

        <Input
          id={exchangeFieldId(exchange.localId, 'responseStatusCode')}
          label="Response status code"
          type="number"
          value={exchange.responseStatusCode}
          error={errors.responseStatusCode}
          required
          onChange={event =>
            onChange(
              exchange.localId,
              'responseStatusCode',
              event.target.value,
            )
          }
        />

        <Input
          id={exchangeFieldId(exchange.localId, 'responseStatusText')}
          label="Response status text"
          value={exchange.responseStatusText}
          error={errors.responseStatusText}
          onChange={event =>
            onChange(
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
            error={errors.responseBody}
            onChange={event =>
              onChange(exchange.localId, 'responseBody', event.target.value)
            }
          />
        </div>
      </div>

      {!canRemove && (
        <p className="evidence-form-help">At least one exchange is required.</p>
      )}

      <RawHttpImportDialog
        isOpen={isImportOpen}
        exchange={exchange}
        onApply={onImport}
        onClose={() => setIsImportOpen(false)}
      />
    </fieldset>
  );
};

export default HttpExchangeEditor;
