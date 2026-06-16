import React from 'react';

import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import Drawer from '~/app/components/ui/drawer';
import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';

import StyledThreatDrawer from './threatDrawer.styled';

import type {
  ThreatDrawerFinding,
  ThreatDrawerProps,
} from './threatDrawer.type';

const getCategoryLabel = (threat?: ThreatDrawerFinding) =>
  threat?.customCategory?.trim().length
    ? threat.customCategory.trim()
    : threat?.owaspCategoryCode?.trim().length
      ? threat.owaspCategoryCode.trim()
      : '—';

const getFieldValue = (value?: string) =>
  value?.trim().length ? value.trim() : '—';

const ThreatDrawer = ({
  isOpen,
  threat,
  title,
  description,
  children,
  footer,
  onClose,
  onEdit,
  closeLabel = 'Close finding details',
}: ThreatDrawerProps) => {
  const drawerTitle = title ?? threat?.title ?? 'Finding details';
  const drawerDescription =
    typeof description === 'string' ? description : undefined;
  const showDetailView = children == null && Boolean(threat);

  return (
    <Drawer
      isOpen={isOpen}
      title={drawerTitle}
      description={drawerDescription}
      footer={footer}
      closeLabel={closeLabel}
      onClose={onClose}
    >
      <StyledThreatDrawer>
        {children != null ? (
          children
        ) : showDetailView && threat ? (
          <div className="threat-drawer-body">
            <div className="threat-drawer-meta">
              <SeverityBadge severity={threat.severity} size="small" />

              <StatusBadge status={threat.status} size="small" />

              <Badge
                label={getCategoryLabel(threat)}
                variant="neutral"
                size="small"
              />
            </div>

            <section className="threat-drawer-section">
              <h3 className="threat-drawer-section-title">Title</h3>

              <p className="threat-drawer-copy">
                {getFieldValue(threat.title)}
              </p>
            </section>

            <section className="threat-drawer-section">
              <h3 className="threat-drawer-section-title">Assessment</h3>

              <p className="threat-drawer-copy">
                <strong>{getFieldValue(threat.applicationName)}</strong>
                {' · '}
                {getFieldValue(threat.companyName)}
              </p>
            </section>

            <section className="threat-drawer-section">
              <h3 className="threat-drawer-section-title">OWASP category</h3>

              <p className="threat-drawer-copy">{getCategoryLabel(threat)}</p>
            </section>

            <section className="threat-drawer-section">
              <h3 className="threat-drawer-section-title">
                Reproduction steps
              </h3>

              <div className="threat-drawer-copy">
                {getFieldValue(threat.reproductionSteps ?? threat.observation)}
              </div>
            </section>

            <section className="threat-drawer-section">
              <h3 className="threat-drawer-section-title">Impact</h3>

              <p className="threat-drawer-copy">
                {getFieldValue(threat.impact ?? threat.risk)}
              </p>
            </section>

            <section className="threat-drawer-section">
              <h3 className="threat-drawer-section-title">Remediation</h3>

              <div className="threat-drawer-copy">
                {getFieldValue(threat.remediation ?? threat.recommendation)}
              </div>
            </section>

            <section className="threat-drawer-section">
              <h3 className="threat-drawer-section-title">
                Affected component
              </h3>

              <p className="threat-drawer-copy">
                {getFieldValue(threat.affectedComponent)}
              </p>
            </section>

            {threat.affectedEndpoint != null && (
              <section className="threat-drawer-section">
                <h3 className="threat-drawer-section-title">Endpoint</h3>

                <p className="threat-drawer-copy">
                  {getFieldValue(threat.affectedEndpoint)}
                </p>
              </section>
            )}

            {threat.references != null && (
              <section className="threat-drawer-section">
                <h3 className="threat-drawer-section-title">References</h3>

                <p className="threat-drawer-copy">
                  {getFieldValue(threat.references)}
                </p>
              </section>
            )}

            {threat.resolutionNote != null && (
              <section className="threat-drawer-section">
                <h3 className="threat-drawer-section-title">Resolution note</h3>

                <p className="threat-drawer-copy">
                  {getFieldValue(threat.resolutionNote)}
                </p>
              </section>
            )}

            {threat.acceptedRiskJustification != null && (
              <section className="threat-drawer-section">
                <h3 className="threat-drawer-section-title">
                  Accepted-risk justification
                </h3>

                <p className="threat-drawer-copy">
                  {getFieldValue(threat.acceptedRiskJustification)}
                </p>
              </section>
            )}

            {typeof threat.evidenceCount === 'number' && (
              <section className="threat-drawer-section">
                <h3 className="threat-drawer-section-title">Evidence count</h3>

                <p className="threat-drawer-copy">{threat.evidenceCount}</p>
              </section>
            )}

            {threat.updatedAt && (
              <section className="threat-drawer-section">
                <h3 className="threat-drawer-section-title">Updated</h3>

                <p className="threat-drawer-copy">{threat.updatedAt}</p>
              </section>
            )}

            {onEdit && (
              <div className="threat-drawer-actions">
                <Button title="Edit finding" onClick={onEdit} />
              </div>
            )}
          </div>
        ) : null}
      </StyledThreatDrawer>
    </Drawer>
  );
};

export default ThreatDrawer;
