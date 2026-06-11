import type {
  ActivityAction,
  ActivityEntityType,
  ActivityId,
  DomainEntityId,
  ISODateString,
} from './common.js';

export interface Activity {
  id: ActivityId;
  entityType: ActivityEntityType;
  entityId?: DomainEntityId;
  action: ActivityAction;
  message: string;
  createdAt: ISODateString;
}
