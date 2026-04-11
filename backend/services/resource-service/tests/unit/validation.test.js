/**
 * Unit tests — validation middleware (no DB, no HTTP server).
 */
const {
  validateResource,
  validateRating,
  validateObjectId,
} = require('../../src/middleware/validation');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('validation.validateObjectId', () => {
  it('calls next for a 24-char hex id', () => {
    const req = { params: { id: '507f1f77bcf86cd799439011' } };
    const res = mockRes();
    const next = jest.fn();
    validateObjectId(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid id format', () => {
    const req = { params: { id: 'not-an-objectid' } };
    const res = mockRes();
    const next = jest.fn();
    validateObjectId(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ID format' });
  });
});

describe('validation.validateResource', () => {
  const validBody = {
    title: '  My Resource  ',
    description: 'A full description here.',
    type: 'article',
    category: 'communication',
    tags: ['tag-one', 'tag-two'],
  };

  it('calls next when body is valid', () => {
    const req = { body: { ...validBody } };
    const res = mockRes();
    const next = jest.fn();
    validateResource(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 with errors when title missing', () => {
    const req = { body: { ...validBody, title: '   ' } };
    const res = mockRes();
    const next = jest.fn();
    validateResource(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0][0];
    expect(payload.message).toBe('Validation failed');
    expect(payload.errors.some((e) => e.includes('Title'))).toBe(true);
  });

  it('returns 400 when fewer than 2 tags', () => {
    const req = { body: { ...validBody, tags: ['only-one'] } };
    const res = mockRes();
    const next = jest.fn();
    validateResource(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0][0];
    expect(payload.errors.some((e) => e.includes('tags'))).toBe(true);
  });

  it('returns 400 for invalid type', () => {
    const req = { body: { ...validBody, type: 'invalid-type' } };
    const res = mockRes();
    const next = jest.fn();
    validateResource(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validation.validateRating', () => {
  it('calls next for rating 1–5', () => {
    const req = { body: { rating: 4, review: 'Good' } };
    const res = mockRes();
    const next = jest.fn();
    validateRating(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 400 when rating out of range', () => {
    const req = { body: { rating: 6 } };
    const res = mockRes();
    const next = jest.fn();
    validateRating(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when review exceeds 500 chars', () => {
    const req = { body: { rating: 5, review: 'x'.repeat(501) } };
    const res = mockRes();
    const next = jest.fn();
    validateRating(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
