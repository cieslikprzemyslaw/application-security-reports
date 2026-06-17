import React from 'react';

import Button from '~/app/components/ui/button';

interface HttpExchangeControlsProps {
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

const HttpExchangeControls = ({
  isFirst,
  isLast,
  canRemove,
  onMoveUp,
  onMoveDown,
  onRemove,
}: HttpExchangeControlsProps) => (
  <div className="evidence-form-exchange-actions">
    <Button
      type="button"
      title="Move up"
      variant="secondary"
      size="small"
      disabled={isFirst}
      onClick={onMoveUp}
    />
    <Button
      type="button"
      title="Move down"
      variant="secondary"
      size="small"
      disabled={isLast}
      onClick={onMoveDown}
    />
    <Button
      type="button"
      title="Remove"
      variant="destructive"
      size="small"
      disabled={!canRemove}
      onClick={canRemove ? onRemove : undefined}
    />
  </div>
);

export default HttpExchangeControls;
