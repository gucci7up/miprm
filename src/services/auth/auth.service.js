const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');
const { normalizarCedula } = require('../../utils/cedula');
const { generarPasswordTemporal } = require('../../utils/password');
const { sendCredentials, sendPasswordReset } = require('../notify');

const SALT_ROUNDS = 10;

class CedulaDuplicadaError extends Error {
  constructor() {
    super('Ya existe un militante registrado con esta cedula');
    this.name = 'CedulaDuplicadaError';
  }
}

class MilitanteNoEncontradoError extends Error {
  constructor() {
    super('No existe un militante con esta cedula');
    this.name = 'MilitanteNoEncontradoError';
  }
}

/**
 * Inscripcion de un nuevo militante ("Inscribete"). Genera una contrasena
 * temporal y la envia por correo (o SMS si no hay correo) via el servicio
 * de notificaciones.
 */
async function registrarMilitante(datos) {
  const cedula = normalizarCedula(datos.cedula);

  const existente = await prisma.militante.findUnique({ where: { cedula } });
  if (existente) {
    throw new CedulaDuplicadaError();
  }

  const passwordTemporal = generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(passwordTemporal, SALT_ROUNDS);

  const militante = await prisma.militante.create({
    data: {
      cedula,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      alias: datos.alias || null,
      telefono: datos.telefono,
      whatsapp: datos.whatsapp || null,
      motivacion: datos.motivacion || null,
      email: datos.email || null,
      calle: datos.calle || null,
      numeroCasa: datos.numeroCasa || null,
      sector: datos.sector || null,
      contactoNombre: datos.contactoNombre || null,
      contactoTelefono: datos.contactoTelefono || null,
      fechaNacimiento: datos.fechaNacimiento ? new Date(datos.fechaNacimiento) : null,
      passwordHash,
      registradoPorId: datos.registradoPorId || null,
    },
  });

  await sendCredentials({
    email: militante.email,
    telefono: militante.telefono,
    cedula: militante.cedula,
    password: passwordTemporal,
  });

  return militante;
}

/** Verifica cedula + password. Devuelve el militante si son correctos, null si no. */
async function login(cedula, password) {
  const militante = await prisma.militante.findUnique({
    where: { cedula: normalizarCedula(cedula) },
  });
  if (!militante) return null;

  const passwordValido = await bcrypt.compare(password, militante.passwordHash);
  if (!passwordValido) return null;

  await prisma.militante.update({
    where: { id: militante.id },
    data: { ultimoAcceso: new Date() },
  });

  return militante;
}

/** Genera una nueva contrasena temporal y la envia por correo/SMS. */
async function resetPassword(cedula) {
  const militante = await prisma.militante.findUnique({
    where: { cedula: normalizarCedula(cedula) },
  });
  if (!militante) {
    throw new MilitanteNoEncontradoError();
  }

  const passwordTemporal = generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(passwordTemporal, SALT_ROUNDS);

  await prisma.militante.update({
    where: { id: militante.id },
    data: { passwordHash },
  });

  await sendPasswordReset({
    email: militante.email,
    telefono: militante.telefono,
    password: passwordTemporal,
  });

  return true;
}

module.exports = {
  registrarMilitante,
  login,
  resetPassword,
  CedulaDuplicadaError,
  MilitanteNoEncontradoError,
};
