import styled from 'styled-components';

const StyledAssessmentTemplates = styled.section`
  display: grid;
  gap: 1rem;

  .template-toolbar,
  .template-actions,
  .template-form-actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .template-card {
    background: var(--surface-raised, #fff);
    border: 1px solid var(--border-subtle, #d8dee9);
    border-radius: 0.75rem;
    overflow-x: auto;
  }

  table {
    border-collapse: collapse;
    min-width: 44rem;
    width: 100%;
  }

  th,
  td {
    border-bottom: 1px solid var(--border-subtle, #d8dee9);
    padding: 0.75rem;
    text-align: left;
    vertical-align: middle;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  .template-status {
    font-weight: 600;
  }

  .template-status--archived {
    opacity: 0.7;
  }

  .template-form {
    display: grid;
    gap: 1rem;
    max-width: 54rem;
  }

  .template-form-grid {
    display: grid;
    gap: 1rem;
  }

  @container (min-width: 46rem) {
    .template-form-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .template-form-full {
      grid-column: 1 / -1;
    }
  }
`;

export default StyledAssessmentTemplates;
