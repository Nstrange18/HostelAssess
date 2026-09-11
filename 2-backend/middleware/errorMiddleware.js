const env = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let code = error.code && typeof error.code === 'string' ? error.code : 'INTERNAL_ERROR';
  let message = error.message || 'An unexpected error occurred.';

  if (error.name === 'CastError') {
    statusCode = 400; code = 'INVALID_ID'; message = 'The supplied identifier is invalid.';
  }
  if (error.code === 11000) {
    statusCode = 409; code = 'DUPLICATE_RECORD'; message = 'A record with these details already exists.';
  }

  const body = { success: false, code, message };
  if (error.data !== undefined) body.data = error.data;
  if (env.NODE_ENV !== 'production' && statusCode === 500) body.stack = error.stack;
  res.status(statusCode).json(body);
}

module.exports = { notFound, errorHandler };
