const prisma = require('../../lib/prisma');

class ValidacionYaExisteError extends Error {
  constructor() {
    super('Ya existe una solicitud de validacion pendiente para este militante');
    this.name = 'ValidacionYaExisteError';
  }
}

/**
 * Crea la solicitud de validacion de identidad (fotos de cedula + selfie) y
 * marca al militante como PENDIENTE_VALIDACION. SLA simulado de 24-48h,
 * la aprobacion/rechazo la hace un admin manualmente (ver /admin).
 */
async function crearSolicitud(militanteId, { fotoCedulaFrente, fotoCedulaFrenteMimeType, fotoCedulaDorso, fotoCedulaDorsoMimeType, selfie, selfieMimeType }) {
  const pendiente = await prisma.validacionIdentidad.findFirst({
    where: { militanteId, estado: 'PENDIENTE' },
  });
  if (pendiente) throw new ValidacionYaExisteError();

  return prisma.$transaction(async (tx) => {
    const validacion = await tx.validacionIdentidad.create({
      data: {
        militanteId,
        fotoCedulaFrente,
        fotoCedulaFrenteMimeType,
        fotoCedulaDorso,
        fotoCedulaDorsoMimeType,
        selfie,
        selfieMimeType,
      },
    });

    await tx.militante.update({
      where: { id: militanteId },
      data: { estado: 'PENDIENTE_VALIDACION' },
    });

    return validacion;
  });
}

async function obtenerUltimaSolicitud(militanteId) {
  return prisma.validacionIdentidad.findFirst({
    where: { militanteId },
    orderBy: { fechaSolicitud: 'desc' },
    select: {
      id: true,
      estado: true,
      comentario: true,
      fechaSolicitud: true,
      fechaResolucion: true,
    },
  });
}

module.exports = { crearSolicitud, obtenerUltimaSolicitud, ValidacionYaExisteError };
