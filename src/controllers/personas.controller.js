const personaService = require('../services/personas/persona.service');
const padronService = require('../services/padron/padronService');
const authService = require('../services/auth/auth.service');
const validacionService = require('../services/validaciones/validacion.service');
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

/**
 * POST /personas/validacion — sube foto de cedula (frente/dorso) + selfie.
 * Requiere multer.fields([{name:'cedulaFrente'},{name:'cedulaDorso'},{name:'selfie'}]).
 */
async function postValidacion(req, res, next) {
  try {
    const archivos = req.files || {};
    const cedulaFrente = archivos.cedulaFrente && archivos.cedulaFrente[0];
    const cedulaDorso = archivos.cedulaDorso && archivos.cedulaDorso[0];
    const selfie = archivos.selfie && archivos.selfie[0];

    if (!cedulaFrente || !cedulaDorso || !selfie) {
      return res.status(400).json({ error: 'Se requieren las 3 fotos: cedula frente, cedula dorso y selfie' });
    }

    const validacion = await validacionService.crearSolicitud(req.session.militanteId, {
      fotoCedulaFrente: cedulaFrente.buffer,
      fotoCedulaFrenteMimeType: cedulaFrente.mimetype,
      fotoCedulaDorso: cedulaDorso.buffer,
      fotoCedulaDorsoMimeType: cedulaDorso.mimetype,
      selfie: selfie.buffer,
      selfieMimeType: selfie.mimetype,
    });

    return res.status(201).json({
      message: 'Solicitud de validacion enviada. Un administrador la revisara en las proximas 24-48h.',
      validacion: { id: validacion.id, estado: validacion.estado, fechaSolicitud: validacion.fechaSolicitud },
    });
  } catch (err) {
    if (err instanceof validacionService.ValidacionYaExisteError) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

/** GET /personas/validacion — estado de la ultima solicitud del propio militante. */
async function getValidacion(req, res, next) {
  try {
    const validacion = await validacionService.obtenerUltimaSolicitud(req.session.militanteId);
    return res.json({ validacion: validacion || null });
  } catch (err) {
    next(err);
  }
}

/** GET /personas/catalogos/provincias — para el selector de creacion de comite. */
async function getProvincias(req, res, next) {
  try {
    const provincias = await padronService.listarProvincias();
    return res.json({ provincias });
  } catch (err) {
    next(err);
  }
}

/** GET /personas/catalogos/municipios?provinciaId=X */
async function getMunicipios(req, res, next) {
  try {
    const provinciaId = parseInt(req.query.provinciaId, 10);
    if (!provinciaId) return res.status(400).json({ error: 'provinciaId es obligatorio' });

    const municipios = await padronService.listarMunicipiosPorProvincia(provinciaId);
    return res.json({ municipios });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getConsultar,
  putPerfil,
  getPadron,
  postAfiliar,
  postValidacion,
  getValidacion,
  getProvincias,
  getMunicipios,
};
