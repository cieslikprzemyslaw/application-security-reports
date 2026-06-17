import React from 'react';

import Callout from '~/app/components/ui/callout';

const RedactionWarning = () => (
  <Callout variant="warning" title="Redact sensitive evidence before saving">
    <p>
      Remove access tokens, session cookies, passwords and secrets, API keys,
      authentication headers, and sensitive personal data before you save
      evidence for reporting.
    </p>
  </Callout>
);

export default RedactionWarning;
