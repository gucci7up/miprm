const prisma = require('../../lib/prisma');
const { normalizarCedula } = require('../../utils/cedula');
const { MilitanteNoEncontradoError } = require('./comiteMiembro.service');

/**
 * El comite nace de un formulario fisico que un digitador transcribe:
 * primero solo nombre + municipio (+ zona opcional). El coordinador se
 * asigna despues, en una accion separada (ver asignarCoordinador).
 */
async function crearComite({ nombre, municipioId, municipioNombre, provinciaNombre, zonaId, zonaNombre, logo, logoMimeType }) {
  return prisma.comiteAfectivo.create({
    data: {
      nombre,
      municipioId,
      municipioNombre,
      provinciaNombre: provinciaNombre || null,
      zonaId: zonaId || null,
      zonaNombre: zonaNombre || null,
      logo: logo || null,
      logoMimeType: logoMimeType || null,
    },
  });
}

/**
 * Asigna (o reemplaza) al coordinador del comite, identificado por cedula +
 * fecha de nacimiento (debe ser un militante ya registrado). Si ya habia un
 * coordinador, se le quita ese rol antes de asignar el nuevo.
 */
async function asignarCoordinador(comiteId, { cedula, fechaNacimiento }) {
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

    if (comiteActual.coordinadorId) {
      await tx.comiteMiembro.deleteMany({ where: { comiteId, militanteId: comiteActual.coordinadorId, rol: 'COORDINADOR' } });
    }

    // Si la nueva persona ya tenia otra membresia en este mismo comite
    // (ej. era Enlace), se reemplaza por el rol Coordinador.
    await tx.comiteMiembro.deleteMany({ where: { comiteId, militanteId: militante.id } });

    await tx.comiteMiembro.create({
      data: { comiteId, militanteId: militante.id, rol: 'COORDINADOR' },
    });

    return tx.comiteAfectivo.update({
      where: { id: comiteId },
      data: { coordinadorId: militante.id },
      include: { coordinador: { select: { id: true, nombres: true, apellidos: true, cedula: true } } },
    });
  });
}

async function obtenerComite(comiteId) {
  return prisma.comiteAfectivo.findUnique({
    where: { id: comiteId },
    include: {
      coordinador: { select: { id: true, nombres: true, apellidos: true, cedula: true } },
    },
  });
}

/** Info general: nombre, municipio, zona, logo, activar/desactivar. */
async function actualizarInfoGeneral(comiteId, { nombre, municipioId, municipioNombre, provinciaNombre, zonaId, zonaNombre, activo, logo, logoMimeType }) {
  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (municipioId !== undefined) data.municipioId = municipioId;
  if (municipioNombre !== undefined) data.municipioNombre = municipioNombre;
  if (provinciaNombre !== undefined) data.provinciaNombre = provinciaNombre;
  if (zonaId !== undefined) data.zonaId = zonaId;
  if (zonaNombre !== undefined) data.zonaNombre = zonaNombre;
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
      coordinador: { select: { id: true, nombres: true, apellidos: true } },
      _count: { select: { miembros: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { crearComite, asignarCoordinador, obtenerComite, actualizarInfoGeneral, listarComites };
