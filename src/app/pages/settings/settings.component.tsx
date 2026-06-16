import React from 'react';

import SettingsPanel from '~/app/components/appsec/settingsPanel';
import Button from '~/app/components/ui/button';
import Input from '~/app/components/ui/input';
import Select from '~/app/components/ui/select';
import Textarea from '~/app/components/ui/textarea';

import StyledSettings from './settings.styled';
import SettingsPreview from './settings.preview';
import type { SettingsProps, SettingsValue } from './settings.type';

const updateField = <K extends keyof SettingsValue>(
  value: SettingsValue,
  field: K,
  fieldValue: SettingsValue[K],
): SettingsValue => ({
  ...value,
  [field]: fieldValue,
});

const updateSelectField = <K extends 'theme' | 'dateFormat'>(
  value: SettingsValue,
  field: K,
  fieldValue: SettingsValue[K],
): SettingsValue => updateField(value, field, fieldValue);

const severityOptions = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
  { label: 'Informational', value: 'informational' },
];

const methodologyOptions = [
  { label: 'OWASP ASVS / WSTG', value: 'OWASP ASVS / WSTG' },
  { label: 'OWASP MASVS', value: 'OWASP MASVS' },
];

const reportStyleOptions = [
  { label: 'Technical & structured', value: 'Technical & structured' },
  { label: 'Executive summary', value: 'Executive summary' },
];

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

const dateFormatOptions = [
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
];

