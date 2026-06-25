import React from 'react';

import StyledReportEvidence from './reportEvidence.styled';

import type { ReportPreviewEvidence } from '~/domain';

interface ReportEvidenceProps {
  findingTitle: string;
  items: readonly ReportPreviewEvidence[];
}

const evidenceTypeLabels: Record<ReportPreviewEvidence['type'], string> = {
  http: 'HTTP',
  text: 'Text',
  terminal: 'Terminal',
  log: 'Log',
  file: 'File',
  note: 'Note',
  screenshot: 'Screenshot',
  request: 'Request',
  response: 'Response',
};

const codeLikeTypes = new Set<ReportPreviewEvidence['type']>([
  'http',
  'terminal',
  'log',
  'request',
  'response',
]);

const formatHeaders = (headers?: Record<string, string>) => {
  if (!headers || Object.keys(headers).length === 0) {
    return undefined;
  }

  return Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n');
};

const formatFileSize = (value?: number) => {
  if (value === undefined) {
    return undefined;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageEvidence = (item: ReportPreviewEvidence) =>
  item.type === 'screenshot' || item.mimeType?.startsWith('image/');

const EvidenceText = ({ item }: { item: ReportPreviewEvidence }) => {
  if (!item.content) {
    return null;
  }

  if (codeLikeTypes.has(item.type)) {
    return <pre className="report-evidence-code">{item.content}</pre>;
  }

  return <p className="report-evidence-text">{item.content}</p>;
};

const HttpMessage = ({
  label,
  headline,
  headers,
  body,
}: {
  label: string;
  headline: string;
  headers?: Record<string, string>;
  body?: string;
}) => {
  const formattedHeaders = formatHeaders(headers);

  return (
    <section className="report-evidence-http-message">
      <p className="report-evidence-http-label">{label}</p>
      <strong className="report-evidence-http-headline">{headline}</strong>

      {formattedHeaders && (
        <div className="report-evidence-http-part">
          <span>Headers</span>
          <pre>{formattedHeaders}</pre>
        </div>
      )}

      {body && (
        <div className="report-evidence-http-part">
          <span>Body</span>
          <pre>{body}</pre>
        </div>
      )}
    </section>
  );
};

const EvidenceHttpExchanges = ({ item }: { item: ReportPreviewEvidence }) => {
  if (!item.httpExchanges || item.httpExchanges.length === 0) {
    return null;
  }

  return (
    <div className="report-evidence-http-exchanges">
      {item.httpExchanges.map((exchange, index) => (
        <article
          key={`${item.id}-exchange-${index + 1}`}
          className="report-evidence-http-exchange"
        >
          <h5>HTTP exchange {index + 1}</h5>

          <HttpMessage
            label="Request"
            headline={`${exchange.request.method} ${exchange.request.url}`}
            headers={exchange.request.headers}
            body={exchange.request.body}
          />

          <HttpMessage
            label="Response"
            headline={`${exchange.response.statusCode}${
              exchange.response.statusText
                ? ` ${exchange.response.statusText}`
                : ''
            }`}
            headers={exchange.response.headers}
            body={exchange.response.body}
          />
        </article>
      ))}
    </div>
  );
};

const EvidenceAttachment = ({ item }: { item: ReportPreviewEvidence }) => {
  if (!item.fileName && !item.attachmentUrl) {
    return null;
  }

  const fileSize = formatFileSize(item.attachmentSizeBytes);

  return (
    <div className="report-evidence-attachment">
      <div>
        <strong>{item.fileName ?? 'Evidence attachment'}</strong>
        <p>
          {[item.mimeType, fileSize].filter(Boolean).join(' · ') ||
            'Attachment'}
        </p>
      </div>

      {item.attachmentUrl && <a href={item.attachmentUrl}>Open attachment</a>}
    </div>
  );
};

const ReportEvidence = ({ findingTitle, items }: ReportEvidenceProps) => (
  <StyledReportEvidence aria-label={`Evidence for ${findingTitle}`}>
    <header className="report-evidence-heading">
      <div>
        <span className="report-evidence-kicker">Supporting material</span>
        <h4>Evidence</h4>
      </div>

      <span className="report-evidence-count">
        {items.length} {items.length === 1 ? 'item' : 'items'}
      </span>
    </header>

    <div className="report-evidence-list">
      {items.map((item, index) => (
        <article key={item.id} className="report-evidence-card">
          <header className="report-evidence-card-heading">
            <div>
              <span className="report-evidence-index">
                Evidence {index + 1}
              </span>
              <h5>{item.title}</h5>
            </div>

            <span className="report-evidence-type">
              {evidenceTypeLabels[item.type]}
            </span>
          </header>

          {item.description && (
            <p className="report-evidence-description">{item.description}</p>
          )}

          {isImageEvidence(item) && item.attachmentUrl && (
            <figure className="report-evidence-image">
              <img src={item.attachmentUrl} alt={item.title} />
              {item.fileName && <figcaption>{item.fileName}</figcaption>}
            </figure>
          )}

          <EvidenceHttpExchanges item={item} />
          <EvidenceText item={item} />
          <EvidenceAttachment item={item} />
        </article>
      ))}
    </div>
  </StyledReportEvidence>
);

export default ReportEvidence;
