var router = require('express').Router();
var Transmission = require('../db/models/transmission');

/*
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
*/
router.get('/', function (req, res, next) {
  try {
    var query = Transmission.find().populate('data').populate('error_codes').populate('current_info')
    // Check if end date property exists
    if (req.query.end_date) {
      query = query.where({
        created: {
          $lte: new Date(req.query.end_date)  // created property is less than that date
        }
      })
    }

    // Check if start date property exists
    if (req.query.start_date) {
      query = query.where({
        created: {
          $gte: new Date(req.query.start_date)  // created property is greater than that date
        }
      })
    }

    query = query.sort('+created') // ascending order

    query
    .exec()
    .then(transmissions => {
      res.json(transmissions);
    })
    .catch(err => {
      next(err);
    })
  } catch (err) {
    err.status = 400;
    next(err);
  }
})

/*
  Request Query
  limit: integer, default everything
*/
router.get('/latest', function (req, res, next) {
  try {
    var query = Transmission.find().sort('-created');

    if (req.query.limit) {
      query = query.limit(+req.query.limit) // cast to number
    }

    query.exec()
    .then(codes => {
      res.json(codes);
    })
    .catch(err => {
      next(err);
    })
  } catch (err) {
    err.status = 400;
    next(err);
  }

})

router.get('/:cuid', function (req, res, next) {
  var cuid = req.params.cuid;

  Transmission.findOne({
    cuid: cuid
  })
  .populate('data')
  .populate('error_codes')
  .populate('current_info')
  .exec()
  .then(transmission => {
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
