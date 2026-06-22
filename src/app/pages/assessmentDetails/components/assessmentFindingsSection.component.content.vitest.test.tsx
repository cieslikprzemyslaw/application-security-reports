import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { createTestingLibraryRoot, act } from '~/test/vitestLegacyBridge';

import { ThemeProvider } from 'styled-components';

import { defaultTheme } from '~/theme';

import { createEmptyThreatFormValue } from '../assessmentDetails.mapper';

import AssessmentFindingsSection from './assessmentFindingsSection.component';
import {
  assessmentBase,
  finding,
  renderHarness,
  renderTick,
  setupDom,
  textContent,
} from './assessmentFindingsSection.testUtils';

describe('assessmentFindingsSection.component.content', () => {
  it('passes the migrated checks', async () => {
    await (async () => {
      {
        const { container, root, window } = await renderHarness('archived');

        assert.equal(
          Array.from(container.querySelectorAll('button')).find(
            button => button.textContent?.trim() === 'Edit threat',
          ) ?? null,
          null,
          'Expected archived assessments to hide the edit action',
        );

        const row = Array.from(
          container.querySelectorAll('.data-table-row--clickable'),
        ).find(item =>
          item.textContent?.includes('Broken object-level authorization'),
        ) as HTMLTableRowElement | undefined;

        assert.ok(row, 'Expected the archived threat row');

        await act(async () => {
          row!.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
          await renderTick();
        });

        assert.ok(
          textContent(window.document.body).includes(
            'Broken object-level authorization',
          ),
          'Expected archived threats to still open the details drawer',
        );
        assert.equal(
          Array.from(window.document.body.querySelectorAll('button')).find(
            button => button.textContent?.trim() === 'Edit threat',
          ) ?? null,
          null,
          'Expected the drawer not to expose edit actions for archived threats',
        );

        await act(async () => {
          root.unmount();
        });
      }

      {
        const { container, root } = await renderHarness('in-progress');

        assert.ok(
          textContent(container).includes('Threats'),
          'Expected Threat terminology in the section heading',
        );
        assert.ok(
          !textContent(container).includes('Findings'),
          'Expected no Finding terminology in the section',
        );

        const editButton = Array.from(
          container.querySelectorAll('button'),
        ).find(button => button.textContent?.trim() === 'Edit threat');

        assert.ok(editButton, 'Expected Edit threat action label');
        assert.ok(
          !Array.from(container.querySelectorAll('button')).some(
            button => button.textContent?.trim() === 'Edit finding',
          ),
          'Expected no Edit finding label',
        );

        assert.ok(
          textContent(container).includes('/api/orders/{id}'),
          'Expected the endpoint value to appear in the row',
        );

        await act(async () => {
          root.unmount();
        });
      }

      {
        const threatWithoutEndpoint = {
          ...finding,
          id: 'thr_2',
          affectedEndpoint: undefined,
        };

        const { container } = setupDom();
        assert.ok(container);
        const root = createTestingLibraryRoot(container);

        await act(async () => {
          root.render(
            <ThemeProvider theme={defaultTheme}>
              <AssessmentFindingsSection
                assessment={{ ...assessmentBase, status: 'in-progress' }}
                threats={[threatWithoutEndpoint]}
                isLoading={false}
                drawerMode={null}
                selectedFinding={undefined}
                draftValue={createEmptyThreatFormValue(
                  assessmentBase.owaspTaxonomyVersion,
                )}
                fieldErrors={{}}
                formError={undefined}
                isSubmitting={false}
                canEditFindings={true}
                openCreateFinding={() => undefined}
                openEditFinding={() => undefined}
                openFindingDetails={() => undefined}
                closeFindingDrawer={() => undefined}
                handleFindingChange={() => undefined}
                handleFindingSave={async event => {
                  event.preventDefault();
                }}
                isDeleting={false}
                handleFindingDelete={async () => {}}
              />
            </ThemeProvider>,
          );
          await renderTick();
        });

        assert.ok(
          textContent(container).includes('—'),
          'Expected em dash for absent endpoint',
        );

        await act(async () => {
          root.unmount();
        });
      }
    })();
  }, 15_000);
});
