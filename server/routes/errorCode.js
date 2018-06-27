var router = require('express').Router();
var ErrorCode = require('../db/models/errorCode');

/*
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
*/
router.get('/', function (req, res, next) {
  try {
    var query = ErrorCode.find();

    // Check if end date property exists
    if (req.query.end_date) {
      query = query.where({
        created: {
          $lte: new Date(Number(req.query.end_date))  // created property is less than that date
        }
      })
    }

    // Check if start date property exists
    if (req.query.start_date) {
      query = query.where({
        created: {
          $gte: new Date(Number(req.query.start_date))  // created property is greater than that date
        }
      })
    }

    query = query.sort('+created') // ascending order

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

/*
  Request Query
  limit: integer, default everything
*/
router.get('/latest', function (req, res, next) {
  try {
    var query = ErrorCode.find().sort('-created');

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
