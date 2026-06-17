import React from 'react';

const PlainTextBlock = ({ value }: { value?: string }) => (
  <div className="assessment-evidence-plain-text">{value ?? '—'}</div>
);

export default PlainTextBlock;
