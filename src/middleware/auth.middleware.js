const prisma = require('../lib/prisma');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.militanteId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
}

/**
 * requireAdmin y requireValidado consultan el rol/estado FRESCO desde la BD
 * en cada request, en vez de confiar en el valor cacheado en la sesion al
 * momento del login. Sin esto, un cambio de rol/estado (ej. un admin
 * aprobando una validacion, o revocando un rol de admin) no tendria efecto
 * hasta que el usuario afectado cierre sesion y vuelva a entrar.
 */
async function requireAdmin(req, res, next) {
  if (!req.session || !req.session.militanteId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  try {
    const militante = await prisma.militante.findUnique({
      where: { id: req.session.militanteId },
      select: { rolGlobal: true },
    });
    if (!militante || militante.rolGlobal !== 'ADMIN') {
      return res.status(403).json({ error: 'Requiere rol de administrador' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

async function requireValidado(req, res, next) {
  if (!req.session || !req.session.militanteId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  try {
    const militante = await prisma.militante.findUnique({
      where: { id: req.session.militanteId },
      select: { estado: true },
    });
    if (!militante || militante.estado !== 'VALIDADO') {
      return res.status(403).json({ error: 'Tu identidad debe estar validada para realizar esta accion' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, requireAdmin, requireValidado };
