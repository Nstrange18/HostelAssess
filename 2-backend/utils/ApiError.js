class ApiError extends Error {
  constructor(statusCode, message, code = 'REQUEST_FAILED', data) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
  }
}

module.exports = ApiError;
