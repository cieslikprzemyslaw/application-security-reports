import '@testing-library/jest-dom/vitest';

import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
configure({
  asyncUtilTimeout: 5_000,
});

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLElement.prototype, 'attachEvent', {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLElement.prototype, 'detachEvent', {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  value: vi.fn(() => 'blob:test-object-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  value: vi.fn(),
});

afterEach(() => {
  cleanup();
});
