var router = require('express').Router();
var Transmission = require('../db/models/transmission');

router.get('/', function (req, res, next) {
  Transmission.find()
  .then(transmissions => {
    res.json(transmissions);
  })
  .catch(err => {
    next(err);
  })
})

router.get('/:cuid', function (req, res, next) {
  var cuid = req.params.cuid;

  Transmission.findOne({
    cuid: cuid
  }).then(transmission => {
    if (transmission) {
      res.json(transmission);
    } else {
      res.status(400).send('Transmission not found');
    }
  })
  .catch(err => {
    next(err);
  })
})

module.exports = router;
