var router = require('express').Router();

router.use('/transmissions', require('./transmission'));
router.use('/receive', require('./receive'));
router.use('/error-codes', require('./errorCode'));
router.use('/current-infos', require('./currentInfo'));

// Data stuff
router.use('/data', require('./data'));

module.exports = router;
