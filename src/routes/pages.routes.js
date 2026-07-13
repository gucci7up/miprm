const router = require('express').Router();

router.get('/', (req, res) => res.render('home'));
router.get('/inscribete', (req, res) => res.render('auth/registro'));
router.get('/iniciar-sesion', (req, res) => res.render('auth/login'));
router.get('/consultate', (req, res) => res.render('personas/consultar'));

module.exports = router;
