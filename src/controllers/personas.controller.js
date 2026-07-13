const personaService = require('../services/personas/persona.service');
const padronService = require('../services/padron/padronService');
const authService = require('../services/auth/auth.service');
const { esCedulaValida, normalizarCedula } = require('../utils/cedula');

/** "Consultate": GET /personas/consultar?cedula=X&fechaNacimiento=YYYY-MM-DD */
async function getConsultar(req, res, next) {
  try {
    const { cedula, fechaNacimiento } = req.query;
    if (!esCedulaValida(cedula) || !fechaNacimiento) {
      return res.status(400).json({ error: 'Cedula (11 digitos) y fecha de nacimiento son obligatorias' });
    }

    const resultado = await personaService.consultar(cedula, fechaNacimiento);
    if (!resultado.existe) {
      return res.json({ existe: false, mensaje: 'No encontrado. Dirigete al formulario de inscripcion.' });
    }
    return res.json(resultado);
  } catch (err) {
    next(err);
  }
}

/** PUT /personas/perfil — el propio militante actualiza sus datos de contacto. */
async function putPerfil(req, res, next) {
  try {
    const militante = await personaService.actualizarPerfil(req.session.militanteId, req.body);
    return res.json({ militante });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /personas/padron/:cedula — autocompletar para "Registro basico" (afiliacion
 * asistida). Requiere que quien afilia ya este validado.
 */
async function getPadron(req, res, next) {
  try {
    const cedula = normalizarCedula(req.params.cedula);
    if (!esCedulaValida(cedula)) {
      return res.status(400).json({ error: 'Cedula invalida' });
    }

    const persona = await padronService.buscarPorCedula(cedula);
    if (!persona) {
      return res.status(404).json({ error: 'No encontrado en el padron' });
    }

    return res.json({
      cedula: persona.Cedula,
      nombres: persona.nombres,
      apellidos: [persona.apellido1, persona.apellido2].filter(Boolean).join(' '),
      fechaNacimiento: persona.FechaNacimiento,
      municipio: persona.Municipio,
      provincia: persona.Provincia,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /personas/afiliar — afiliacion asistida (Registro basico). Quien hace
 * la peticion ya debe estar validado (ver middleware requireValidado).
 */
async function postAfiliar(req, res, next) {
  try {
    const { cedula, nombres, apellidos, telefono } = req.body;
    if (!esCedulaValida(cedula) || !nombres || !apellidos || !telefono) {
      return res.status(400).json({ error: 'Cedula, nombres, apellidos y telefono son obligatorios' });
    }

    const militante = await authService.registrarMilitante({
      ...req.body,
      registradoPorId: req.session.militanteId,
    });

    return res.status(201).json({
      message: 'Afiliado correctamente. Se enviaron sus credenciales de acceso.',
      militante: {
        id: militante.id,
        cedula: militante.cedula,
        nombres: militante.nombres,
        apellidos: militante.apellidos,
      },
    });
  } catch (err) {
    if (err instanceof authService.CedulaDuplicadaError) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = { getConsultar, putPerfil, getPadron, postAfiliar };
