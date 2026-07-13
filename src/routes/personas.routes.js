const router = require('express').Router();
const personasController = require('../controllers/personas.controller');
const { requireAuth, requireDigitadorOAdmin } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/consultar', personasController.getConsultar);
router.put('/perfil', requireAuth, personasController.putPerfil);
// Registro (via formulario fisico) es tarea exclusiva de digitador/admin.
router.get('/padron/:cedula', requireDigitadorOAdmin, personasController.getPadron);
router.post('/afiliar', requireDigitadorOAdmin, personasController.postAfiliar);

router.post(
  '/validacion',
  requireAuth,
  upload.fields([
    { name: 'cedulaFrente', maxCount: 1 },
    { name: 'cedulaDorso', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  personasController.postValidacion
);
router.get('/validacion', requireAuth, personasController.getValidacion);

router.get('/catalogos/provincias', requireAuth, personasController.getProvincias);
router.get('/catalogos/municipios', requireAuth, personasController.getMunicipios);
router.get('/catalogos/zonas', requireAuth, personasController.getZonas);

module.exports = router;
