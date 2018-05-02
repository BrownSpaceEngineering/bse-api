var router = require('express').Router();
var CurrentInfo = require('../db/models/currentInfo');

router.get('/', function (req, res, next) {
  CurrentInfo.find()
  .then(currentInfos => {
    res.json(currentInfos);
  })
  .catch(err => {
    next(err);
  })
})

router.get('/:transmissionCuid', function (req, res, next) {
  var transmissionCuid = req.params.transmissionCuid;

  CurrentInfo.findOne({
    transmission_cuid: transmissionCuid
  }).then(currentInfo => {
    if (currentInfo) {
      res.json(currentInfo);
    } else {
      res.status(400).send('Current Info not found');
    }
  })
  .catch(err => {
    next(err);
  })
})

module.exports = router;
