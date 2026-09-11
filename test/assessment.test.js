const test = require('node:test');
const assert = require('node:assert/strict');
const Assessment = require('../2-backend/models/Assessment');
const { createAssessmentSchema } = require('../2-backend/validators/assessmentSchemas');
const { calculateOverallRating } = require('../2-backend/utils/assessment');

test('calculates the assessment average on the server', () => {
  assert.equal(calculateOverallRating({ water: 5, electricity: 4, sanitation: 3, security: 5, maintenance: 4 }), 4.2);
});

test('assessment input accepts only integer ratings from 1 to 5', () => {
  const result = createAssessmentSchema.safeParse({ body: { water: 5, electricity: 4, sanitation: 3, security: 2, maintenance: 1, comment: '' }, params: {}, query: {} });
  assert.equal(result.success, true);
  assert.equal(createAssessmentSchema.safeParse({ body: { water: 6, electricity: 4, sanitation: 3, security: 2, maintenance: 1 }, params: {}, query: {} }).success, false);
});

test('assessment input rejects browser-supplied session, student, or hostel', () => {
  const result = createAssessmentSchema.safeParse({ body: { water: 5, electricity: 4, sanitation: 3, security: 2, maintenance: 1, academicSession: '2099/2100' }, params: {}, query: {} });
  assert.equal(result.success, false);
});

test('assessment schema has a unique student-hostel-session index', () => {
  const index = Assessment.schema.indexes().find(([fields]) => fields.student === 1 && fields.hostel === 1 && fields.academicSession === 1);
  assert.ok(index);
  assert.equal(index[1].unique, true);
});
