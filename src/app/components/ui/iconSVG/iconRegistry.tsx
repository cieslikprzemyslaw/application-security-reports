import type { ReactNode } from 'react';

type IconDefinition = {
  viewBox?: string;
  children: ReactNode;
};

const icon = (children: ReactNode, viewBox = '0 0 24 24'): IconDefinition => ({
  viewBox,
  children,
});

export const iconRegistry = {
  add: icon(
    <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />,
  ),
  archive: icon(
    <>
      <path d="M4 5h16v4H4z" strokeWidth="2" strokeLinejoin="round" />

      <path d="M7 9h10v11H7z" strokeWidth="2" strokeLinejoin="round" />

      <path d="M10 13h4" strokeWidth="2" strokeLinecap="round" />
    </>,
  ),
  assessment: icon(
    <>
      <path d="M8 3h8v4H8z" strokeWidth="2" strokeLinejoin="round" />

      <path d="M7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1" />

      <path d="M9 12h6M9 16h4" strokeWidth="2" strokeLinecap="round" />

      <path
        d="m9 12 1.5 1.5L14 10"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  ),
  activity: icon(
    <>
      <path
        d="M4 12h4l2-5 4 10 2-5h4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="4" cy="12" r="1" strokeWidth="2" />
      <circle cx="20" cy="12" r="1" strokeWidth="2" />
    </>,
  ),
  chevronDown: icon(
    <path
      d="m6 9 6 6 6-6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />,
  ),
  close: icon(
    <path d="M6 6 18 18M18 6 6 18" strokeWidth="2" strokeLinecap="round" />,
  ),
  company: icon(
    <>
      <path d="M5 21V4h9v17" strokeWidth="2" strokeLinejoin="round" />

      <path d="M14 9h5v12" strokeWidth="2" strokeLinejoin="round" />

      <path
        d="M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1M17 12h1M17 16h1"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>,
  ),
  dashboard: icon(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />

      <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />

      <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />

      <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
    </>,
  ),
  delete: icon(
    <>
      <path d="M6 7h12" strokeWidth="2" strokeLinecap="round" />

      <path d="M9 4h6" strokeWidth="2" strokeLinecap="round" />

      <path d="m8 7 1 14h6l1-14" strokeWidth="2" strokeLinejoin="round" />

      <path d="M10 11v6M14 11v6" strokeWidth="2" strokeLinecap="round" />
    </>,
  ),
  download: icon(
    <>
      <path d="M12 4v10" strokeWidth="2" strokeLinecap="round" />

      <path
        d="m8 10 4 4 4-4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path d="M5 20h14" strokeWidth="2" strokeLinecap="round" />
    </>,
  ),
  edit: icon(
    <>
      <path
        d="m5 19 4-1 10-10-3-3L6 15l-1 4Z"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <path d="m14 6 3 3" strokeWidth="2" strokeLinecap="round" />
    </>,
  ),
  evidence: icon(
    <>
      <path d="M6 3h8l4 4v14H6z" strokeWidth="2" strokeLinejoin="round" />

      <path d="M14 3v5h5" strokeWidth="2" />
    </>,
  ),
  file: icon(
    <>
      <path d="M6 3h8l4 4v14H6z" strokeWidth="2" strokeLinejoin="round" />

      <path d="M14 3v5h5" strokeWidth="2" />
    </>,
  ),
  finding: icon(
    <>
      <circle cx="12" cy="12" r="7" strokeWidth="2" />

      <circle cx="12" cy="12" r="3" strokeWidth="2" />

      <path
        d="M12 5V3M21 12h-2M12 21v-2M5 12H3"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>,
  ),
  image: icon(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" />

      <circle cx="8.5" cy="9" r="1.5" strokeWidth="2" />

      <path d="m4 17 5-5 4 4 2-2 5 5" strokeWidth="2" strokeLinejoin="round" />
    </>,
  ),
  menu: icon(
    <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="2" strokeLinecap="round" />,
  ),
  preview: icon(
    <>
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <circle cx="12" cy="12" r="3" strokeWidth="2" />
    </>,
  ),
  print: icon(
    <>
      <path d="M7 7V4h10v3" strokeWidth="2" strokeLinecap="round" />

      <path
        d="M7 17H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <rect x="7" y="13" width="10" height="7" rx="1" strokeWidth="2" />
    </>,
  ),
  report: icon(
    <>
      <path d="M6 3h8l4 4v14H6z" strokeWidth="2" strokeLinejoin="round" />

      <path d="M14 3v5h5" strokeWidth="2" />

      <path d="M9 11h6M9 15h6M9 18h4" strokeWidth="2" strokeLinecap="round" />
    </>,
  ),
  restore: icon(
    <>
      <path d="M7 7v5h5" strokeWidth="2" strokeLinecap="round" />

      <path
        d="M7.5 12a5.5 5.5 0 1 1 1.1 3.3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="m6 15 2.5.5-.5-2.5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  ),
  search: icon(
    <>
      <circle cx="11" cy="11" r="7" strokeWidth="2" />

      <path d="m20 20-4-4" strokeWidth="2" strokeLinecap="round" />
    </>,
  ),
  settings: icon(
    <>
      <circle cx="12" cy="12" r="3" strokeWidth="2" />

      <path
        d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1a2.2 2.2 0 1 1-3.1 3.1l-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1 1.6V22a2.2 2.2 0 1 1-4.4 0v-.1a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .4l-.1.1a2.2 2.2 0 1 1-3.1-3.1l.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.6-1H2a2.2 2.2 0 1 1 0-4.4h.1a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.4-2l-.1-.1A2.2 2.2 0 1 1 6.3 3.4l.1.1a1.8 1.8 0 0 0 2 .4 1.8 1.8 0 0 0 1-1.6V2a2.2 2.2 0 1 1 4.4 0v.1a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1a2.2 2.2 0 1 1 3.1 3.1l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1H22a2.2 2.2 0 1 1 0 4.4h-.1a1.8 1.8 0 0 0-1.5 1Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  ),
  success: icon(
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="2" />

      <path
        d="m8 12 3 3 5-6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  ),
  trendDown: icon(
    <>
      <path
        d="m4 8 5 5 4-4 7 7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16 16h4v-4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  ),
  trendEqual: icon(<path d="M5 12h14" strokeWidth="2" strokeLinecap="round" />),
  trendUp: icon(
    <>
      <path
        d="m4 16 5-5 4 4 7-7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16 8h4v4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  ),
  upload: icon(
    <>
      <path d="M12 16V4" strokeWidth="2" strokeLinecap="round" />

      <path
        d="M7 9l5-5 5 5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path d="M5 20h14" strokeWidth="2" strokeLinecap="round" />
    </>,
  ),
  warning: icon(
    <>
      <path d="M12 4 2 20h20L12 4Z" strokeWidth="2" strokeLinejoin="round" />

      <path d="M12 9v4M12 17h.01" strokeWidth="2" strokeLinecap="round" />
    </>,
  ),
} as const;

export type IconName = keyof typeof iconRegistry;
