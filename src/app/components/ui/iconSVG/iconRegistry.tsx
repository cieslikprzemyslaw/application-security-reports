import * as icons from './icons';
import type { IconDefinition } from './icons';

export const iconRegistry = {
  add: icons.add,
  archive: icons.archive,
  assessment: icons.assessment,
  activity: icons.activity,
  chevronDown: icons.chevronDown,
  close: icons.close,
  company: icons.company,
  dashboard: icons.dashboard,
  delete: icons.delete,
  download: icons.download,
  edit: icons.edit,
  evidence: icons.evidence,
  file: icons.file,
  finding: icons.finding,
  image: icons.image,
  menu: icons.menu,
  preview: icons.preview,
  print: icons.print,
  report: icons.report,
  restore: icons.restore,
  search: icons.search,
  settings: icons.settings,
  success: icons.success,
  trendDown: icons.trendDown,
  trendEqual: icons.trendEqual,
  trendUp: icons.trendUp,
  upload: icons.upload,
  warning: icons.warning,
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof iconRegistry;
