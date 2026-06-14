import { icon } from './icon';

const printIcon = icon(
  <>
    <path d="M7 7V4h10v3" strokeWidth="2" strokeLinecap="round" />

    <path
      d="M7 17H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2"
      strokeWidth="2"
      strokeLinejoin="round"
    />

    <rect x="7" y="13" width="10" height="7" rx="1" strokeWidth="2" />
  </>,
);

export default printIcon;
