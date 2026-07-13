const prisma = require('../../lib/prisma');
const { normalizarCedula } = require('../../utils/cedula');

class LimiteComiteAdicionalError extends Error {
  constructor() {
    super(
      'Este militante ya pertenece a otro comite con rol de Enlace o Miembro. ' +
        'Solo se permite un comite adicional a los que coordina.'
    );
    this.name = 'LimiteComiteAdicionalError';
  }
}

class YaEsMiembroError extends Error {
  constructor() {
    super('Este militante ya pertenece a este comite');
    this.name = 'YaEsMiembroError';
  }
}

class MilitanteNoEncontradoError extends Error {
  constructor() {
    super('No se encontro un militante registrado con esa cedula y fecha de nacimiento');
    this.name = 'MilitanteNoEncontradoError';
  }
}

const ROLES_LIMITADOS = ['ENLACE', 'MIEMBRO'];

/**
 * Regla de negocio central: un militante puede coordinar multiples comites,
 * pero solo puede pertenecer con rol Enlace o Miembro a UN comite
 * adicional en total (sin importar cual). Se valida aqui, en el backend,
 * no solo en el frontend.
 */
async function validarLimiteComiteAdicional(militanteId, comiteId, rol) {
  if (!ROLES_LIMITADOS.includes(rol)) return;

  const otraMembresia = await prisma.comiteMiembro.findFirst({
    where: {
      militanteId,
      rol: { in: ROLES_LIMITADOS },
      comiteId: { not: comiteId },
    },
  });

  if (otraMembresia) {
    throw new LimiteComiteAdicionalError();
  }
}

/** Agregar miembro por cedula + fecha de nacimiento (Coordinador/Enlace del comite). */
async function agregarMiembroPorCedula(comiteId, { cedula, fechaNacimiento, rol }) {
  const militante = await prisma.militante.findUnique({
    where: { cedula: normalizarCedula(cedula) },
  });

  const fechaCoincide =
    militante &&
    militante.fechaNacimiento &&
    militante.fechaNacimiento.toISOString().slice(0, 10) === new Date(fechaNacimiento).toISOString().slice(0, 10);

  if (!militante || !fechaCoincide) {
    throw new MilitanteNoEncontradoError();
  }

  const yaEsMiembro = await prisma.comiteMiembro.findUnique({
    where: { comiteId_militanteId: { comiteId, militanteId: militante.id } },
  });
  if (yaEsMiembro) throw new YaEsMiembroError();

  await validarLimiteComiteAdicional(militante.id, comiteId, rol);

  return prisma.comiteMiembro.create({
    data: { comiteId, militanteId: militante.id, rol },
    include: { militante: { select: { id: true, cedula: true, nombres: true, apellidos: true } } },
  });
}

/** Autoafiliacion desde el "Tablero de miembros" ("Afiliarme a este comite"). Siempre rol Miembro. */
async function afiliarme(comiteId, militanteId) {
  const yaEsMiembro = await prisma.comiteMiembro.findUnique({
    where: { comiteId_militanteId: { comiteId, militanteId } },
  });
  if (yaEsMiembro) throw new YaEsMiembroError();

  await validarLimiteComiteAdicional(militanteId, comiteId, 'MIEMBRO');

  return prisma.comiteMiembro.create({ data: { comiteId, militanteId, rol: 'MIEMBRO' } });
}

async function eliminarMiembro(comiteId, miembroId) {
  const miembro = await prisma.comiteMiembro.findUnique({ where: { id: miembroId } });
  if (!miembro || miembro.comiteId !== comiteId) {
    throw new Error('Miembro no encontrado en este comite');
  }
  if (miembro.rol === 'COORDINADOR') {
    throw new Error('No se puede eliminar al coordinador del comite');
  }
  return prisma.comiteMiembro.delete({ where: { id: miembroId } });
}

async function listarMiembros(comiteId) {
  return prisma.comiteMiembro.findMany({
    where: { comiteId },
    include: { militante: { select: { id: true, cedula: true, nombres: true, apellidos: true, telefono: true } } },
    orderBy: [{ rol: 'asc' }, { fechaAsignacion: 'asc' }],
  });
}

/** "Tablero de miembros": listado de las propias afiliaciones del militante. */
async function misComites(militanteId) {
  return prisma.comiteMiembro.findMany({
    where: { militanteId },
    include: { comite: true },
    orderBy: { fechaAsignacion: 'desc' },
  });
}

module.exports = {
  agregarMiembroPorCedula,
  afiliarme,
  eliminarMiembro,
  listarMiembros,
  misComites,
  validarLimiteComiteAdicional,
  LimiteComiteAdicionalError,
  YaEsMiembroError,
  MilitanteNoEncontradoError,
};
