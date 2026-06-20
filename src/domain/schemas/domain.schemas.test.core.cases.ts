import {
  ASSESSMENT_STATUSES,
  DATE_FORMATS,
  SEVERITIES,
  STRIDE_CATEGORIES,
  THEME_PREFERENCES,
  THREAT_STATUSES,
  assertInvalid,
  assertValid,
  assessmentSchema,
  assessmentStatusSchema,
  companyPublicSchema,
  companySchema,
  dateFormatSchema,
  expectField,
  getFieldErrors,
  isoDateStringSchema,
  isoDateTimeStringSchema,
  severitySchema,
  strideCategorySchema,
  themePreferenceSchema,
  threatSchema,
  threatStatusSchema,
  timestampSchema,
  validAssessment,
  validCompany,
  validCompanyPublic,
  validThreat,
} from './domain.schemas.test.support.js';

for (const validDate of ['2026-06-11', '2024-02-29']) {
  assertValid(
    isoDateStringSchema.safeParse(validDate).success,
    `Calendar date ${validDate} should pass`,
  );
}

for (const validDatetime of ['2026-06-11T12:30:00.000Z']) {
  assertValid(
    isoDateTimeStringSchema.safeParse(validDatetime).success,
    `Datetime ${validDatetime} should pass`,
  );
  assertValid(
    timestampSchema.safeParse(validDatetime).success,
    `Timestamp ${validDatetime} should pass`,
  );
}

for (const invalidDate of [
  '2026-99-99',
  '2026-13-01',
  '2026-00-10',
  '2026-02-30',
  '2025-02-29',
  'not-a-date',
]) {
  assertInvalid(
    isoDateStringSchema.safeParse(invalidDate).success,
    `Calendar date ${invalidDate} should fail`,
  );
}

assertInvalid(
  isoDateStringSchema.safeParse('2026-06-11T12:30:00.000Z').success,
  'Datetime must not pass the date-only schema',
);
assertInvalid(
  timestampSchema.safeParse('2026-06-11').success,
  'Date-only values must not pass the timestamp schema',
);

for (const severity of SEVERITIES) {
  assertValid(
    severitySchema.safeParse(severity).success,
    `Severity ${severity} should pass`,
  );
}
assertInvalid(
  severitySchema.safeParse('extreme').success,
  'Unknown severity should fail',
);

for (const strideCategory of STRIDE_CATEGORIES) {
  assertValid(
    strideCategorySchema.safeParse(strideCategory).success,
    `STRIDE ${strideCategory} should pass`,
  );
}
assertInvalid(
  strideCategorySchema.safeParse('privilege-escalation').success,
  'Unknown STRIDE category should fail',
);

for (const status of ASSESSMENT_STATUSES) {
  assertValid(
    assessmentStatusSchema.safeParse(status).success,
    `Assessment status ${status} should pass`,
  );
}
assertInvalid(
  assessmentStatusSchema.safeParse('accepted-risk').success,
  'Accepted-risk must fail as assessment status',
);

for (const status of THREAT_STATUSES) {
  assertValid(
    threatStatusSchema.safeParse(status).success,
    `Threat status ${status} should pass`,
  );
}
assertValid(
  threatStatusSchema.safeParse('accepted-risk').success,
  'Accepted-risk should pass as threat status',
);
assertInvalid(
  threatStatusSchema.safeParse('accepted').success,
  'Accepted should fail as threat status',
);

for (const preference of THEME_PREFERENCES) {
  assertValid(
    themePreferenceSchema.safeParse(preference).success,
    `Theme preference ${preference} should pass`,
  );
}

for (const format of DATE_FORMATS) {
  assertValid(
    dateFormatSchema.safeParse(format).success,
    `Date format ${format} should pass`,
  );
}

assertValid(
  companySchema.safeParse(validCompany).success,
  'Valid company should pass',
);
assertValid(
  companyPublicSchema.safeParse(validCompanyPublic).success,
  'Valid public company should pass',
);
expectField(
  getFieldErrors(companySchema, { ...validCompany, isAdmin: true }),
  'isAdmin',
  'Unknown property',
);
expectField(
  getFieldErrors(companySchema, { ...validCompany, name: '' }),
  'name',
  'Text is required',
);
expectField(
  getFieldErrors(companySchema, { ...validCompany, contactEmail: 'bad-email' }),
  'contactEmail',
  'Invalid email',
);
expectField(
  getFieldErrors(companySchema, { ...validCompany, website: 'not-a-url' }),
  'website',
  'Invalid url',
);
expectField(
  getFieldErrors(companyPublicSchema, {
    ...validCompanyPublic,
    unknownField: '/logos/northstar.svg',
  }),
  'unknownField',
  'Unknown property',
);

assertValid(
  assessmentSchema.safeParse(validAssessment).success,
  'Valid assessment should pass',
);
assertValid(
  assessmentSchema.safeParse({
    ...validAssessment,
    applicationName: null,
  }).success,
  'Historical assessment with null application name should pass',
);
expectField(
  getFieldErrors(assessmentSchema, {
    ...validAssessment,
    applicationName: undefined,
  }),
  'applicationName',
  'Required',
);
expectField(
  getFieldErrors(assessmentSchema, { ...validAssessment, companyId: '' }),
  'companyId',
  'ID is required',
);
expectField(
  getFieldErrors(assessmentSchema, {
    ...validAssessment,
    status: 'accepted-risk',
  }),
  'status',
  'Invalid enum value',
);
expectField(
  getFieldErrors(assessmentSchema, {
    ...validAssessment,
    startedAt: '06/01/2026',
  }),
  'startedAt',
  'Invalid ISO date string',
);
expectField(
  getFieldErrors(assessmentSchema, {
    ...validAssessment,
    completedAt: '2026-02-30',
  }),
  'completedAt',
  'Invalid ISO date string',
);

assertValid(
  threatSchema.safeParse(validThreat).success,
  'Valid threat should pass',
);
assertValid(
  threatSchema.safeParse({ ...validThreat, strideCategories: ['spoofing'] })
    .success,
  'Single STRIDE category should pass',
);
expectField(
  getFieldErrors(threatSchema, { ...validThreat, strideCategories: [] }),
  'strideCategories',
  'Array must contain at least 1 element',
);
