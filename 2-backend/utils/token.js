const jwt = require('jsonwebtoken');
const env = require('../config/env');

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

module.exports = { createToken };
