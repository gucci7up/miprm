require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  return value;
}

module.exports = {
  nodeEnv: required('NODE_ENV', 'development'),
  port: parseInt(required('PORT', '3000'), 10),
  appBaseUrl: required('APP_BASE_URL', 'http://localhost:3000'),

  jwtSecret: required('JWT_SECRET'),
  sessionSecret: required('SESSION_SECRET'),
  jwtExpiresIn: required('JWT_EXPIRES_IN', '7d'),

  storageDriver: required('STORAGE_DRIVER', 'local'),
  uploadsDir: required('UPLOADS_DIR', './uploads'),
  maxUploadMb: parseInt(required('MAX_UPLOAD_MB', '5'), 10),

  smtp: {
    host: required('SMTP_HOST'),
    port: parseInt(required('SMTP_PORT', '587'), 10),
    secure: required('SMTP_SECURE', 'false') === 'true',
    user: required('SMTP_USER'),
    pass: required('SMTP_PASS'),
    from: required('SMTP_FROM', 'MIPRM <no-reply@miprm.org>'),
  },

  twilio: {
    accountSid: required('TWILIO_ACCOUNT_SID'),
    authToken: required('TWILIO_AUTH_TOKEN'),
    fromNumber: required('TWILIO_FROM_NUMBER'),
  },

  loginRateWindowMin: parseInt(required('LOGIN_RATE_WINDOW_MIN', '15'), 10),
  loginRateMaxAttempts: parseInt(required('LOGIN_RATE_MAX_ATTEMPTS', '10'), 10),
};
