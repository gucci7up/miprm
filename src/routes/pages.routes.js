const router = require('express').Router();

router.get('/', (req, res) => res.render('home'));
router.get('/iniciar-sesion', (req, res) => res.render('auth/login'));
router.get('/consultate', (req, res) => res.render('personas/consultar'));
router.get('/validacion', (req, res) => res.render('personas/validacion'));
router.get('/tablero', (req, res) => res.render('tablero'));
router.get('/comites-editar/:id', (req, res) => res.render('comites/editar', { comiteId: req.params.id }));
router.get('/panel-admin', (req, res) => res.render('admin/panel'));
router.get('/panel-digitador', (req, res) => res.render('digitador/panel'));

module.exports = router;
