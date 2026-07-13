const authService = require('../services/auth/auth.service');
const { esCedulaValida } = require('../utils/cedula');

async function postRegistro(req, res, next) {
  try {
    const { cedula, nombres, apellidos, telefono, email, confirmarEmail } = req.body;

    if (!esCedulaValida(cedula)) {
      return res.status(400).json({ error: 'La cedula debe tener 11 digitos' });
    }
    if (!nombres || !apellidos || !telefono) {
      return res.status(400).json({ error: 'Nombres, apellidos y telefono son obligatorios' });
    }
    if (email && email !== confirmarEmail) {
      return res.status(400).json({ error: 'El correo y su confirmacion no coinciden' });
    }

    const militante = await authService.registrarMilitante(req.body);

    return res.status(201).json({
      message: 'Registro exitoso. Revisa tu correo o telefono para tu contrasena de acceso.',
      militante: {
        id: militante.id,
        cedula: militante.cedula,
        nombres: militante.nombres,
        apellidos: militante.apellidos,
        estado: militante.estado,
      },
    });
  } catch (err) {
    if (err instanceof authService.CedulaDuplicadaError) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

async function postLogin(req, res, next) {
  try {
    const { cedula, password } = req.body;
    if (!cedula || !password) {
      return res.status(400).json({ error: 'Cedula y contrasena son obligatorias' });
    }

    const militante = await authService.login(cedula, password);
    if (!militante) {
      return res.status(401).json({ error: 'Cedula o contrasena incorrecta' });
    }

    req.session.militanteId = militante.id;
    req.session.rolGlobal = militante.rolGlobal;
    req.session.estado = militante.estado;

    return res.json({
      militante: {
        id: militante.id,
        cedula: militante.cedula,
        nombres: militante.nombres,
        apellidos: militante.apellidos,
        estado: militante.estado,
        rolGlobal: militante.rolGlobal,
      },
    });
  } catch (err) {
    next(err);
  }
}

function postLogout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    return res.json({ message: 'Sesion cerrada' });
  });
}

async function postResetPassword(req, res, next) {
  try {
    const { cedula } = req.body;
    if (!esCedulaValida(cedula)) {
      return res.status(400).json({ error: 'La cedula debe tener 11 digitos' });
    }

    await authService.resetPassword(cedula);
    return res.json({ message: 'Si la cedula esta registrada, se envio una nueva contrasena.' });
  } catch (err) {
    if (err instanceof authService.MilitanteNoEncontradoError) {
      // Mismo mensaje que el caso exitoso, para evitar enumeracion de cedulas registradas.
      return res.json({ message: 'Si la cedula esta registrada, se envio una nueva contrasena.' });
    }
    next(err);
  }
}

async function getSesionActual(req, res) {
  if (!req.session || !req.session.militanteId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  return res.json({
    militanteId: req.session.militanteId,
    rolGlobal: req.session.rolGlobal,
    estado: req.session.estado,
  });
}

module.exports = { postRegistro, postLogin, postLogout, postResetPassword, getSesionActual };
