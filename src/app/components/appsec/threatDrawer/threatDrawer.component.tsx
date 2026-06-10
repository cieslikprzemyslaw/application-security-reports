import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';
import Button from '~/app/components/ui/button';

import StyledThreatDrawer from './threatDrawer.styled';

import type { ThreatDrawerProps } from './threatDrawer.type';

const ThreatDrawer = ({
  isOpen,
  threat,
  description,
  recommendation,
  onClose,
  onEdit,
}: ThreatDrawerProps) => (
  <StyledThreatDrawer $isOpen={isOpen} aria-hidden={!isOpen}>
    {threat && (
      <>
        <header className="threat-drawer-header">
          <div>
            <h2 className="threat-drawer-title">{threat.title}</h2>

            <div className="threat-drawer-meta">
              <SeverityBadge severity={threat.severity} size="small" />

              <StatusBadge status={threat.status} size="small" />
            </div>
          </div>

          <button
            className="threat-drawer-close-button"
            type="button"
            aria-label="Close threat details"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="threat-drawer-body">
          <section className="threat-drawer-section">
            <h3 className="threat-drawer-section-title">Application</h3>

            <p>
              {threat.applicationName}
              {' · '}
              {threat.companyName}
            </p>
          </section>

          <section className="threat-drawer-section">
            <h3 className="threat-drawer-section-title">STRIDE</h3>

            <p>{threat.strideCategory}</p>
          </section>

          {description && (
            <section className="threat-drawer-section">
              <h3 className="threat-drawer-section-title">Observation</h3>

              {description}
            </section>
          )}

          {recommendation && (
            <section className="threat-drawer-section">
              <h3 className="threat-drawer-section-title">Recommendation</h3>

              {recommendation}
            </section>
          )}

          {onEdit && <Button title="Edit threat" onClick={onEdit} />}
        </div>
      </>
    )}
  </StyledThreatDrawer>
);

export default ThreatDrawer;
