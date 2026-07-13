const prisma = require('../../lib/prisma');
const { normalizarCedula } = require('../../utils/cedula');
const { MilitanteNoEncontradoError } = require('./comiteMiembro.service');

/**
 * El comite nace de un formulario fisico que un digitador transcribe: el
 * presidente es una persona real identificada por cedula + fecha de
 * nacimiento (ya debe existir como militante registrado), no
 * necesariamente quien esta usando el sistema en ese momento.
 */
async function crearComite({ nombre, municipioId, municipioNombre, provinciaNombre, presidenteCedula, presidenteFechaNacimiento, logo, logoMimeType }) {
  const presidente = await prisma.militante.findUnique({
    where: { cedula: normalizarCedula(presidenteCedula) },
  });

  const fechaCoincide =
    presidente &&
    presidente.fechaNacimiento &&
    presidente.fechaNacimiento.toISOString().slice(0, 10) === new Date(presidenteFechaNacimiento).toISOString().slice(0, 10);

  if (!presidente || !fechaCoincide) {
    throw new MilitanteNoEncontradoError();
  }

  return prisma.$transaction(async (tx) => {
    const comite = await tx.comiteAfectivo.create({
      data: {
        nombre,
        municipioId,
        municipioNombre,
        provinciaNombre: provinciaNombre || null,
        presidenteId: presidente.id,
        logo: logo || null,
        logoMimeType: logoMimeType || null,
      },
    });

    // El presidente tambien queda registrado en comite_miembros, para que
    // las consultas de "mis membresias" tengan una sola fuente de verdad.
    await tx.comiteMiembro.create({
      data: { comiteId: comite.id, militanteId: presidente.id, rol: 'PRESIDENTE' },
    });

    return comite;
  });
}

async function obtenerComite(comiteId) {
  return prisma.comiteAfectivo.findUnique({
    where: { id: comiteId },
    include: {
      presidente: { select: { id: true, nombres: true, apellidos: true, cedula: true } },
    },
  });
}

/** Info general: nombre, municipio, logo, activar/desactivar. */
async function actualizarInfoGeneral(comiteId, { nombre, municipioId, municipioNombre, provinciaNombre, activo, logo, logoMimeType }) {
  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (municipioId !== undefined) data.municipioId = municipioId;
  if (municipioNombre !== undefined) data.municipioNombre = municipioNombre;
  if (provinciaNombre !== undefined) data.provinciaNombre = provinciaNombre;
  if (activo !== undefined) data.activo = activo;
  if (logo !== undefined) data.logo = logo;
  if (logoMimeType !== undefined) data.logoMimeType = logoMimeType;

  return prisma.comiteAfectivo.update({ where: { id: comiteId }, data });
}

/** Listado de comites activos, filtrable por municipio (para "Tablero de miembros" y admin). */
async function listarComites({ municipioId, provinciaNombre, soloActivos = true } = {}) {
  return prisma.comiteAfectivo.findMany({
    where: {
      ...(soloActivos ? { activo: true } : {}),
      ...(municipioId ? { municipioId } : {}),
      ...(provinciaNombre ? { provinciaNombre } : {}),
    },
    include: {
      presidente: { select: { id: true, nombres: true, apellidos: true } },
      _count: { select: { miembros: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { crearComite, obtenerComite, actualizarInfoGeneral, listarComites };
