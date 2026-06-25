import React from 'react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '~/test/render';

import ReportEvidence from './reportEvidence.component';

import type { ReportPreviewEvidence } from '~/domain';

const baseEvidence: ReportPreviewEvidence = {
  id: 'evd_00000000-0000-0000-0000-000000000001',
  assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
  threatIds: ['thr_00000000-0000-0000-0000-000000000001'],
  type: 'note',
  title: 'Authorization evidence',
  content: 'The request returned another user order.',
};

describe('ReportEvidence', () => {
  it('renders a visually distinct full Evidence section with text content', () => {
    const { container } = renderWithProviders(
      <ReportEvidence findingTitle="Authorization" items={[baseEvidence]} />,
    );

    expect(
      screen.getByLabelText('Evidence for Authorization'),
    ).toBeInTheDocument();
    expect(screen.getByText('Supporting material')).toBeInTheDocument();
    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(
      screen.getByText('The request returned another user order.'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.report-evidence-card'),
    ).toBeInTheDocument();
  });

  it('renders images and structured HTTP request and response content', () => {
    const imageEvidence: ReportPreviewEvidence = {
      ...baseEvidence,
      id: 'evd_00000000-0000-0000-0000-000000000002',
      type: 'screenshot',
      title: 'Authorization bypass screenshot',
      fileName: 'authorization-bypass.png',
      mimeType: 'image/png',
      attachmentUrl:
        '/uploads/evidence/evd_00000000-0000-0000-0000-000000000002/capture.png',
    };
    const httpEvidence: ReportPreviewEvidence = {
      ...baseEvidence,
      id: 'evd_00000000-0000-0000-0000-000000000003',
      type: 'http',
      title: 'Cross-account request and response',
      httpExchanges: [
        {
          request: {
            method: 'GET',
            url: '/api/orders/123',
            headers: { authorization: '[REDACTED]' },
          },
          response: {
            statusCode: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            body: '{"owner":"another-user"}',
          },
        },
      ],
    };

    renderWithProviders(
      <ReportEvidence
        findingTitle="Authorization"
        items={[imageEvidence, httpEvidence]}
      />,
    );

    expect(
      screen.getByRole('img', { name: 'Authorization bypass screenshot' }),
    ).toHaveAttribute('src', imageEvidence.attachmentUrl);
    expect(screen.getByText('GET /api/orders/123')).toBeInTheDocument();
    expect(screen.getByText('200 OK')).toBeInTheDocument();
    expect(screen.getByText('authorization: [REDACTED]')).toBeInTheDocument();
    expect(screen.getByText('{"owner":"another-user"}')).toBeInTheDocument();
  });
});
