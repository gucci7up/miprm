const prisma = require('../../lib/prisma');
const { normalizarCedula } = require('../../utils/cedula');
const { MilitanteNoEncontradoError } = require('./comiteMiembro.service');

/**
 * El comite nace de un formulario fisico que un digitador transcribe:
 * primero solo nombre + municipio. El presidente se asigna despues, en una
 * accion separada (ver asignarPresidente), igual que el patron de
 * "coordinador" del sistema de referencia.
 */
async function crearComite({ nombre, municipioId, municipioNombre, provinciaNombre, logo, logoMimeType }) {
  return prisma.comiteAfectivo.create({
    data: {
      nombre,
      municipioId,
      municipioNombre,
      provinciaNombre: provinciaNombre || null,
      logo: logo || null,
      logoMimeType: logoMimeType || null,
    },
  });
}

/**
 * Asigna (o reemplaza) al presidente del comite, identificado por cedula +
 * fecha de nacimiento (debe ser un militante ya registrado). Si ya habia un
 * presidente, se le quita ese rol antes de asignar el nuevo.
 */
async function asignarPresidente(comiteId, { cedula, fechaNacimiento }) {
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

  return prisma.$transaction(async (tx) => {
    const comiteActual = await tx.comiteAfectivo.findUnique({ where: { id: comiteId } });
    if (!comiteActual) throw new Error('Comite no encontrado');

    if (comiteActual.presidenteId) {
      await tx.comiteMiembro.deleteMany({ where: { comiteId, militanteId: comiteActual.presidenteId, rol: 'PRESIDENTE' } });
    }

    // Si la nueva persona ya tenia otra membresia en este mismo comite
    // (ej. era Secretario), se reemplaza por el rol Presidente.
    await tx.comiteMiembro.deleteMany({ where: { comiteId, militanteId: militante.id } });

    await tx.comiteMiembro.create({
      data: { comiteId, militanteId: militante.id, rol: 'PRESIDENTE' },
    });

    return tx.comiteAfectivo.update({
      where: { id: comiteId },
      data: { presidenteId: militante.id },
      include: { presidente: { select: { id: true, nombres: true, apellidos: true, cedula: true } } },
    });
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

module.exports = { crearComite, asignarPresidente, obtenerComite, actualizarInfoGeneral, listarComites };
