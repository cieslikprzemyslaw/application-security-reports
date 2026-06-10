import React from 'react';

import StyledSettingsPanel, {
  Body,
  Header,
  Subtitle,
  Title,
} from './settingsPanel.styled';

import type { SettingsPanelProps } from './settingsPanel.type';

const SettingsPanel = ({ title, subtitle, children }: SettingsPanelProps) => (
  <StyledSettingsPanel>
    <Header>
      <Title>{title}</Title>

      {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </Header>

    <Body>{children}</Body>
  </StyledSettingsPanel>
);

export default SettingsPanel;
