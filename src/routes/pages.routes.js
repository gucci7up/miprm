const router = require('express').Router();

router.get('/', (req, res) => res.render('home'));
router.get('/inscribete', (req, res) => res.render('auth/registro'));
router.get('/iniciar-sesion', (req, res) => res.render('auth/login'));
router.get('/consultate', (req, res) => res.render('personas/consultar'));
router.get('/validacion', (req, res) => res.render('personas/validacion'));
router.get('/tablero', (req, res) => res.render('tablero'));
router.get('/comites-nuevo', (req, res) => res.render('comites/crear'));
router.get('/comites-editar/:id', (req, res) => res.render('comites/editar', { comiteId: req.params.id }));
router.get('/panel-admin', (req, res) => res.render('admin/panel'));

module.exports = router;
