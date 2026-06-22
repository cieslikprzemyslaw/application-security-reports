import { useState } from 'react';

import { describe, expect, it, vi } from 'vitest';

import { clickButton, fillTextbox, selectOptionByName } from './interactions';
import { renderWithProviders, screen } from './render';

const ControlledForm = ({
  onSubmit,
}: {
  onSubmit: (value: string) => void;
}) => {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('medium');

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        onSubmit(`${title}:${severity}`);
      }}
    >
      <label htmlFor="test-title">Title</label>
      <input
        id="test-title"
        value={title}
        onChange={event => setTitle(event.target.value)}
      />

      <label htmlFor="test-severity">Severity</label>
      <select
        id="test-severity"
        value={severity}
        onChange={event => setSeverity(event.target.value)}
      >
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <button type="submit">Save</button>
    </form>
  );
};

describe('shared test infrastructure', () => {
  it('updates controlled fields and submits their values', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <ControlledForm onSubmit={onSubmit} />,
    );

    await fillTextbox(user, 'Title', 'SQL injection');
    await selectOptionByName(user, 'Severity', 'high');

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue(
      'SQL injection',
    );
    expect(screen.getByRole('combobox', { name: 'Severity' })).toHaveValue(
      'high',
    );

    await clickButton(user, 'Save');

    expect(onSubmit).toHaveBeenCalledWith('SQL injection:high');
  });
});
