const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/auth.middleware');

router.use(requireAdmin);

router.get('/comites', adminController.getComites);
router.get('/validaciones/pendientes', adminController.getValidacionesPendientes);
router.get('/validaciones/:id/foto/:tipo', adminController.getFotoValidacion);
router.post('/validaciones/:id/aprobar', adminController.postAprobar);
router.post('/validaciones/:id/rechazar', adminController.postRechazar);
router.get('/estadisticas', adminController.getEstadisticas);
router.get('/exportar/militantes', adminController.getExportarMilitantes);
router.get('/exportar/comites', adminController.getExportarComites);

module.exports = router;
