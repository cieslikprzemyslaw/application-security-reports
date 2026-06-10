import React from 'react';

import StyledSettingsPanel from './settingsPanel.styled';

import type { SettingsPanelProps } from './settingsPanel.type';

const SettingsPanel = ({ title, subtitle, children }: SettingsPanelProps) => (
  <StyledSettingsPanel>
    <header className="settings-panel-header">
      <h2 className="settings-panel-title">{title}</h2>

      {subtitle && <span className="settings-panel-subtitle">{subtitle}</span>}
    </header>

    <div className="settings-panel-body">{children}</div>
  </StyledSettingsPanel>
);

export default SettingsPanel;
