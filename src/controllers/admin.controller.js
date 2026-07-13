const adminService = require('../services/admin/admin.service');
const comiteService = require('../services/comites/comite.service');
const { aCsv } = require('../utils/csv');

async function getComites(req, res, next) {
  try {
    const { municipioId, provinciaNombre } = req.query;
    const comites = await comiteService.listarComites({
      municipioId: municipioId ? parseInt(municipioId, 10) : undefined,
      provinciaNombre,
      soloActivos: false,
    });
    return res.json({ comites: comites.map((c) => ({ ...c, logo: undefined })) });
  } catch (err) {
    next(err);
  }
}

async function getValidacionesPendientes(req, res, next) {
  try {
    const validaciones = await adminService.listarValidacionesPendientes();
    return res.json({
      validaciones: validaciones.map((v) => ({
        id: v.id,
        estado: v.estado,
        fechaSolicitud: v.fechaSolicitud,
        militante: v.militante,
      })),
    });
  } catch (err) {
    next(err);
  }
}

const TIPOS_FOTO = {
  frente: { campo: 'fotoCedulaFrente', mime: 'fotoCedulaFrenteMimeType' },
  dorso: { campo: 'fotoCedulaDorso', mime: 'fotoCedulaDorsoMimeType' },
  selfie: { campo: 'selfie', mime: 'selfieMimeType' },
};

async function getFotoValidacion(req, res, next) {
  try {
    const tipo = TIPOS_FOTO[req.params.tipo];
    if (!tipo) return res.status(400).json({ error: 'Tipo de foto invalido' });

    const validacion = await adminService.obtenerValidacion(parseInt(req.params.id, 10));
    if (!validacion || !validacion[tipo.campo]) return res.status(404).end();

    res.set('Content-Type', validacion[tipo.mime] || 'application/octet-stream');
    return res.send(validacion[tipo.campo]);
  } catch (err) {
    next(err);
  }
}

async function postAprobar(req, res, next) {
  try {
    const militante = await adminService.aprobarValidacion(parseInt(req.params.id, 10), String(req.session.militanteId));
    return res.json({ message: 'Validacion aprobada', militante: { id: militante.id, estado: militante.estado } });
  } catch (err) {
    next(err);
  }
}

async function postRechazar(req, res, next) {
  try {
    const { comentario } = req.body;
    const militante = await adminService.rechazarValidacion(parseInt(req.params.id, 10), String(req.session.militanteId), comentario);
    return res.json({ message: 'Validacion rechazada', militante: { id: militante.id, estado: militante.estado } });
  } catch (err) {
    next(err);
  }
}

async function getEstadisticas(req, res, next) {
  try {
    const stats = await adminService.estadisticas();
    return res.json(stats);
  } catch (err) {
    next(err);
  }
}

async function getExportarMilitantes(req, res, next) {
  try {
    const militantes = await adminService.listarTodosMilitantes();
    const csv = aCsv(militantes, [
      { titulo: 'ID', valor: (m) => m.id },
      { titulo: 'Cedula', valor: (m) => m.cedula },
      { titulo: 'Nombres', valor: (m) => m.nombres },
      { titulo: 'Apellidos', valor: (m) => m.apellidos },
      { titulo: 'Telefono', valor: (m) => m.telefono },
      { titulo: 'Email', valor: (m) => m.email },
      { titulo: 'Estado', valor: (m) => m.estado },
      { titulo: 'Fecha registro', valor: (m) => m.createdAt.toISOString() },
    ]);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="militantes.csv"');
    return res.send(csv);
  } catch (err) {
    next(err);
  }
}

async function getExportarComites(req, res, next) {
  try {
    const comites = await adminService.listarTodosComites();
    const csv = aCsv(comites, [
      { titulo: 'ID', valor: (c) => c.id },
      { titulo: 'Nombre', valor: (c) => c.nombre },
      { titulo: 'Municipio', valor: (c) => c.municipioNombre },
      { titulo: 'Provincia', valor: (c) => c.provinciaNombre },
      { titulo: 'Coordinador', valor: (c) => (c.coordinador ? `${c.coordinador.nombres} ${c.coordinador.apellidos}` : '') },
      { titulo: 'Cedula coordinador', valor: (c) => c.coordinador?.cedula || '' },
      { titulo: 'Total miembros', valor: (c) => c._count.miembros },
      { titulo: 'Activo', valor: (c) => (c.activo ? 'Si' : 'No') },
      { titulo: 'Fecha creacion', valor: (c) => c.createdAt.toISOString() },
    ]);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="comites.csv"');
    return res.send(csv);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getComites,
  getValidacionesPendientes,
  getFotoValidacion,
  postAprobar,
  postRechazar,
  getEstadisticas,
  getExportarMilitantes,
  getExportarComites,
};
