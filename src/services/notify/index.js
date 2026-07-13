const { sendEmail } = require('./emailProvider');
const { sendSms } = require('./smsProvider');

/**
 * Envia una notificacion al destinatario preferiendo correo si esta disponible,
 * y cayendo a SMS si no hay correo. Ambos proveedores caen a consola en dev
 * si no hay credenciales configuradas (ver emailProvider/smsProvider).
 */
async function notifyUser({ email, telefono, subject, message }) {
  if (email) {
    return sendEmail({ to: email, subject, text: message });
  }
  if (telefono) {
    return sendSms({ to: telefono, body: `${subject}: ${message}` });
  }
  throw new Error('notifyUser: se requiere email o telefono para notificar');
}

async function sendCredentials({ email, telefono, cedula, password }) {
  const subject = 'Tus credenciales de acceso - MIPRM';
  const message = `Cedula: ${cedula}\nContrasena temporal: ${password}\nInicia sesion y cambia tu contrasena lo antes posible.`;
  return notifyUser({ email, telefono, subject, message });
}

async function sendPasswordReset({ email, telefono, password }) {
  const subject = 'Restablecimiento de contrasena - MIPRM';
  const message = `Tu nueva contrasena temporal es: ${password}`;
  return notifyUser({ email, telefono, subject, message });
}

async function sendValidationStatus({ email, telefono, aprobado }) {
  const subject = 'Estado de validacion de identidad - MIPRM';
  const message = aprobado
    ? 'Tu identidad ha sido validada. Ya eres miembro validado.'
    : 'Tu validacion de identidad fue rechazada. Por favor vuelve a subir tus documentos.';
  return notifyUser({ email, telefono, subject, message });
}

module.exports = {
  notifyUser,
  sendCredentials,
  sendPasswordReset,
  sendValidationStatus,
};
