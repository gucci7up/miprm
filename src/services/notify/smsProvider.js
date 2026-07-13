const env = require('../../config/env');

function isConfigured() {
  return Boolean(env.twilio.accountSid && env.twilio.authToken && env.twilio.fromNumber);
}

let client = null;
function getClient() {
  if (!client) {
    const twilio = require('twilio');
    client = twilio(env.twilio.accountSid, env.twilio.authToken);
  }
  return client;
}

async function sendSms({ to, body }) {
  if (!isConfigured()) {
    console.log(`[notify:sms:console] Para: ${to}\n${body}`);
    return { provider: 'console', ok: true };
  }

  await getClient().messages.create({ to, from: env.twilio.fromNumber, body });
  return { provider: 'twilio', ok: true };
}

module.exports = { sendSms, isConfigured };
