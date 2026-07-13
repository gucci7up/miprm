const crypto = require('crypto');

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/** Genera una contrasena temporal legible (sin caracteres ambiguos como 0/O, 1/l/I). */
function generarPasswordTemporal(longitud = 10) {
  let password = '';
  const bytes = crypto.randomBytes(longitud);
  for (let i = 0; i < longitud; i++) {
    password += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return password;
}

module.exports = { generarPasswordTemporal };
