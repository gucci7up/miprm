function requireAuth(req, res, next) {
  if (!req.session || !req.session.militanteId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.militanteId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (req.session.rolGlobal !== 'ADMIN') {
    return res.status(403).json({ error: 'Requiere rol de administrador' });
  }
  next();
}

function requireValidado(req, res, next) {
  if (!req.session || !req.session.militanteId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (req.session.estado !== 'VALIDADO') {
    return res.status(403).json({ error: 'Tu identidad debe estar validada para realizar esta accion' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireValidado };
