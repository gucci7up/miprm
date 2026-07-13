const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');

router.post('/registro', authController.postRegistro);
router.post('/login', loginLimiter, authController.postLogin);
router.post('/logout', requireAuth, authController.postLogout);
router.post('/reset-password', loginLimiter, authController.postResetPassword);
router.get('/sesion', requireAuth, authController.getSesionActual);

module.exports = router;
