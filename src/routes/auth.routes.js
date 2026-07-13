const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');

// No hay auto-registro publico: el registro de militantes se hace via
// formulario fisico transcrito por un digitador (ver POST /personas/afiliar).
router.post('/login', loginLimiter, authController.postLogin);
router.post('/logout', requireAuth, authController.postLogout);
router.post('/reset-password', loginLimiter, authController.postResetPassword);
router.get('/sesion', requireAuth, authController.getSesionActual);

module.exports = router;
