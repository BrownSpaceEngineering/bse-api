var router = require('express').Router();

var security = require('./data/key-manager');

router.post('/', function (req, res, next) {
  res.send(security.generateKey());
});

module.exports = router;
