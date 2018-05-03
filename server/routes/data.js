var router = require('express').Router();
var Data = require('../db/models/data');


/**
Get all data 
*/
router.get('/', function (req, res, next) {
	Data.find()
	.sort('+created')
	.exec()
	.then(data => {
		res.json(data);
	})
	.catch(err => {
		next(err);
	})
})

/**
Get all data from attitude packets
*/
router.get('/attitude', function (req, res, next) {
  var ATTITUDE = 'ATTITUDE';
  Data.find({
    data_type: ATTITUDE
  })
  .sort('+created')
  .exec()
  .then(attitudes => {
    if (attitudes.length) {
      res.json(attitudes);
    } else {
      res.status(400).send('Attitude data not found');
    }
  })
  .catch(err => {
    next(err);
  })
})

/**
Get all data from flash-burst packets
*/
router.get('/flash-burst', function (req, res, next) {
  var FLASH_BURST = 'FLASH_BURST';
  Data.find({
    data_type: FLASH_BURST
  })
  .sort('+created')
  .exec()
  .then(flashBursts => {
    if (flashBursts.length) {
      res.json(flashBursts);
    } else {
      res.status(400).send('Flash Burst data not found');
    }
  })
  .catch(err => {
    next(err);
  })
})

/**
Get all data from flash-comparison packets
*/
router.get('/flash-comparison', function (req, res, next) {
  var FLASH_CMP = 'FLASH_CMP';
  Data.find({
    data_type: FLASH_CMP
  })
  .sort('+created')
  .exec()
  .then(flashComps => {
    if (flashComps.length) {
      res.json(flashComps);
    } else {
      res.status(400).send('Flash Comparison data not found');
    }
  })
  .catch(err => {
    next(err);
  })
})

/**
Get all data from idle packets
*/
router.get('/idle', function (req, res, next) {
  var IDLE = 'IDLE';
  Data.find({
    data_type: IDLE
  })
  .sort('+created')
  .exec()
  .then(idleData => {
    if (idleData.length) {
      res.json(idleData);
    } else {
      res.status(400).send('Idle packet data not found');
    }
  })
  .catch(err => {
    next(err);
  })
})

/**
Get all data from low power packets
*/
router.get('/low-power', function (req, res, next) {
  var LOW_POWER = 'LOW_POWER';
  Data.find({
    data_type: LOW_POWER
  })
  .sort('+created')
  .exec()
  .then(lowPower => {
    if (lowPower.length) {
      res.json(lowPower);
    } else {
      res.status(400).send('Low Power data not found');
    }
  })
  .catch(err => {
    next(err);
  })
})



module.exports = router;
