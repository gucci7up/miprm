const router = require('express').Router();

// TODO: implementar en la Fase 3 (API REST) una vez confirmado el esquema de BD
router.get('/_status', (req, res) => res.json({ module: 'admin', status: 'pending' }));

module.exports = router;
