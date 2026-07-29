import type { Settings } from '~/domain';

export interface AppUserIdentity {
  fullName: string;
  role: string;
}

export const appUserIdentityStorageKey = 'appsec-report-builder:user-identity';
export const appUserIdentityChangedEvent =
  'appsec-report-builder:user-identity-changed';

export const defaultAppUserIdentity: AppUserIdentity = {
  fullName: 'Alex Mercer',
  role: 'Lead Pentester',
};

const normalizeIdentityValue = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
};

const parseIdentity = (value: unknown): AppUserIdentity | undefined => {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const candidate = value as Partial<AppUserIdentity>;
  const fullName = normalizeIdentityValue(candidate.fullName);
  const role = normalizeIdentityValue(candidate.role);

  if (!fullName || !role) {
    return undefined;
  }

  return { fullName, role };
};

export const settingsToAppUserIdentity = (
  settings: Pick<Settings, 'consultantName' | 'consultantRole'>,
): AppUserIdentity => ({
  fullName:
    normalizeIdentityValue(settings.consultantName) ??
    defaultAppUserIdentity.fullName,
  role:
    normalizeIdentityValue(settings.consultantRole) ??
    defaultAppUserIdentity.role,
});

export const readAppUserIdentity = (): AppUserIdentity => {
  if (typeof window === 'undefined') {
    return defaultAppUserIdentity;
  }

  try {
    const storedValue = window.localStorage.getItem(appUserIdentityStorageKey);

    if (!storedValue) {
      return defaultAppUserIdentity;
    }

    return parseIdentity(JSON.parse(storedValue)) ?? defaultAppUserIdentity;
  } catch {
    return defaultAppUserIdentity;
  }
};

export const publishAppUserIdentity = (
  settings: Pick<Settings, 'consultantName' | 'consultantRole'>,
): AppUserIdentity => {
  const identity = settingsToAppUserIdentity(settings);

  if (typeof window === 'undefined') {
    return identity;
  }

  try {
    window.localStorage.setItem(
      appUserIdentityStorageKey,
      JSON.stringify(identity),
    );
  } catch {
    // The topbar still updates for this session when storage is unavailable.
  }

  window.dispatchEvent(
    new window.CustomEvent(appUserIdentityChangedEvent, {
      detail: identity,
    }),
  );

  return identity;
};
