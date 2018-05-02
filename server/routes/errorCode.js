var router = require('express').Router();
var ErrorCode = require('../db/models/errorCode');

router.get('/', function (req, res, next) {
  ErrorCode.find()
  .then(codes => {
    res.json(codes);
  })
  .catch(err => {
    next(err);
  })
})

router.get('/:transmissionCuid', function (req, res, next) {
  var transmissionCuid = req.params.transmissionCuid;

  ErrorCode.find({
    transmission_cuid: transmissionCuid
  }).then(codes => {
    if (codes.length) {
      res.json(codes);
    } else {
      res.status(400).send('Error Codes not found');
    }
  })
  .catch(err => {
    next(err);
  })
})

module.exports = router;
