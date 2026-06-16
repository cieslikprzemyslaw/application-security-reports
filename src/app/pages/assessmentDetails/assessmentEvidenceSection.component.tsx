import React, { useMemo } from 'react';

import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import Drawer from '~/app/components/ui/drawer';
import EmptyState from '~/app/components/ui/emptyState';
import Modal from '~/app/components/ui/modal';
import type { Evidence, Threat } from '~/domain';

import StyledAssessmentEvidenceSection from './assessmentEvidenceSection.styled';
import EvidenceForm from './assessmentEvidenceForm.component';
import type { AssessmentDetailsAssessment } from './assessmentDetails.type';
import type { AssessmentEvidenceController } from './hooks/useAssessmentEvidence';

const getEvidenceTypeLabel = (type: Evidence['type']) =>
  ({
    http: 'HTTP',
    text: 'Text',
    terminal: 'Terminal',
    log: 'Log',
    file: 'File',
    note: 'Note',
    screenshot: 'Screenshot',
    request: 'Request',
    response: 'Response',
  })[type];

const formatDate = (value?: string) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

const formatFileSize = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const buildThreatTitleMap = (threats: Threat[]) =>
  new Map(threats.map(threat => [threat.id, threat.title] as const));

const PlainTextBlock = ({ value }: { value?: string }) => (
  <div className="assessment-evidence-plain-text">{value ?? '—'}</div>
);

