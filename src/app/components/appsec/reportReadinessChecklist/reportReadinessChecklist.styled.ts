import { css, styled } from 'styled-components';

const StyledReportReadinessChecklist = styled.section`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    container-type: inline-size;

    display: grid;
    gap: ${spacing.s};

    width: 100%;

    .report-readiness-checklist__heading {
      font-size: ${typography.headings.h5.size};
      line-height: ${typography.headings.h5.lineHeight};
    }

    .report-readiness-checklist__items {
      display: grid;
      gap: ${spacing.xxs};

      padding: 0;
      margin: 0;

      list-style: none;
    }

    .report-readiness-checklist__item {
      min-width: 0;
    }

    .report-readiness-checklist__item-content,
    .report-readiness-checklist__target-button {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: ${spacing.xxxs} ${spacing.s};
      align-items: center;

      width: 100%;
      padding: ${spacing.xs};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.sm};
      color: ${colors.text.primary};
      background: ${colors.surface.card};
      text-align: left;
    }

    .report-readiness-checklist__target-button {
      transition:
        background-color 120ms ease,
        border-color 120ms ease;
    }

    .report-readiness-checklist__target-button:hover {
      border-color: ${colors.border.default};
      background: ${colors.surface.subtle};
    }

    .report-readiness-checklist__message {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .report-readiness-checklist__target {
      grid-column: 1;

      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      color: ${colors.text.secondary};
    }

    .report-readiness-checklist__action {
      grid-column: 2;
      grid-row: 1 / span 2;

      font-size: ${typography.body.small.size};
      font-weight: 600;
      color: ${colors.text.link};
    }

    @container (max-width: 28rem) {
      .report-readiness-checklist__item-content,
      .report-readiness-checklist__target-button {
        grid-template-columns: minmax(0, 1fr);
      }

      .report-readiness-checklist__action {
        grid-column: 1;
        grid-row: auto;
      }
    }

    @media print {
      display: none !important;
    }
  `}
`;

export default StyledReportReadinessChecklist;
