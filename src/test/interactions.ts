import userEvent from '@testing-library/user-event';

import { screen } from './render';

export type TestUser = ReturnType<typeof userEvent.setup>;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createAccessibleNameMatcher = (name: string | RegExp): RegExp =>
  name instanceof RegExp ? name : new RegExp(`^${escapeRegExp(name)}\\s*\\*?$`);

export const fillTextbox = async (
  user: TestUser,
  name: string | RegExp,
  value: string,
) => {
  const input = screen.getByRole('textbox', {
    name: createAccessibleNameMatcher(name),
  });

  await user.clear(input);
  await user.type(input, value);

  return input;
};

export const selectOptionByName = async (
  user: TestUser,
  name: string | RegExp,
  value: string,
) => {
  const select = screen.getByRole('combobox', {
    name: createAccessibleNameMatcher(name),
  });

  await user.selectOptions(select, value);

  return select;
};

export const clickButton = async (user: TestUser, name: string | RegExp) => {
  const button = screen.getByRole('button', { name });

  await user.click(button);

  return button;
};
