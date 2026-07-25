import type { ThreatCweMapping } from '../../src/domain/threat.js';

export const selectedThreatCweMappings: ThreatCweMapping[] = [
  {
    id: 'CWE-79',
    name: 'Improper Neutralization of Input During Web Page Generation',
    status: 'Stable',
    deprecated: false,
    primary: true,
    replacementIds: [],
  },
  {
    id: 'CWE-89',
    name: 'Improper Neutralization of Special Elements used in an SQL Command',
    status: 'Stable',
    deprecated: false,
    primary: false,
    replacementIds: [],
  },
];
