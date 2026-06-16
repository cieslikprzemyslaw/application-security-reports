import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  RouteErrorView,
  RouteLoadingView,
} from '~/app/components/routeStateViews';
import { ApiError } from '~/services/apiClient';
import { settingsService } from '~/services';
import { useBeforeUnload, unstable_usePrompt } from 'react-router-dom';

import { useThemePreference } from '~/theme';

import SettingsView from './settings.component';
import {
  createEmptySettingsValue,
  createSettingsValidationErrorMap,
  getFirstSettingsFieldError,
  hasSettingsPatchValues,
  settingsToValue,
  valueToSettingsPatch,
} from './settings.utils';
import type {
  SettingsFieldErrors,
  SettingsFieldName,
  SettingsValue,
} from './settings.type';

const SettingsRoute = () => {
  const { resolvedTheme, setThemePreference } = useThemePreference();
  const [value, setValue] = useState<SettingsValue>(createEmptySettingsValue);
  const [baselineValue, setBaselineValue] = useState<SettingsValue>(
    createEmptySettingsValue,
  );
  const [fieldErrors, setFieldErrors] = useState<SettingsFieldErrors>({});
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>();
  const focusFieldNameRef = useRef<SettingsFieldName | undefined>();
  const [focusRequestId, setFocusRequestId] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadSettings = async () => {
      setIsLoading(true);
      setLoadError(undefined);

      try {
        const settings = await settingsService.get(controller.signal);

        if (!isActive) {
          return;
        }

        const nextValue = settingsToValue(settings);

        setValue(nextValue);
        setBaselineValue(nextValue);
        setThemePreference(settings.theme);
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : 'Unable to load settings.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [setThemePreference]);

  const isDirty = hasSettingsPatchValues(
    valueToSettingsPatch(value, baselineValue),
  );

  useBeforeUnload(event => {
    if (!isDirty || isSaving) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  });

  unstable_usePrompt({
    when: isDirty && !isSaving,
    message: 'Discard unsaved settings changes?',
  });

  useLayoutEffect(() => {
    const focusFieldName = focusFieldNameRef.current;

    if (!focusFieldName) {
      return;
    }

    const focusTarget = document.getElementById(focusFieldName);
    focusTarget?.focus();
  }, [focusRequestId]);

  if (isLoading) {
    return <RouteLoadingView />;
  }

  if (loadError) {
    return <RouteErrorView />;
  }

  const previewTheme =
    value.theme === 'system'
      ? resolvedTheme
      : value.theme === 'dark'
        ? 'dark'
        : 'light';

  const handleChange = (nextValue: SettingsValue) => {
    setValue(nextValue);
    setFieldErrors({});
    setStatusMessage(undefined);
    setErrorMessage(undefined);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const patch = valueToSettingsPatch(value, baselineValue);

    if (!hasSettingsPatchValues(patch)) {
      setStatusMessage('No changes to save.');
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    setStatusMessage(undefined);
    setErrorMessage(undefined);

    try {
      const savedSettings = await settingsService.update(patch);
      const nextValue = settingsToValue(savedSettings);

      setValue(nextValue);
      setBaselineValue(nextValue);
      setThemePreference(savedSettings.theme);
      setStatusMessage('Settings saved.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const { fieldErrors: nextFieldErrors, generalErrors } =
          createSettingsValidationErrorMap(error.details);

        setFieldErrors(nextFieldErrors);
        setErrorMessage(
          generalErrors.length > 0
            ? generalErrors.join(' ')
            : 'Please fix the highlighted fields and try again.',
        );
        focusFieldNameRef.current = getFirstSettingsFieldError(nextFieldErrors);
        setFocusRequestId(current => current + 1);
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to save settings.',
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsView
      value={value}
      fieldErrors={fieldErrors}
      statusMessage={statusMessage}
      errorMessage={errorMessage}
      isDirty={isDirty}
      isSaving={isSaving}
      previewTheme={previewTheme}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
};

export default SettingsRoute;
