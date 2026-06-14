import { icon } from './icon';

const findingIcon = icon(
  <>
    <circle cx="12" cy="12" r="7" strokeWidth="2" />

    <circle cx="12" cy="12" r="3" strokeWidth="2" />

    <path
      d="M12 5V3M21 12h-2M12 21v-2M5 12H3"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </>,
);

export default findingIcon;
