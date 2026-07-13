const router = require('express').Router();
const personasController = require('../controllers/personas.controller');
const { requireAuth, requireValidado } = require('../middleware/auth.middleware');

router.get('/consultar', personasController.getConsultar);
router.put('/perfil', requireAuth, personasController.putPerfil);
router.get('/padron/:cedula', requireAuth, requireValidado, personasController.getPadron);
router.post('/afiliar', requireAuth, requireValidado, personasController.postAfiliar);

module.exports = router;
