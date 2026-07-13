const router = require('express').Router();
const comitesController = require('../controllers/comites.controller');
const { requireAuth, requireDigitadorOAdmin } = require('../middleware/auth.middleware');
const { requireComiteCoordinador, requireComiteGestor, requireComiteMiembro } = require('../middleware/comite.middleware');
const upload = require('../middleware/upload.middleware');

// El comite nace de un formulario fisico: solo digitador/admin lo dan de alta.
router.post('/', requireDigitadorOAdmin, upload.single('logo'), comitesController.postComite);
router.get('/', requireAuth, comitesController.getComites);
router.get('/mis-comites', requireAuth, comitesController.getMisComites);

router.get('/:id', requireAuth, comitesController.getComite);
router.get('/:id/logo', comitesController.getLogo);
router.put('/:id', requireAuth, requireComiteCoordinador, upload.single('logo'), comitesController.putInfoGeneral);
// Asignar/reemplazar coordinador: tarea de digitador/admin (como "asignar coordinador" del sistema de referencia).
router.put('/:id/coordinador', requireDigitadorOAdmin, comitesController.putCoordinador);

router.get('/:id/miembros', requireAuth, requireComiteMiembro, comitesController.getMiembros);
router.post('/:id/miembros', requireAuth, requireComiteGestor, comitesController.postMiembro);
router.delete('/:id/miembros/:miembroId', requireAuth, requireComiteCoordinador, comitesController.deleteMiembro);
router.post('/:id/afiliarme', requireAuth, comitesController.postAfiliarme);

router.get('/:id/actividades', requireAuth, requireComiteMiembro, comitesController.getActividades);
router.post('/:id/actividades', requireAuth, requireComiteGestor, upload.single('imagen'), comitesController.postActividad);
router.get('/:id/actividades/:actividadId/imagen', comitesController.getActividadImagen);

router.get('/:id/imprimir-datos', requireAuth, requireComiteMiembro, comitesController.getDatosImpresion);

module.exports = router;
