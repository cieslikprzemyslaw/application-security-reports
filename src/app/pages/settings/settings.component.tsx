import React from 'react';

import SettingsPanel from '~/app/components/appsec/settingsPanel';
import Button from '~/app/components/ui/button';
import Input from '~/app/components/ui/input';
import Select from '~/app/components/ui/select';
import Textarea from '~/app/components/ui/textarea';
import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledSettings from './settings.styled';
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
    <header className="settings-header">
      <h1 className="settings-title">Settings</h1>

      <p className="settings-subtitle">
        Manage your profile, workspace branding, and report defaults.
      </p>
    </header>

    <form className="settings-form" onSubmit={onSubmit}>
      <div className="settings-grid">
        <div className="settings-stack">
          <SettingsPanel title="Profile">
            <div className="settings-avatar-row">
              <div className="settings-avatar">
                {value.fullName
                  .split(' ')
                  .map(part => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div>
                <Button title="Change photo" variant="secondary" size="small" />

                <p>JPG or PNG, up to 2 MB</p>
              </div>
            </div>

            <div className="settings-two-column">
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
                  { label: 'Lead Pentester', value: 'Lead Pentester' },
                  { label: 'AppSec Engineer', value: 'AppSec Engineer' },
                  { label: 'Security Analyst', value: 'Security Analyst' },
                ]}
                onChange={event =>
                  onChange(updateField(value, 'role', event.target.value))
                }
              />
            </div>

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
            <div className="settings-two-column">
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

                <div className="settings-upload-box">
                  Upload logo · SVG or PNG
                </div>
              </div>
            </div>

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
        </div>

        <div className="settings-stack">
          <SettingsPanel title="Report Defaults">
            <Select
              label="Default methodology"
              value={value.methodology}
              options={[
                { label: 'OWASP ASVS / WSTG', value: 'OWASP ASVS / WSTG' },
                { label: 'OWASP MASVS', value: 'OWASP MASVS' },
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
                { label: 'Executive summary', value: 'Executive summary' },
              ]}
              onChange={event =>
                onChange(updateField(value, 'reportStyle', event.target.value))
              }
            />

            <div className="settings-toggle-row">
              <span>Include evidence in exports</span>

              <input
                className="settings-toggle"
                type="checkbox"
                checked={value.includeEvidence}
                onChange={event =>
                  onChange(
                    updateField(value, 'includeEvidence', event.target.checked),
                  )
                }
              />
            </div>

            <div className="settings-toggle-row">
              <span>Mark all reports Confidential</span>

              <input
                className="settings-toggle"
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
            </div>
          </SettingsPanel>

          <SettingsPanel title="Severity Model">
            <div className="settings-severity-list">
              {[
                ['Critical', 'CVSS 9.0 – 10.0'],
                ['High', 'CVSS 7.0 – 8.9'],
                ['Medium', 'CVSS 4.0 – 6.9'],
                ['Low', 'CVSS 0.1 – 3.9'],
                ['Informational', 'No score'],
              ].map(([severity, range]) => (
                <div key={severity} className="settings-severity-row">
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
                </div>
              ))}
            </div>
          </SettingsPanel>
        </div>
      </div>

      <div className="settings-actions">
        <Button type="submit" title="Save settings" />
      </div>
    </form>
  </StyledSettings>
);

export default Settings;
