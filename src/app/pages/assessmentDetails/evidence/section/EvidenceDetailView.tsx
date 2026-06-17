import React, { useMemo } from 'react';

import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import type { Evidence, Threat } from '~/domain';

import type { AssessmentEvidenceController } from '../hooks/useAssessmentEvidence';
import PlainTextBlock from './PlainTextBlock';
import {
  buildThreatTitleMap,
  formatDate,
  formatFileSize,
  getEvidenceTypeLabel,
} from './EvidenceSection.utils';

interface EvidenceDetailViewProps {
  evidence: Evidence;
  threats: Threat[];
  controller: AssessmentEvidenceController;
}

const EvidenceDetailView = ({
  evidence,
  threats,
  controller,
}: EvidenceDetailViewProps) => {
  const threatTitleMap = useMemo(() => buildThreatTitleMap(threats), [threats]);

  return (
    <div className="assessment-evidence-detail-panel">
      <div className="assessment-evidence-detail-section">
        <p className="assessment-evidence-detail-label">Type</p>
        <div className="assessment-evidence-detail-text">
          <Badge
            label={getEvidenceTypeLabel(evidence.type)}
            variant="info"
            size="small"
          />
        </div>
      </div>

      <div className="assessment-evidence-detail-section">
        <p className="assessment-evidence-detail-label">Description</p>
        <PlainTextBlock value={evidence.description} />
      </div>

      <div className="assessment-evidence-detail-section">
        <p className="assessment-evidence-detail-label">Content</p>
        <PlainTextBlock value={evidence.content} />
      </div>

      <div className="assessment-evidence-detail-section">
        <p className="assessment-evidence-detail-label">Captured date</p>
        <div className="assessment-evidence-detail-text">
          {formatDate(evidence.capturedAt)}
        </div>
      </div>

      <div className="assessment-evidence-detail-section">
        <p className="assessment-evidence-detail-label">Linked threats</p>
        <div className="assessment-evidence-detail-tags">
          {evidence.threatIds.length > 0 ? (
            evidence.threatIds.map(threatId => (
              <Badge
                key={threatId}
                label={threatTitleMap.get(threatId) ?? threatId}
                variant="neutral"
                size="small"
              />
            ))
          ) : (
            <span className="assessment-evidence-detail-text">None</span>
          )}
        </div>
      </div>

      <div className="assessment-evidence-detail-section">
        <p className="assessment-evidence-detail-label">Attachment</p>
        {evidence.fileName ? (
          <div className="assessment-evidence-attachment">
            <Badge
              label={evidence.mimeType || 'Attachment'}
              variant="neutral"
              size="small"
            />
            <span className="assessment-evidence-detail-text">
              {evidence.fileName}
            </span>
            <span className="assessment-evidence-detail-text">
              {formatFileSize(evidence.attachmentSizeBytes)}
            </span>
            <span className="assessment-evidence-detail-text">
              Metadata only; binary content is not available for download.
            </span>
            <Button
              title="Download unavailable"
              variant="secondary"
              size="small"
              isLoading={controller.downloadTargetId === evidence.id}
              onClick={() => void controller.downloadAttachment(evidence)}
            />
          </div>
        ) : (
          <div className="assessment-evidence-detail-text">None</div>
        )}
      </div>

      {evidence.type === 'http' ? (
        <div className="assessment-evidence-detail-section">
          <p className="assessment-evidence-detail-label">HTTP exchanges</p>
          <ol className="assessment-evidence-http-list">
            {(evidence.httpExchanges ?? []).map((exchange, index) => (
              <li
                key={`${index}-${exchange.request.method}-${exchange.request.url}`}
                className="assessment-evidence-http-exchange"
              >
                <div className="assessment-evidence-http-exchange-header">
                  <h4 className="assessment-evidence-http-exchange-title">
                    Exchange {index + 1}
                  </h4>
                  <Badge
                    label={`${exchange.request.method} ${exchange.request.url}`}
                    variant="neutral"
                    size="small"
                  />
                </div>

                <div className="assessment-evidence-detail-section">
                  <p className="assessment-evidence-detail-label">
                    Request body
                  </p>
                  <PlainTextBlock value={exchange.request.body} />
                </div>

                <div className="assessment-evidence-detail-section">
                  <p className="assessment-evidence-detail-label">Response</p>
                  <div className="assessment-evidence-detail-text">
                    {exchange.response.statusCode}
                    {exchange.response.statusText
                      ? ` ${exchange.response.statusText}`
                      : ''}
                  </div>
                </div>

                <div className="assessment-evidence-detail-section">
                  <p className="assessment-evidence-detail-label">
                    Response body
                  </p>
                  <PlainTextBlock value={exchange.response.body} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
};

export default EvidenceDetailView;
