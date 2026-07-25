import React, { useId } from 'react';

import IconSVG from '~/app/components/ui/iconSVG';

interface ThreatFormSectionProps {
  title: string;
  description: string;
  isOpen: boolean;
  hasError?: boolean;
  children: React.ReactNode;
  onToggle: () => void;
}

const ThreatFormSection = ({
  title,
  description,
  isOpen,
  hasError = false,
  children,
  onToggle,
}: ThreatFormSectionProps) => {
  const headingId = useId();
  const panelId = useId();

  return (
    <section
      className={[
        'threat-form-section',
        hasError ? 'threat-form-section--has-error' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="threat-form-section-heading">
        <button
          className="threat-form-section-toggle"
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="threat-form-section-heading-copy">
            <span>{title}</span>
            <small>{description}</small>
          </span>
          {hasError && (
            <span className="threat-form-section-error">Check fields</span>
          )}
          <IconSVG name={isOpen ? 'chevronUp' : 'chevronDown'} size="small" />
        </button>
      </h3>

      <div id={panelId} className="threat-form-section-panel" hidden={!isOpen}>
        {children}
      </div>
    </section>
  );
};

export default ThreatFormSection;
