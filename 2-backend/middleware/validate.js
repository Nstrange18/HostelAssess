const ApiError = require('../utils/ApiError');

function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!parsed.success) {
      return next(new ApiError(400, parsed.error.issues[0].message, 'VALIDATION_ERROR', { issues: parsed.error.issues }));
    }
    req.validated = parsed.data;
    next();
  };
}

module.exports = validate;
