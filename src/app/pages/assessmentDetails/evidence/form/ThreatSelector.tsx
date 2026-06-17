import React from 'react';

import Badge from '~/app/components/ui/badge';
import Checkbox from '~/app/components/ui/checkbox';
import type { Threat } from '~/domain';

const getThreatLabel = (threat: Threat) => {
  const severity =
    threat.severity.charAt(0).toUpperCase() + threat.severity.slice(1);

  return `${threat.title} · ${severity}`;
};

interface ThreatSelectorProps {
  threats: Threat[];
  selectedThreatIds: string[];
  error?: string;
  onToggle: (threatId: string, checked: boolean) => void;
}

const ThreatSelector = ({
  threats,
  selectedThreatIds,
  error,
  onToggle,
}: ThreatSelectorProps) => (
  <div
    className="evidence-form-full-width evidence-form-threats"
    id="evidence-threats"
  >
    <fieldset className="evidence-form-threats-fieldset">
      <legend className="evidence-form-label">Linked threats</legend>
      <p className="evidence-form-help">
        Choose zero, one, or multiple threats from this assessment.
      </p>

      {error && <p className="evidence-form-error">{error}</p>}

      <div className="evidence-form-threat-list">
        {threats.length > 0 ? (
          threats.map(threat => {
            const isChecked = selectedThreatIds.includes(threat.id);

            return (
              <Checkbox
                key={threat.id}
                id={`evidence-threat-${threat.id}`}
                label={getThreatLabel(threat)}
                labelAddon={
                  <Badge
                    label={isChecked ? 'Selected' : 'Threat'}
                    variant={isChecked ? 'success' : 'neutral'}
                    size="small"
                  />
                }
                checked={isChecked}
                onChange={event => onToggle(threat.id, event.target.checked)}
              />
            );
          })
        ) : (
          <p className="evidence-form-help">
            No threats are available for this assessment yet.
          </p>
        )}
      </div>
    </fieldset>
  </div>
);

export default ThreatSelector;
