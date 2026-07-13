const prisma = require('../../lib/prisma');
const { sendValidationStatus } = require('../notify');

async function listarValidacionesPendientes() {
  return prisma.validacionIdentidad.findMany({
    where: { estado: 'PENDIENTE' },
    include: { militante: { select: { id: true, cedula: true, nombres: true, apellidos: true, telefono: true, email: true } } },
    orderBy: { fechaSolicitud: 'asc' },
  });
}

async function obtenerValidacion(validacionId) {
  return prisma.validacionIdentidad.findUnique({
    where: { id: validacionId },
    include: { militante: true },
  });
}

async function aprobarValidacion(validacionId, adminIdentificador) {
  const validacion = await prisma.validacionIdentidad.findUnique({ where: { id: validacionId } });
  if (!validacion) throw new Error('Validacion no encontrada');

  const [, militante] = await prisma.$transaction([
    prisma.validacionIdentidad.update({
      where: { id: validacionId },
      data: { estado: 'APROBADA', fechaResolucion: new Date(), revisadoPorAdmin: adminIdentificador },
    }),
    prisma.militante.update({
      where: { id: validacion.militanteId },
      data: { estado: 'VALIDADO' },
    }),
  ]);

  await sendValidationStatus({ email: militante.email, telefono: militante.telefono, aprobado: true });
  return militante;
}

async function rechazarValidacion(validacionId, adminIdentificador, comentario) {
  const validacion = await prisma.validacionIdentidad.findUnique({ where: { id: validacionId } });
  if (!validacion) throw new Error('Validacion no encontrada');

  const [, militante] = await prisma.$transaction([
    prisma.validacionIdentidad.update({
      where: { id: validacionId },
      data: { estado: 'RECHAZADA', fechaResolucion: new Date(), revisadoPorAdmin: adminIdentificador, comentario: comentario || null },
    }),
    prisma.militante.update({
      where: { id: validacion.militanteId },
      data: { estado: 'REGISTRADO' }, // puede volver a intentar la validacion
    }),
  ]);

  await sendValidationStatus({ email: militante.email, telefono: militante.telefono, aprobado: false });
  return militante;
}

async function estadisticas() {
  const [totalMilitantes, totalComites, comitesPorProvincia, militantesPorEstado] = await Promise.all([
    prisma.militante.count(),
    prisma.comiteAfectivo.count(),
    prisma.comiteAfectivo.groupBy({
      by: ['provinciaNombre'],
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.militante.groupBy({
      by: ['estado'],
      _count: { _all: true },
    }),
  ]);

  return {
    totalMilitantes,
    totalComites,
    comitesPorProvincia: comitesPorProvincia.map((r) => ({
      provincia: r.provinciaNombre || 'Sin especificar',
      total: r._count._all,
    })),
    militantesPorEstado: militantesPorEstado.map((r) => ({ estado: r.estado, total: r._count._all })),
  };
}

async function listarTodosMilitantes() {
  return prisma.militante.findMany({
    select: {
      id: true,
      cedula: true,
      nombres: true,
      apellidos: true,
      telefono: true,
      email: true,
      estado: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function listarTodosComites() {
  return prisma.comiteAfectivo.findMany({
    include: {
      coordinador: { select: { nombres: true, apellidos: true, cedula: true } },
      _count: { select: { miembros: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = {
  listarValidacionesPendientes,
  obtenerValidacion,
  aprobarValidacion,
  rechazarValidacion,
  estadisticas,
  listarTodosMilitantes,
  listarTodosComites,
};
