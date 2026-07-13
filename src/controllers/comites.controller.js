const comiteService = require('../services/comites/comite.service');
const comiteMiembroService = require('../services/comites/comiteMiembro.service');
const comiteActividadService = require('../services/comites/comiteActividad.service');

async function postComite(req, res, next) {
  try {
    const { nombre, municipioId, municipioNombre, provinciaNombre } = req.body;
    if (!nombre || !municipioId || !municipioNombre) {
      return res.status(400).json({ error: 'Nombre y municipio son obligatorios' });
    }

    const logoFile = req.file;
    const comite = await comiteService.crearComite({
      nombre,
      municipioId: parseInt(municipioId, 10),
      municipioNombre,
      provinciaNombre,
      presidenteId: req.session.militanteId,
      logo: logoFile ? logoFile.buffer : null,
      logoMimeType: logoFile ? logoFile.mimetype : null,
    });

    return res.status(201).json({ comite: { ...comite, logo: undefined } });
  } catch (err) {
    next(err);
  }
}

async function getComite(req, res, next) {
  try {
    const comite = await comiteService.obtenerComite(parseInt(req.params.id, 10));
    if (!comite) return res.status(404).json({ error: 'Comite no encontrado' });
    return res.json({ comite: { ...comite, logo: undefined } });
  } catch (err) {
    next(err);
  }
}

async function getLogo(req, res, next) {
  try {
    const comite = await comiteService.obtenerComite(parseInt(req.params.id, 10));
    if (!comite || !comite.logo) return res.status(404).end();
    res.set('Content-Type', comite.logoMimeType || 'application/octet-stream');
    return res.send(comite.logo);
  } catch (err) {
    next(err);
  }
}

async function putInfoGeneral(req, res, next) {
  try {
    const comiteId = parseInt(req.params.id, 10);
    const { nombre, municipioId, municipioNombre, provinciaNombre, activo } = req.body;
    const logoFile = req.file;

    const comite = await comiteService.actualizarInfoGeneral(comiteId, {
      nombre,
      municipioId: municipioId ? parseInt(municipioId, 10) : undefined,
      municipioNombre,
      provinciaNombre,
      activo: activo !== undefined ? activo === 'true' || activo === true : undefined,
      logo: logoFile ? logoFile.buffer : undefined,
      logoMimeType: logoFile ? logoFile.mimetype : undefined,
    });

    return res.json({ comite: { ...comite, logo: undefined } });
  } catch (err) {
    next(err);
  }
}

async function getComites(req, res, next) {
  try {
    const { municipioId, provinciaNombre } = req.query;
    const comites = await comiteService.listarComites({
      municipioId: municipioId ? parseInt(municipioId, 10) : undefined,
      provinciaNombre,
    });
    return res.json({ comites: comites.map((c) => ({ ...c, logo: undefined })) });
  } catch (err) {
    next(err);
  }
}

async function getMisComites(req, res, next) {
  try {
    const membresias = await comiteMiembroService.misComites(req.session.militanteId);
    return res.json({
      membresias: membresias.map((m) => ({ ...m, comite: { ...m.comite, logo: undefined } })),
    });
  } catch (err) {
    next(err);
  }
}

async function postMiembro(req, res, next) {
  try {
    const comiteId = parseInt(req.params.id, 10);
    const { cedula, fechaNacimiento, rol } = req.body;

    if (!cedula || !fechaNacimiento || !['SECRETARIO', 'MIEMBRO'].includes(rol)) {
      return res.status(400).json({ error: 'Cedula, fecha de nacimiento y rol (Secretario o Miembro) son obligatorios' });
    }

    const miembro = await comiteMiembroService.agregarMiembroPorCedula(comiteId, { cedula, fechaNacimiento, rol });
    return res.status(201).json({ miembro });
  } catch (err) {
    if (
      err instanceof comiteMiembroService.LimiteComiteAdicionalError ||
      err instanceof comiteMiembroService.YaEsMiembroError ||
      err instanceof comiteMiembroService.MilitanteNoEncontradoError
    ) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

async function postAfiliarme(req, res, next) {
  try {
    const comiteId = parseInt(req.params.id, 10);
    const miembro = await comiteMiembroService.afiliarme(comiteId, req.session.militanteId);
    return res.status(201).json({ miembro });
  } catch (err) {
    if (
      err instanceof comiteMiembroService.LimiteComiteAdicionalError ||
      err instanceof comiteMiembroService.YaEsMiembroError
    ) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

async function deleteMiembro(req, res, next) {
  try {
    const comiteId = parseInt(req.params.id, 10);
    const miembroId = parseInt(req.params.miembroId, 10);
    await comiteMiembroService.eliminarMiembro(comiteId, miembroId);
    return res.json({ message: 'Miembro eliminado' });
  } catch (err) {
    next(err);
  }
}

async function getMiembros(req, res, next) {
  try {
    const miembros = await comiteMiembroService.listarMiembros(parseInt(req.params.id, 10));
    return res.json({ miembros });
  } catch (err) {
    next(err);
  }
}

async function postActividad(req, res, next) {
  try {
    const comiteId = parseInt(req.params.id, 10);
    const { nombre, descripcion, fechaInicio, fechaFin } = req.body;
    if (!nombre || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Nombre, fecha de inicio y fecha de fin son obligatorios' });
    }

    const imagenFile = req.file;
    const actividad = await comiteActividadService.crearActividad(comiteId, {
      nombre,
      descripcion,
      fechaInicio,
      fechaFin,
      imagen: imagenFile ? imagenFile.buffer : null,
      imagenMimeType: imagenFile ? imagenFile.mimetype : null,
    });

    return res.status(201).json({ actividad: { ...actividad, imagen: undefined } });
  } catch (err) {
    next(err);
  }
}

async function getActividades(req, res, next) {
  try {
    const actividades = await comiteActividadService.listarActividades(parseInt(req.params.id, 10));
    return res.json({ actividades: actividades.map((a) => ({ ...a, imagen: undefined })) });
  } catch (err) {
    next(err);
  }
}

async function getActividadImagen(req, res, next) {
  try {
    const actividad = await comiteActividadService.obtenerActividad(parseInt(req.params.actividadId, 10));
    if (!actividad || !actividad.imagen) return res.status(404).end();
    res.set('Content-Type', actividad.imagenMimeType || 'application/octet-stream');
    return res.send(actividad.imagen);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postComite,
  getComite,
  getLogo,
  putInfoGeneral,
  getComites,
  getMisComites,
  postMiembro,
  postAfiliarme,
  deleteMiembro,
  getMiembros,
  postActividad,
  getActividades,
  getActividadImagen,
};