const Settings = ({
  value,
  fieldErrors,
  statusMessage,
  errorMessage,
  isDirty = false,
  isSaving = false,
  previewTheme,
  onChange,
  onSubmit,
}: SettingsProps) => {
  return (
    <StyledSettings>
      <header className="settings-header">
        <h1 className="settings-title">Settings</h1>

        <p className="settings-subtitle">
          Manage organisation details, report branding, defaults, and user
          preferences.
        </p>
      </header>

      <form className="settings-form" onSubmit={onSubmit}>
        <div className="settings-form-status-group" aria-live="polite">
          {statusMessage && (
            <p
              className="settings-status settings-status--success"
              role="status"
            >
              {statusMessage}
            </p>
          )}

          {errorMessage && (
            <p className="settings-status settings-status--error" role="alert">
              {errorMessage}
            </p>
          )}

          {isDirty && !isSaving && (
            <p className="settings-status settings-status--dirty">
              You have unsaved changes.
            </p>
          )}
        </div>

        <div className="settings-grid">
          <div className="settings-stack">
            <SettingsPanel
              title="Organisation details"
              subtitle="Shared identity information for reports"
            >
              <div className="settings-two-column">
                <Input
                  id="organisationName"
                  label="Organisation name"
                  value={value.organisationName}
                  error={fieldErrors?.organisationName}
                  onChange={event =>
                    onChange(
                      updateField(
                        value,
                        'organisationName',
                        event.target.value,
                      ),
                    )
                  }
                />

                <Input
                  id="defaultReportTitle"
                  label="Default report title"
                  value={value.defaultReportTitle}
                  error={fieldErrors?.defaultReportTitle}
                  onChange={event =>
                    onChange(
                      updateField(
                        value,
                        'defaultReportTitle',
                        event.target.value,
                      ),
                    )
                  }
                />

                <Input
                  id="consultantName"
                  label="Consultant name"
                  value={value.consultantName}
                  error={fieldErrors?.consultantName}
                  onChange={event =>
                    onChange(
                      updateField(value, 'consultantName', event.target.value),
                    )
                  }
                />

                <Input
                  id="consultantEmail"
                  label="Consultant email"
                  value={value.consultantEmail}
                  error={fieldErrors?.consultantEmail}
                  onChange={event =>
                    onChange(
                      updateField(value, 'consultantEmail', event.target.value),
                    )
                  }
                />
              </div>
            </SettingsPanel>

            <SettingsPanel
              title="Report issuer branding"
              subtitle="Displayed on the report header and footer"
            >
              <div className="settings-two-column">
                <Textarea
                  id="reportFooterText"
                  label="Report footer text"
                  value={value.reportFooterText}
                  error={fieldErrors?.reportFooterText}
                  onChange={event =>
                    onChange(
                      updateField(
                        value,
                        'reportFooterText',
                        event.target.value,
                      ),
                    )
                  }
                />

                <label
                  className="settings-checkbox-row"
                  htmlFor="confidentialReports"
                >
                  <div className="settings-checkbox-copy">
                    <span className="settings-checkbox-label">
                      Mark reports confidential
                    </span>

                    <span className="settings-checkbox-description">
                      Adds a confidentiality label to the report preview and
                      exported reports.
                    </span>
                  </div>

                  <input
                    id="confidentialReports"
                    className="settings-checkbox"
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
                </label>
              </div>
            </SettingsPanel>

            <SettingsPanel
              title="Report defaults"
              subtitle="Applied when creating new reports"
            >
              <div className="settings-two-column">
                <Select
                  id="defaultSeverity"
                  label="Default severity"
                  value={value.defaultSeverity}
                  error={fieldErrors?.defaultSeverity}
                  options={severityOptions}
                  onChange={event =>
                    onChange(
                      updateField(
                        value,
                        'defaultSeverity',
                        event.target.value as SettingsValue['defaultSeverity'],
                      ),
                    )
                  }
                />

                <Select
                  id="methodology"
                  label="Methodology"
                  value={value.methodology}
                  error={fieldErrors?.methodology}
                  options={methodologyOptions}
                  onChange={event =>
                    onChange(
                      updateField(value, 'methodology', event.target.value),
                    )
                  }
                />

                <Select
                  id="reportStyle"
                  label="Report style"
                  value={value.reportStyle}
                  error={fieldErrors?.reportStyle}
                  options={reportStyleOptions}
                  onChange={event =>
                    onChange(
                      updateField(value, 'reportStyle', event.target.value),
                    )
                  }
                />

                <label
                  className="settings-checkbox-row"
                  htmlFor="includeEvidence"
                >
                  <div className="settings-checkbox-copy">
                    <span className="settings-checkbox-label">
                      Include evidence in exports
                    </span>

                    <span className="settings-checkbox-description">
                      Keeps screenshots and supporting evidence in exported
                      reports.
                    </span>
                  </div>

                  <input
                    id="includeEvidence"
                    className="settings-checkbox"
                    type="checkbox"
                    checked={value.includeEvidence}
                    onChange={event =>
                      onChange(
                        updateField(
                          value,
                          'includeEvidence',
                          event.target.checked,
                        ),
                      )
                    }
                  />
                </label>
              </div>
            </SettingsPanel>

            <SettingsPanel
              title="Appearance and user preferences"
              subtitle="Controls the application look and report formatting"
            >
              <div className="settings-two-column">
                <Select
                  id="theme"
                  label="Theme preference"
                  value={value.theme}
                  error={fieldErrors?.theme}
                  description="Saved to your profile and used by the application shell."
                  options={themeOptions}
                  onChange={event =>
                    onChange(
                      updateSelectField(
                        value,
                        'theme',
                        event.target.value as SettingsValue['theme'],
                      ),
                    )
                  }
                />

                <Select
                  id="dateFormat"
                  label="Date format"
                  value={value.dateFormat}
                  error={fieldErrors?.dateFormat}
                  description="Used for dates shown in the application and report preview."
                  options={dateFormatOptions}
                  onChange={event =>
                    onChange(
                      updateSelectField(
                        value,
                        'dateFormat',
                        event.target.value as SettingsValue['dateFormat'],
                      ),
                    )
                  }
                />
              </div>
            </SettingsPanel>
          </div>

          <div className="settings-stack">
            <SettingsPanel
              title="Live preview"
              subtitle="Branding stays responsive in light and dark UI"
            >
              <SettingsPreview value={value} previewTheme={previewTheme} />
            </SettingsPanel>
          </div>
        </div>

        <div className="settings-actions">
          <Button
            type="submit"
            title="Save settings"
            disabled={!isDirty || isSaving}
            isLoading={isSaving}
          />
        </div>
      </form>
    </StyledSettings>
  );
};

export default Settings;
