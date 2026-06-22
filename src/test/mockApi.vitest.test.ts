import { describe, expect, it } from 'vitest';

import { mockApi } from './mockApi';

describe('mockApi', () => {
  it('matches routes and captures JSON request bodies', async () => {
    const api = mockApi({
      'GET /api/companies?archived=false': {
        body: {
          items: [],
        },
      },

      'POST /api/threats': request => ({
        status: 201,
        body: {
          title: request.json<{ title: string }>()?.title,
        },
      }),
    });

    const companiesResponse = await fetch('/api/companies?archived=false');

    expect(await companiesResponse.json()).toEqual({
      items: [],
    });

    const threatResponse = await fetch('/api/threats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'SQL injection',
      }),
    });

    expect(threatResponse.status).toBe(201);
    expect(await threatResponse.json()).toEqual({
      title: 'SQL injection',
    });

    expect(api.request('POST /api/threats').json()).toEqual({
      title: 'SQL injection',
    });

    expect(api.request('POST /api/threats').headers.get('Content-Type')).toBe(
      'application/json',
    );

    expect(api.requestCount('GET /api/companies?archived=false')).toBe(1);
    expect(api.requests).toHaveLength(2);
    expect(() => api.verifyAllHandlersUsed()).not.toThrow();
  });

  it('rejects unexpected API requests', async () => {
    mockApi({});

    await expect(fetch('/api/unexpected')).rejects.toThrow(
      'Unexpected API request: GET /api/unexpected',
    );
  });
});
