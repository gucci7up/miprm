const prisma = require('../../lib/prisma');

async function crearActividad(comiteId, { nombre, descripcion, fechaInicio, fechaFin, imagen, imagenMimeType }) {
  return prisma.comiteActividad.create({
    data: {
      comiteId,
      nombre,
      descripcion: descripcion || null,
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      imagen: imagen || null,
      imagenMimeType: imagenMimeType || null,
    },
  });
}

async function listarActividades(comiteId) {
  return prisma.comiteActividad.findMany({
    where: { comiteId },
    orderBy: { fechaInicio: 'desc' },
  });
}

async function obtenerActividad(actividadId) {
  return prisma.comiteActividad.findUnique({ where: { id: actividadId } });
}

module.exports = { crearActividad, listarActividades, obtenerActividad };
