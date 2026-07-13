const prisma = require('../../lib/prisma');
const { normalizarCedula } = require('../../utils/cedula');

const CAMPOS_PUBLICOS = {
  id: true,
  cedula: true,
  nombres: true,
  apellidos: true,
  alias: true,
  telefono: true,
  whatsapp: true,
  motivacion: true,
  email: true,
  calle: true,
  numeroCasa: true,
  sector: true,
  contactoNombre: true,
  contactoTelefono: true,
  estado: true,
  fechaNacimiento: true,
};

const CAMPOS_EDITABLES = [
  'telefono',
  'whatsapp',
  'motivacion',
  'email',
  'calle',
  'numeroCasa',
  'sector',
  'contactoNombre',
  'contactoTelefono',
];

/**
 * "Consultate": busca por cedula + fecha de nacimiento (verificacion de dos
 * factores). Si la fecha no coincide, se trata igual que "no encontrado"
 * para no revelar si una cedula esta registrada (evita enumeracion).
 */
async function consultar(cedula, fechaNacimiento) {
  const militante = await prisma.militante.findUnique({
    where: { cedula: normalizarCedula(cedula) },
    select: { ...CAMPOS_PUBLICOS, fechaNacimiento: true },
  });

  if (!militante || !militante.fechaNacimiento) {
    return { existe: false };
  }

  const fechaCoincide =
    militante.fechaNacimiento.toISOString().slice(0, 10) ===
    new Date(fechaNacimiento).toISOString().slice(0, 10);

  if (!fechaCoincide) {
    return { existe: false };
  }

  return { existe: true, militante };
}

/** Actualiza solo los campos de contacto/direccion del propio militante (no identidad). */
async function actualizarPerfil(militanteId, datos) {
  const data = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (datos[campo] !== undefined) data[campo] = datos[campo];
  }

  return prisma.militante.update({
    where: { id: militanteId },
    data,
    select: CAMPOS_PUBLICOS,
  });
}

module.exports = { consultar, actualizarPerfil, CAMPOS_EDITABLES };
