const nodemailer = require('nodemailer');
const env = require('../../config/env');

function isConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  if (!isConfigured()) {
    console.log(`[notify:email:console] Para: ${to} | Asunto: ${subject}\n${text || html}`);
    return { provider: 'console', ok: true };
  }

  await getTransporter().sendMail({ from: env.smtp.from, to, subject, text, html });
  return { provider: 'smtp', ok: true };
}

module.exports = { sendEmail, isConfigured };
