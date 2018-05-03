var router = require('express').Router();

router.use('/transmissions', require('./transmission'));
router.use('/receive', require('./receive'));
router.use('/error-codes', require('./errorCode'));
router.use('/current-infos', require('./currentInfo'));

module.exports = router;