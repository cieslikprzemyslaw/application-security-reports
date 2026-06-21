import React from 'react';

import Button from '~/app/components/ui/button';
import Modal from '~/app/components/ui/modal';

import type { DirtyFormGuardProps } from './dirtyFormGuard.type';

const DirtyFormGuard = ({
  isBlocked,
  onProceed,
  onCancel,
}: DirtyFormGuardProps) => (
  <Modal
    isOpen={isBlocked}
    title="Unsaved changes"
    size="small"
    closeLabel="Keep editing"
    onClose={onCancel}
    footer={
      <>
        <Button
          type="button"
          title="Keep editing"
          variant="secondary"
          onClick={onCancel}
        />
        <Button
          type="button"
          title="Discard changes"
          variant="destructive"
          onClick={onProceed}
        />
      </>
    }
  >
    <p>Navigating away will discard your unsaved changes.</p>
  </Modal>
);

export default DirtyFormGuard;
