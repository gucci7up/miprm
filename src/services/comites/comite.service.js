const prisma = require('../../lib/prisma');

async function crearComite({ nombre, municipioId, municipioNombre, provinciaNombre, presidenteId, logo, logoMimeType }) {
  return prisma.$transaction(async (tx) => {
    const comite = await tx.comiteAfectivo.create({
      data: {
        nombre,
        municipioId,
        municipioNombre,
        provinciaNombre: provinciaNombre || null,
        presidenteId,
        logo: logo || null,
        logoMimeType: logoMimeType || null,
      },
    });

    // El presidente tambien queda registrado en comite_miembros, para que
    // las consultas de "mis membresias" tengan una sola fuente de verdad.
    await tx.comiteMiembro.create({
      data: { comiteId: comite.id, militanteId: presidenteId, rol: 'PRESIDENTE' },
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
