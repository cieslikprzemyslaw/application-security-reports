import { styled, css } from 'styled-components';

const StyledReportCover = styled.article.attrs({ className: 'report-cover' })`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.xl};

    width: 100%;

    .report-cover-brand-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.l};

      padding-bottom: ${spacing.m};

      border-bottom: 1px solid ${colors.border.subtle};
    }

    .report-cover-brand {
      display: flex;
      align-items: center;
      gap: ${spacing.s};
    }

    .report-cover-logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      min-width: 3rem;
      min-height: 3rem;
    }

    .report-cover-logo img,
    .report-cover-logo svg {
      display: block;
      max-width: 8rem;
      max-height: 3rem;
    }

    .report-cover-brand-name {
      display: block;
      font-size: ${typography.headings.h6.size};
      color: ${colors.text.primary};
    }

    .report-cover-brand-meta {
      display: block;
      margin-top: 0.125rem;
      color: ${colors.text.muted};
    }

    .report-cover-confidential {
      text-align: right;
    }

    .report-cover-confidential strong {
      display: block;
      color: ${colors.feedback.error};
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .report-cover-confidential span {
      display: block;
      margin-top: 0.125rem;
      color: ${colors.text.secondary};
    }

    .report-cover-eyebrow {
      color: ${colors.brand.primary};
      font-weight: ${typography.fontWeights.semibold};
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .report-cover-title {
      margin-top: ${spacing.xxs};
      font-size: ${typography.headings.h1.size};
      line-height: ${typography.headings.h1.lineHeight};
    }

    .report-cover-subtitle {
      margin-top: ${spacing.s};
      color: ${colors.text.secondary};
    }

    .report-cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));

      margin: 0;
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      overflow: hidden;
    }

    .report-cover-meta-item {
      min-width: 0;
      padding: ${spacing.s};

      border-right: 1px solid ${colors.border.subtle};
      border-bottom: 1px solid ${colors.border.subtle};
    }

    .report-cover-meta-item:nth-child(4n) {
      border-right: 0;
    }

    .report-cover-meta-item:nth-last-child(-n + 4) {
      border-bottom: 0;
    }

    .report-cover-meta-label {
      font-size: ${typography.label.small.size};
      color: ${colors.text.muted};
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .report-cover-meta-value {
      margin: 0.25rem 0 0;
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.primary};
    }

    .report-cover-section-title {
      padding-bottom: ${spacing.xxs};

      border-bottom: 2px solid ${colors.brand.primary};
      font-size: ${typography.headings.h4.size};
    }

    .report-cover-summary-box {
      display: grid;
      grid-template-columns: 8rem minmax(0, 1fr);
      gap: ${spacing.s};

      margin-top: ${spacing.s};
      padding: ${spacing.s};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.neutral.grey50};
    }

    .report-cover-risk-box {
      display: flex;
      flex-direction: column;
      justify-content: center;

      padding: ${spacing.s};
      border-radius: ${radii.md};
    }

    .report-cover-risk-box[data-risk='critical'] {
      color: ${colors.severity.critical.text};
      background-color: ${colors.severity.critical.background};
      border: 1px solid ${colors.severity.critical.solid};
    }

    .report-cover-risk-box[data-risk='high'] {
      color: ${colors.severity.high.text};
      background-color: ${colors.severity.high.background};
      border: 1px solid ${colors.severity.high.solid};
    }

    .report-cover-risk-box[data-risk='medium'] {
      color: ${colors.severity.medium.text};
      background-color: ${colors.severity.medium.background};
      border: 1px solid ${colors.severity.medium.solid};
    }

    .report-cover-risk-box[data-risk='low'] {
      color: ${colors.severity.low.text};
      background-color: ${colors.severity.low.background};
      border: 1px solid ${colors.severity.low.solid};
    }

    .report-cover-risk-box[data-risk='informational'] {
      color: ${colors.severity.informational.text};
      background-color: ${colors.severity.informational.background};
      border: 1px solid ${colors.severity.informational.solid};
    }

    .report-cover-risk-box span {
      font-size: ${typography.label.small.size};
      text-transform: uppercase;
    }

    .report-cover-risk-box strong {
      margin-top: 0.25rem;
      font-size: ${typography.headings.h3.size};
    }

    .report-cover-scope-list {
      margin: ${spacing.s} 0 0;
      padding-left: 1.25rem;
      color: ${colors.text.secondary};
    }

    .report-cover-findings-list {
      display: flex;
      flex-direction: column;
      gap: ${spacing.l};
      margin-top: ${spacing.s};
    }

    .report-cover-finding {
      padding: ${spacing.m};
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
    }

    .report-cover-finding-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.s};

      margin-bottom: ${spacing.s};
    }

    .report-cover-finding-title {
      font-size: ${typography.headings.h5.size};
    }

    .report-cover-finding-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: ${spacing.s};
    }

    .report-cover-finding-section h4 {
      margin-bottom: 0.25rem;
      font-size: ${typography.headings.h6.size};
    }

    .report-cover-finding-section p,
    .report-cover-finding-section div {
      color: ${colors.text.secondary};
    }

    .report-cover-footer {
      padding-top: ${spacing.s};
      border-top: 1px solid ${colors.border.subtle};

      color: ${colors.text.muted};
      text-align: center;
    }

    @media print {
      gap: ${spacing.l};
      color: ${colors.text.primary};
      background-color: ${colors.neutral.white};
      color-scheme: light;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      orphans: 3;
      widows: 3;

      .report-cover-brand-row,
      .report-cover-title-block,
      .report-cover-meta-grid,
      .report-cover-section--summary,
      .report-cover-section--scope,
      .report-cover-summary-box,
      .report-cover-footer {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .report-cover-section--findings {
        break-before: page;
        page-break-before: always;
      }

      .report-cover-section-title,
      .report-cover-finding-header,
      .report-cover-finding-section h4 {
        break-after: avoid;
        page-break-after: avoid;
      }

      .report-cover-finding,
      .report-cover-evidence {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .report-cover-finding {
        box-shadow: none;
      }
    }
  `}
`;

export default StyledReportCover;
