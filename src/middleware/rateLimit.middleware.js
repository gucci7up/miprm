const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const loginLimiter = rateLimit({
  windowMs: env.loginRateWindowMin * 60 * 1000,
  max: env.loginRateMaxAttempts,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesion. Intenta de nuevo mas tarde.' },
});

module.exports = { loginLimiter };
