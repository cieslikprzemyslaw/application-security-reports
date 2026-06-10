import React from 'react';

import SettingsPanel from '~/app/components/appsec/settingsPanel';
import Button from '~/app/components/ui/button';
import Input from '~/app/components/ui/input';
import Select from '~/app/components/ui/select';
import Textarea from '~/app/components/ui/textarea';
import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledSettings, {
  Actions,
  Avatar,
  AvatarRow,
  Form,
  Grid,
  Header,
  SeverityList,
  SeverityRow,
  Stack,
  Subtitle,
  Title,
  Toggle,
  ToggleRow,
  TwoColumn,
  UploadBox,
} from './settings.styled';

import type { SettingsProps, SettingsValue } from './settings.type';

const updateField = <K extends keyof SettingsValue>(
  value: SettingsValue,
  field: K,
  fieldValue: SettingsValue[K],
): SettingsValue => ({
  ...value,
  [field]: fieldValue,
});

const Settings = ({ value, onChange, onSubmit }: SettingsProps) => (
  <StyledSettings>
    <Header>
      <Title>Settings</Title>

      <Subtitle>
        Manage your profile, workspace branding, and report defaults.
      </Subtitle>
    </Header>

    <Form onSubmit={onSubmit}>
      <Grid>
        <Stack>
          <SettingsPanel title="Profile">
            <AvatarRow>
              <Avatar>
                {value.fullName
                  .split(' ')
                  .map(part => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </Avatar>

              <div>
                <Button title="Change photo" variant="secondary" size="small" />

                <p>JPG or PNG, up to 2 MB</p>
              </div>
            </AvatarRow>

            <TwoColumn>
              <Input
                label="Full name"
                value={value.fullName}
                onChange={event =>
                  onChange(updateField(value, 'fullName', event.target.value))
                }
              />

              <Select
                label="Role"
                value={value.role}
                options={[
                  {
                    label: 'Lead Pentester',
                    value: 'Lead Pentester',
                  },
                  {
                    label: 'AppSec Engineer',
                    value: 'AppSec Engineer',
                  },
                  {
                    label: 'Security Analyst',
                    value: 'Security Analyst',
                  },
                ]}
                onChange={event =>
                  onChange(updateField(value, 'role', event.target.value))
                }
              />
            </TwoColumn>

            <Input
              label="Email"
              value={value.email}
              onChange={event =>
                onChange(updateField(value, 'email', event.target.value))
              }
            />
          </SettingsPanel>

          <SettingsPanel
            title="Workspace & Report Branding"
            subtitle="Applied to generated reports"
          >
            <TwoColumn>
              <Input
                label="Company name"
                value={value.companyName}
                onChange={event =>
                  onChange(
                    updateField(value, 'companyName', event.target.value),
                  )
                }
              />

              <Input
                label="Website"
                value={value.website}
                onChange={event =>
                  onChange(updateField(value, 'website', event.target.value))
                }
              />

              <Input
                label="Contact email"
                value={value.contactEmail}
                onChange={event =>
                  onChange(
                    updateField(value, 'contactEmail', event.target.value),
                  )
                }
              />

              <div>
                <label>Company logo</label>

                <UploadBox>Upload logo · SVG or PNG</UploadBox>
              </div>
            </TwoColumn>

            <Textarea
              label="Report footer text"
              value={value.reportFooterText}
              onChange={event =>
                onChange(
                  updateField(value, 'reportFooterText', event.target.value),
                )
              }
            />
          </SettingsPanel>
        </Stack>

        <Stack>
          <SettingsPanel title="Report Defaults">
            <Select
              label="Default methodology"
              value={value.methodology}
              options={[
                {
                  label: 'OWASP ASVS / WSTG',
                  value: 'OWASP ASVS / WSTG',
                },
                {
                  label: 'OWASP MASVS',
                  value: 'OWASP MASVS',
                },
              ]}
              onChange={event =>
                onChange(updateField(value, 'methodology', event.target.value))
              }
            />

            <Select
              label="Default report style"
              value={value.reportStyle}
              options={[
                {
                  label: 'Technical & structured',
                  value: 'Technical & structured',
                },
                {
                  label: 'Executive summary',
                  value: 'Executive summary',
                },
              ]}
              onChange={event =>
                onChange(updateField(value, 'reportStyle', event.target.value))
              }
            />

            <ToggleRow>
              <span>Include evidence in exports</span>

              <Toggle
                type="checkbox"
                checked={value.includeEvidence}
                onChange={event =>
                  onChange(
                    updateField(value, 'includeEvidence', event.target.checked),
                  )
                }
              />
            </ToggleRow>

            <ToggleRow>
              <span>Mark all reports Confidential</span>

              <Toggle
                type="checkbox"
                checked={value.confidentialReports}
                onChange={event =>
                  onChange(
                    updateField(
                      value,
                      'confidentialReports',
                      event.target.checked,
                    ),
                  )
                }
              />
            </ToggleRow>
          </SettingsPanel>

          <SettingsPanel title="Severity Model">
            <SeverityList>
              {[
                ['Critical', 'CVSS 9.0 – 10.0'],
                ['High', 'CVSS 7.0 – 8.9'],
                ['Medium', 'CVSS 4.0 – 6.9'],
                ['Low', 'CVSS 0.1 – 3.9'],
                ['Informational', 'No score'],
              ].map(([severity, range]) => (
                <SeverityRow key={severity}>
                  <SeverityBadge
                    severity={
                      severity as
                        | 'Critical'
                        | 'High'
                        | 'Medium'
                        | 'Low'
                        | 'Informational'
                    }
                    size="small"
                  />

                  <span>{range}</span>
                </SeverityRow>
              ))}
            </SeverityList>
          </SettingsPanel>
        </Stack>
      </Grid>

      <Actions>
        <Button type="submit" title="Save settings" />
      </Actions>
    </Form>
  </StyledSettings>
);

export default Settings;
