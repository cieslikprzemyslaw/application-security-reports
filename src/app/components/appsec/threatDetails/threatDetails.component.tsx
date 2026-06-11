import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';
import Badge from '~/app/components/ui/badge';
import { STRIDE_LABELS } from '~/domain';

import StyledThreatDetails from './threatDetails.styled';

import type { ThreatDetailsProps } from './threatDetails.type';

const ThreatDetails = ({
  title,
  threatId,
  severity,
  status,
  strideCategory,
  affectedComponent,
  affectedEndpoint,
  observation,
  risk,
  recommendation,
  references,
  evidence,
  actions,
  ...rest
}: ThreatDetailsProps) => (
  <StyledThreatDetails {...rest}>
    <header className="threat-details-header">
      <div className="threat-details-title-group">
        <h2 className="threat-details-title">{title}</h2>

        <p className="threat-details-id">{threatId}</p>
      </div>

      <div className="threat-details-badges">
        <SeverityBadge severity={severity} />

        <StatusBadge status={status} />

        <Badge
          label={STRIDE_LABELS[strideCategory]}
          variant="neutral"
          size="small"
        />
      </div>
    </header>

    <dl className="threat-details-metadata">
      <div className="threat-details-metadata-item">
        <dt className="threat-details-metadata-label">Component</dt>

        <dd className="threat-details-metadata-value">
          {affectedComponent ?? '—'}
        </dd>
      </div>

      <div className="threat-details-metadata-item">
        <dt className="threat-details-metadata-label">Endpoint</dt>

        <dd className="threat-details-metadata-value">
          {affectedEndpoint ?? '—'}
        </dd>
      </div>
    </dl>

    <section className="threat-details-section">
      <h3 className="threat-details-section-title">Observation</h3>

      <div className="threat-details-section-body">{observation}</div>
    </section>

    <section className="threat-details-section">
      <h3 className="threat-details-section-title">Risk</h3>

      <div className="threat-details-section-body">{risk}</div>
    </section>

    <section className="threat-details-section">
      <h3 className="threat-details-section-title">Recommendation</h3>

      <div className="threat-details-section-body">{recommendation}</div>
    </section>

    {references && (
      <section className="threat-details-section">
        <h3 className="threat-details-section-title">References</h3>

        <div className="threat-details-section-body">{references}</div>
      </section>
    )}

    {evidence && (
      <section className="threat-details-section">
        <h3 className="threat-details-section-title">Evidence</h3>

        <div className="threat-details-section-body">{evidence}</div>
      </section>
    )}

    {actions && <div className="threat-details-actions">{actions}</div>}
  </StyledThreatDetails>
);

export default ThreatDetails;
