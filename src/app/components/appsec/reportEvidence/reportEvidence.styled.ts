import { css, styled } from 'styled-components';

const StyledReportEvidence = styled.section`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    grid-column: 1 / -1;

    margin-top: ${spacing.m};
    padding: ${spacing.m};

    border: 1px solid ${colors.brand.primary};
    border-left-width: 0.35rem;
    border-radius: ${radii.md};
    background-color: ${colors.neutral.grey50};

    .report-evidence-heading,
    .report-evidence-card-heading,
    .report-evidence-attachment {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.s};
    }

    .report-evidence-heading {
      padding-bottom: ${spacing.s};
      border-bottom: 1px solid ${colors.border.subtle};
    }

    .report-evidence-kicker,
    .report-evidence-index,
    .report-evidence-http-label,
    .report-evidence-http-part > span {
      display: block;
      font-size: ${typography.label.small.size};
      color: ${colors.brand.primary};
      font-weight: ${typography.fontWeights.semibold};
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .report-evidence-heading h4 {
      margin-top: 0.125rem;
      font-size: ${typography.headings.h5.size};
      color: ${colors.text.primary};
    }

    .report-evidence-count,
    .report-evidence-type {
      display: inline-flex;
      align-items: center;

      padding: 0.2rem 0.55rem;
      border: 1px solid ${colors.brand.primary};
      border-radius: 999px;

      color: ${colors.brand.primary};
      background-color: ${colors.neutral.white};
      font-size: ${typography.label.small.size};
      font-weight: ${typography.fontWeights.semibold};
      white-space: nowrap;
    }

    .report-evidence-list {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};
      margin-top: ${spacing.s};
    }

    .report-evidence-card {
      padding: ${spacing.s};
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.neutral.white};
    }

    .report-evidence-card h5 {
      margin-top: 0.125rem;
      font-size: ${typography.headings.h6.size};
      color: ${colors.text.primary};
    }

    .report-evidence-description,
    .report-evidence-text {
      margin-top: ${spacing.s};
      color: ${colors.text.secondary};
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .report-evidence-code,
    .report-evidence-http-part pre {
      margin: ${spacing.xxs} 0 0;
      padding: ${spacing.s};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.neutral.grey50};

      color: ${colors.text.primary};
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .report-evidence-code {
      margin-top: ${spacing.s};
    }

    .report-evidence-image {
      margin: ${spacing.s} 0 0;
      padding: ${spacing.s};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.neutral.white};
      text-align: center;
    }

    .report-evidence-image img {
      display: block;
      width: auto;
      max-width: 100%;
      max-height: 36rem;
      margin: 0 auto;
      object-fit: contain;
    }

    .report-evidence-image figcaption {
      margin-top: ${spacing.xxs};
      color: ${colors.text.muted};
      font-size: ${typography.label.small.size};
    }

    .report-evidence-http-exchanges {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};
      margin-top: ${spacing.s};
    }

    .report-evidence-http-exchange {
      padding: ${spacing.s};
      border-left: 0.2rem solid ${colors.brand.primary};
      background-color: ${colors.neutral.grey50};
    }

    .report-evidence-http-exchange > h5 {
      margin: 0 0 ${spacing.s};
    }

    .report-evidence-http-message + .report-evidence-http-message {
      margin-top: ${spacing.s};
      padding-top: ${spacing.s};
      border-top: 1px dashed ${colors.border.subtle};
    }

    .report-evidence-http-headline {
      display: block;
      margin-top: 0.125rem;
      color: ${colors.text.primary};
      overflow-wrap: anywhere;
    }

    .report-evidence-http-part {
      margin-top: ${spacing.xxs};
    }

    .report-evidence-attachment {
      align-items: center;
      margin-top: ${spacing.s};
      padding: ${spacing.s};

      border: 1px dashed ${colors.brand.primary};
      border-radius: ${radii.md};
      background-color: ${colors.neutral.grey50};
    }

    .report-evidence-attachment p {
      margin-top: 0.125rem;
      color: ${colors.text.muted};
    }

    .report-evidence-attachment a {
      color: ${colors.brand.primary};
      font-weight: ${typography.fontWeights.semibold};
    }

    @media print {
      border-color: ${colors.brand.primary};
      background-color: ${colors.neutral.grey50};
      overflow: visible;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;

      .report-evidence-heading,
      .report-evidence-card-heading,
      .report-evidence-http-message > :first-child,
      .report-evidence-http-headline,
      .report-evidence-http-part > span {
        break-after: avoid;
        page-break-after: avoid;
      }

      .report-evidence-list,
      .report-evidence-http-exchanges {
        display: block;
      }

      .report-evidence-card + .report-evidence-card,
      .report-evidence-http-exchange + .report-evidence-http-exchange {
        margin-top: ${spacing.s};
      }

      .report-evidence-card,
      .report-evidence-http-exchange,
      .report-evidence-http-message,
      .report-evidence-http-part,
      .report-evidence-description,
      .report-evidence-text,
      .report-evidence-code,
      .report-evidence-http-part pre {
        height: auto;
        max-height: none;
        overflow: visible;
        break-inside: auto;
        page-break-inside: auto;
      }

      .report-evidence-description,
      .report-evidence-text,
      .report-evidence-code,
      .report-evidence-http-part pre,
      .report-evidence-http-headline {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .report-evidence-image,
      .report-evidence-attachment {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .report-evidence-image img {
        max-height: none;
        object-fit: contain;
      }
    }
  `}
`;

export default StyledReportEvidence;
