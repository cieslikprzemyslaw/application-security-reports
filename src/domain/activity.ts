import type {
  ActivityActorType,
  ActivityEntityType,
  ActivityEventType,
  ActivityId,
  ActivityResult,
  ActivitySeverity,
  ISODateString,
} from './common.js';

export interface ActivityActor {
  type: ActivityActorType;
  id?: string;
}

export interface ActivityResource {
  type: ActivityEntityType;
  id: string;
  companyId?: string;
  assessmentId?: string;
}

export interface Activity {
  id: ActivityId;
  eventType: ActivityEventType;
  result: ActivityResult;
  severity: ActivitySeverity;
  actor: ActivityActor;
  resource: ActivityResource;
  correlationId?: string;
  message: string;
  createdAt: ISODateString;
}

export type AppendActivityInput = Omit<Activity, 'id' | 'createdAt'> & {
  createdAt?: ISODateString;
};
