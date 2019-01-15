var router = require('express').Router();

router.use('/transmissions', require('./transmission'));
router.use('/receive', require('./receive'));
router.use('/error-codes', require('./errorCode'));
router.use('/current-infos', require('./currentInfo'));
router.use('/data', require('./data'));
router.use('/signals', require('./signals'));
router.use('/generate-key', require('./generate-key.js'));

module.exports = router;
