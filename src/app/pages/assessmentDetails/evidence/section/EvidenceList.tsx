import React from 'react';

import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import EmptyState from '~/app/components/ui/emptyState';
import type { Evidence } from '~/domain';

import type { AssessmentEvidenceController } from '../hooks/useAssessmentEvidence';
import { formatDate, getEvidenceTypeLabel } from './EvidenceSection.utils';

interface EvidenceListProps {
  evidence: Evidence[];
  controller: AssessmentEvidenceController;
}

const EvidenceList = ({ evidence, controller }: EvidenceListProps) => {
  if (evidence.length === 0) {
    return (
      <div className="assessment-evidence-empty">
        <EmptyState
          title="No evidence yet"
          description="Add the first evidence item to document what was captured during this assessment."
          primaryAction={
            controller.canEditEvidence ? (
              <Button
                title="Add evidence"
                onClick={controller.openCreateEvidence}
              />
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="assessment-evidence-list">
      {evidence.map(item => (
        <article key={item.id} className="assessment-evidence-card">
          <div className="assessment-evidence-card-header">
            <div className="assessment-evidence-card-title-row">
              <button
                className="assessment-evidence-card-title-button"
                type="button"
                onClick={() => controller.openEvidenceDetails(item)}
              >
                {item.title}
              </button>

              <div className="assessment-evidence-card-actions">
                {controller.canEditEvidence && (
                  <Button
                    title="Edit"
                    variant="secondary"
                    size="small"
                    onClick={() => controller.openEditEvidence(item)}
                  />
                )}
              </div>
            </div>

            <div className="assessment-evidence-card-meta">
              <Badge
                label={getEvidenceTypeLabel(item.type)}
                variant="info"
                size="small"
              />
              <Badge
                label={`${item.threatIds.length} linked threat${item.threatIds.length === 1 ? '' : 's'}`}
                variant="neutral"
                size="small"
              />
              <Badge
                label={formatDate(item.capturedAt)}
                variant="neutral"
                size="small"
              />
            </div>
          </div>

          <div className="assessment-evidence-card-body">
            <p className="assessment-evidence-card-summary">
              {item.description ?? 'No description provided.'}
            </p>

            {item.type === 'http' && (item.httpExchanges?.length ?? 0) > 0 && (
              <p className="assessment-evidence-card-summary">
                {item.httpExchanges?.length} HTTP exchange
                {item.httpExchanges?.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          <div className="assessment-evidence-card-footer">
            <div className="assessment-evidence-card-meta">
              {item.fileName ? (
                <Badge
                  label={`${item.fileName} · metadata only`}
                  variant="neutral"
                  size="small"
                />
              ) : (
                <Badge label="No attachment" variant="neutral" size="small" />
              )}
            </div>

            <div className="assessment-evidence-card-actions">
              {item.fileName && (
                <Button
                  title="Download unavailable"
                  variant="secondary"
                  size="small"
                  isLoading={controller.downloadTargetId === item.id}
                  onClick={() => void controller.downloadAttachment(item)}
                />
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default EvidenceList;
