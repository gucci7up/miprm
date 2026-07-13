const prisma = require('../lib/prisma');

/** Solo el coordinador del comite puede continuar (editar info general, eliminar miembros). */
async function requireComiteCoordinador(req, res, next) {
  try {
    const comiteId = parseInt(req.params.id, 10);
    const comite = await prisma.comiteAfectivo.findUnique({ where: { id: comiteId } });
    if (!comite) return res.status(404).json({ error: 'Comite no encontrado' });
    if (comite.coordinadorId !== req.session.militanteId) {
      return res.status(403).json({ error: 'Solo el coordinador del comite puede realizar esta accion' });
    }
    req.comite = comite;
    next();
  } catch (err) {
    next(err);
  }
}

/** El coordinador o el enlace del comite pueden continuar (agregar miembros/actividades). */
async function requireComiteGestor(req, res, next) {
  try {
    const comiteId = parseInt(req.params.id, 10);
    const comite = await prisma.comiteAfectivo.findUnique({ where: { id: comiteId } });
    if (!comite) return res.status(404).json({ error: 'Comite no encontrado' });

    if (comite.coordinadorId === req.session.militanteId) {
      req.comite = comite;
      return next();
    }

    const membresia = await prisma.comiteMiembro.findUnique({
      where: { comiteId_militanteId: { comiteId, militanteId: req.session.militanteId } },
    });
    if (membresia && membresia.rol === 'ENLACE') {
      req.comite = comite;
      return next();
    }

    return res.status(403).json({ error: 'Solo el coordinador o enlace del comite pueden realizar esta accion' });
  } catch (err) {
    next(err);
  }
}

/** Cualquier miembro del comite (o el coordinador) puede continuar (ver actividades/detalle). */
async function requireComiteMiembro(req, res, next) {
  try {
    const comiteId = parseInt(req.params.id, 10);
    const comite = await prisma.comiteAfectivo.findUnique({ where: { id: comiteId } });
    if (!comite) return res.status(404).json({ error: 'Comite no encontrado' });

    if (comite.coordinadorId === req.session.militanteId) {
      req.comite = comite;
      return next();
    }

    const membresia = await prisma.comiteMiembro.findUnique({
      where: { comiteId_militanteId: { comiteId, militanteId: req.session.militanteId } },
    });
    if (membresia) {
      req.comite = comite;
      return next();
    }

    return res.status(403).json({ error: 'No perteneces a este comite' });
  } catch (err) {
    next(err);
  }
}

module.exports = { requireComiteCoordinador, requireComiteGestor, requireComiteMiembro };
