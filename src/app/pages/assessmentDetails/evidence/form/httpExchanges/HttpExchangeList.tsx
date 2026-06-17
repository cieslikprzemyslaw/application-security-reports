import React from 'react';

import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';

import {
  createEmptyEvidenceExchangeFormValue,
  type EvidenceHttpExchangeFormValue,
} from '../EvidenceForm.mapper';
import type {
  EvidenceFormErrors,
  EvidenceHttpExchangeFieldErrors,
} from '../EvidenceForm.types';
import HttpExchangeEditor, {
  type HttpExchangeField,
} from './HttpExchangeEditor';

const updateExchange = (
  exchanges: EvidenceHttpExchangeFormValue[],
  exchangeId: string,
  field: HttpExchangeField,
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

interface HttpExchangeListProps {
  exchanges: EvidenceHttpExchangeFormValue[];
  errors: EvidenceFormErrors;
  onChange: (exchanges: EvidenceHttpExchangeFormValue[]) => void;
}

const HttpExchangeList = ({
  exchanges,
  errors,
  onChange,
}: HttpExchangeListProps) => (
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
          onChange([...exchanges, createEmptyEvidenceExchangeFormValue()])
        }
      />
    </div>

    {errors.httpExchanges && (
      <Callout variant="error" title="HTTP exchange validation">
        <p>{errors.httpExchanges}</p>
      </Callout>
    )}

    <div className="evidence-form-exchange-list">
      {exchanges.map((exchange, index) => (
        <HttpExchangeEditor
          key={exchange.localId}
          exchange={exchange}
          index={index}
          isFirst={index === 0}
          isLast={index === exchanges.length - 1}
          canRemove={exchanges.length > 1}
          errors={exchangeErrorFor(errors.exchangeErrors, exchange.localId)}
          onChange={(exchangeId, field, value) =>
            onChange(updateExchange(exchanges, exchangeId, field, value))
          }
          onMove={(exchangeId, direction) =>
            onChange(moveExchange(exchanges, exchangeId, direction))
          }
          onRemove={exchangeId =>
            onChange(removeExchange(exchanges, exchangeId))
          }
        />
      ))}
    </div>
  </section>
);

export default HttpExchangeList;
