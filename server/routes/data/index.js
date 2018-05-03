var router = require('express').Router();

/*
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
*/

router.use('/', require('./data'))
router.use('/attitude', require('./attitude'))
router.use('/flashBurst', require('./flashBurst'))
router.use('/flashComp', require('./flashComp'))
router.use('/idle', require('./idle'))
router.use('/lowPower', require('./lowPower'))


module.exports = router;
