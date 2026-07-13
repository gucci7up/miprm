const prisma = require('../lib/prisma');

/** Solo el presidente del comite puede continuar (editar info general, eliminar miembros). */
async function requireComitePresidente(req, res, next) {
  try {
    const comiteId = parseInt(req.params.id, 10);
    const comite = await prisma.comiteAfectivo.findUnique({ where: { id: comiteId } });
    if (!comite) return res.status(404).json({ error: 'Comite no encontrado' });
    if (comite.presidenteId !== req.session.militanteId) {
      return res.status(403).json({ error: 'Solo el presidente del comite puede realizar esta accion' });
    }
    req.comite = comite;
    next();
  } catch (err) {
    next(err);
  }
}

/** El presidente o el secretario del comite pueden continuar (agregar miembros/actividades). */
async function requireComiteGestor(req, res, next) {
  try {
    const comiteId = parseInt(req.params.id, 10);
    const comite = await prisma.comiteAfectivo.findUnique({ where: { id: comiteId } });
    if (!comite) return res.status(404).json({ error: 'Comite no encontrado' });

    if (comite.presidenteId === req.session.militanteId) {
      req.comite = comite;
      return next();
    }

    const membresia = await prisma.comiteMiembro.findUnique({
      where: { comiteId_militanteId: { comiteId, militanteId: req.session.militanteId } },
    });
    if (membresia && membresia.rol === 'SECRETARIO') {
      req.comite = comite;
      return next();
    }

    return res.status(403).json({ error: 'Solo el presidente o secretario del comite pueden realizar esta accion' });
  } catch (err) {
    next(err);
  }
}

/** Cualquier miembro del comite (o el presidente) puede continuar (ver actividades/detalle). */
async function requireComiteMiembro(req, res, next) {
  try {
    const comiteId = parseInt(req.params.id, 10);
    const comite = await prisma.comiteAfectivo.findUnique({ where: { id: comiteId } });
    if (!comite) return res.status(404).json({ error: 'Comite no encontrado' });

    if (comite.presidenteId === req.session.militanteId) {
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

module.exports = { requireComitePresidente, requireComiteGestor, requireComiteMiembro };