const EvidenceDetailView = ({
  evidence,
  threats,
  controller,
}: {
  evidence: Evidence;
  threats: Threat[];
  controller: AssessmentEvidenceController;
}) => {
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

            {evidence.fileName && (
              <Button
                title="Download attachment"
                variant="secondary"
                size="small"
                isLoading={controller.downloadTargetId === evidence.id}
                onClick={() => void controller.downloadAttachment(evidence)}
              />
            )}
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

interface AssessmentEvidenceSectionProps {
  assessment: AssessmentDetailsAssessment;
  threats: Threat[];
  controller: AssessmentEvidenceController;
}

const AssessmentEvidenceSection = ({
  assessment,
  threats,
  controller,
}: AssessmentEvidenceSectionProps) => {
  const detailTitle =
    controller.drawerMode === 'create'
      ? 'Create evidence'
      : controller.drawerMode === 'edit'
        ? 'Edit evidence'
        : (controller.selectedEvidence?.title ?? 'Evidence details');
  const drawerDescription = `${assessment.companyName} · ${assessment.applicationName}`;

  const evidenceList = controller.evidence;

  return (
    <StyledAssessmentEvidenceSection>
      {controller.statusMessage && (
        <div className="assessment-evidence-status">
          <Callout
            variant="success"
            title={
              controller.statusMessage.includes('deleted')
                ? 'Evidence deleted'
                : 'Evidence saved'
            }
          >
            <p>{controller.statusMessage}</p>
          </Callout>
        </div>
      )}

      {controller.downloadError && (
        <Callout variant="error" title="Unable to download attachment">
          <p>{controller.downloadError}</p>
        </Callout>
      )}

      {controller.loadError ? (
        <Callout
          variant="error"
          title="Unable to load evidence"
          actions={
            <Button
              title="Retry"
              variant="secondary"
              onClick={controller.reloadEvidence}
            />
          }
        >
          <p>{controller.loadError}</p>
        </Callout>
      ) : (
        <Card
          title="Evidence"
          subtitle="Structured evidence scoped to the current assessment."
          padding="large"
          actions={
            controller.canEditEvidence ? (
              <Button
                title="Add evidence"
                onClick={controller.openCreateEvidence}
              />
            ) : undefined
          }
        >
          {controller.isLoading && evidenceList.length === 0 ? (
            <div className="assessment-evidence-loading">
              <Callout variant="info" title="Loading evidence">
                <p>Fetching evidence for this assessment.</p>
              </Callout>
            </div>
          ) : evidenceList.length === 0 ? (
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
          ) : (
            <div className="assessment-evidence-list">
              {evidenceList.map(item => {
                return (
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

                      {item.type === 'http' &&
                        (item.httpExchanges?.length ?? 0) > 0 && (
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
                            label={`${item.fileName} · ${item.mimeType || 'Attachment'}`}
                            variant="neutral"
                            size="small"
                          />
                        ) : (
                          <Badge
                            label="No attachment"
                            variant="neutral"
                            size="small"
                          />
                        )}
                      </div>

                      <div className="assessment-evidence-card-actions">
                        {item.fileName && (
                          <Button
                            title="Download"
                            variant="secondary"
                            size="small"
                            isLoading={controller.downloadTargetId === item.id}
                            onClick={() =>
                              void controller.downloadAttachment(item)
                            }
                          />
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <Drawer
        isOpen={controller.drawerMode !== null}
        title={detailTitle}
        description={drawerDescription}
        closeLabel="Close evidence details"
        onClose={controller.closeEvidenceDrawer}
        size="large"
      >
        {controller.drawerMode === 'create' ||
        controller.drawerMode === 'edit' ? (
          <EvidenceForm
            value={controller.draftValue}
            threats={threats}
            errors={controller.fieldErrors}
            formError={controller.formError}
            isSubmitting={controller.isSubmitting}
            submitLabel={
              controller.drawerMode === 'create'
                ? 'Create evidence'
                : 'Save evidence'
            }
            onChange={controller.handleEvidenceChange}
            onSubmit={controller.handleEvidenceSave}
            onCancel={controller.closeEvidenceDrawer}
          />
        ) : controller.selectedEvidenceLoading ? (
          <Callout variant="info" title="Loading evidence">
            <p>Loading the latest evidence details.</p>
          </Callout>
        ) : controller.selectedEvidenceLoadError ? (
          <Callout
            variant={
              controller.selectedEvidenceLoadError.includes('not found')
                ? 'warning'
                : 'error'
            }
            title={
              controller.selectedEvidenceLoadError.includes('not found')
                ? 'Evidence not found'
                : 'Unable to load evidence'
            }
            actions={
              <>
                <Button
                  title="Retry"
                  variant="secondary"
                  onClick={controller.retrySelectedEvidenceLoad}
                />
                <Button
                  title="Close"
                  variant="secondary"
                  onClick={controller.closeEvidenceDrawer}
                />
              </>
            }
          >
            <p>{controller.selectedEvidenceLoadError}</p>
          </Callout>
        ) : controller.selectedEvidence ? (
          <div className="assessment-evidence-detail-panel">
            <div className="assessment-evidence-card-meta">
              <Badge
                label={getEvidenceTypeLabel(controller.selectedEvidence.type)}
                variant="info"
                size="small"
              />
              <Badge
                label={`${controller.selectedEvidence.threatIds.length} linked threat${controller.selectedEvidence.threatIds.length === 1 ? '' : 's'}`}
                variant="neutral"
                size="small"
              />
            </div>

            <EvidenceDetailView
              evidence={controller.selectedEvidence}
              threats={threats}
              controller={controller}
            />

            <div className="assessment-evidence-card-actions">
              {controller.canEditEvidence && (
                <Button
                  title="Edit evidence"
                  onClick={() =>
                    controller.openEditEvidence(controller.selectedEvidence)
                  }
                />
              )}

              {controller.canEditEvidence && (
                <Button
                  title="Delete evidence"
                  variant="destructive"
                  onClick={controller.requestDeleteEvidence}
                />
              )}
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        isOpen={controller.deleteTarget !== undefined}
        title="Delete evidence"
        description={controller.deleteTarget?.title}
        closeLabel="Close delete confirmation"
        onClose={controller.cancelDeleteEvidence}
        footer={
          <>
            <Button
              title="Cancel"
              variant="secondary"
              disabled={controller.isDeleting}
              onClick={controller.cancelDeleteEvidence}
            />
            <Button
              title={controller.isDeleting ? 'Deleting' : 'Delete evidence'}
              variant="destructive"
              isLoading={controller.isDeleting}
              disabled={controller.isDeleting}
              onClick={() => void controller.confirmDeleteEvidence()}
            />
          </>
        }
      >
        <div className="assessment-evidence-detail-panel">
          <Callout variant="warning" title="Delete the current evidence record">
            <p>
              The evidence record will be deleted from this assessment. Retained
              immutable report snapshot data will not change, but an attachment
              referenced by an older retained report may become unavailable.
            </p>
          </Callout>

          {controller.deleteError && (
            <Callout variant="error" title="Unable to delete evidence">
              <p>{controller.deleteError}</p>
            </Callout>
          )}
        </div>
      </Modal>
    </StyledAssessmentEvidenceSection>
  );
};

export default AssessmentEvidenceSection;
