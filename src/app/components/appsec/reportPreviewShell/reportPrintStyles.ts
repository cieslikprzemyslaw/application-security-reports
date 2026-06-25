import { createGlobalStyle } from 'styled-components';

const ReportPrintStyles = createGlobalStyle`
  @page {
    size: auto;
    margin: 12mm;
  }

  @media print {
    html,
    body,
    #root {
      min-height: auto !important;
      background-color: ${({ theme }) => theme.colors.neutral.white} !important;
      color-scheme: light;
    }

    body {
      color: ${({ theme }) => theme.colors.text.primary};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .no-print {
      display: none !important;
    }
  }
`;

export default ReportPrintStyles;
