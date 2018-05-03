var router = require('express').Router();
var Data = require('../db/models/data');


/*
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
*/

router.use('/attitude', './attitude')
router.use('/flashBurst', './flashBurst')
router.use('/flashComp', './flashComp')
router.use('/idle', './idle')
router.use('/lowPower', './lowPower')

router.get('/', function (req, res, next) {
  try {
    var query = Data.find();

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

    query.exec() // Execute Query
    .then(data => {
      // Filter for only selected fields
      if (req.query.fields) {
        var fields = req.query.fields.split(',');

        data = data.map(datum => {
          // Copy over only the ones user selected

          var filteredPayload = {};

          fields.forEach(field => {
            filteredPayload[field] = datum.payload[field];
          })

          datum.payload = filteredPayload;
          return datum;
        })
      }

      res.json(data);
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
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
*/
router.get('/attitude', function (req, res, next) {
  var ATTITUDE = 'ATTITUDE';
  try {
    var query = Data.find({
    	data_type: ATTITUDE
    });

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

    query.exec() // Execute Query
    .then(data => {
      // Filter for only selected fields
      if (req.query.fields) {
        var fields = req.query.fields.split(',');

        data = data.map(datum => {
          // Copy over only the ones user selected

          var filteredPayload = {};

          fields.forEach(field => {
            filteredPayload[field] = datum.payload[field];
          })

          datum.payload = filteredPayload;
          return datum;
        })
      }

      res.json(data);
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
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
  note: you can only get the timestamp and burst via this route, no finer granularity possible yet
*/
router.get('/flash-burst', function (req, res, next) {
  var FLASH_BURST = 'FLASH_BURST';
  try {
    var query = Data.find({
    	data_type: FLASH_BURST
    });

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

    query.exec() // Execute Query
    .then(data => {
      // Filter for only selected fields
      if (req.query.fields) {
        var fields = req.query.fields.split(',');
        console.log('here ' + fields)
        data = data.map(datum => {
          // Copy over only the ones user selected

          var filteredPayload = {};

          fields.forEach(field => {
            filteredPayload[field] = datum.payload[field];
          })

          datum.payload = filteredPayload;
          return datum;
        })
      }

      res.json(data);
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
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
*/
router.get('/flash-comparison', function (req, res, next) {
  var FLASH_CMP = 'FLASH_CMP';
  try {
    var query = Data.find({
    	data_type: FLASH_CMP
    });

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

    query.exec() // Execute Query
    .then(data => {
      // Filter for only selected fields
      if (req.query.fields) {
        var fields = req.query.fields.split(',');
        console.log('here ' + fields)
        data = data.map(datum => {
          // Copy over only the ones user selected

          var filteredPayload = {};

          fields.forEach(field => {
            filteredPayload[field] = datum.payload[field];
          })

          datum.payload = filteredPayload;
          return datum;
        })
      }

      res.json(data);
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
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
*/
router.get('/idle', function (req, res, next) {
  var IDLE = 'IDLE';
  try {
    var query = Data.find({
    	data_type: IDLE
    });

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

    query.exec() // Execute Query
    .then(data => {
      // Filter for only selected fields
      if (req.query.fields) {
        var fields = req.query.fields.split(',');
        console.log('here ' + fields)
        data = data.map(datum => {
          // Copy over only the ones user selected

          var filteredPayload = {};

          fields.forEach(field => {
            filteredPayload[field] = datum.payload[field];
          })

          datum.payload = filteredPayload;
          return datum;
        })
      }

      res.json(data);
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
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
*/
router.get('/low-power', function (req, res, next) {
  var LOW_POWER = 'LOW_POWER';
  try {
    var query = Data.find({
    	data_type: LOW_POWER
    });

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

    query.exec() // Execute Query
    .then(data => {
      // Filter for only selected fields
      if (req.query.fields) {
        var fields = req.query.fields.split(',');
        console.log('here ' + fields)
        data = data.map(datum => {
          // Copy over only the ones user selected

          var filteredPayload = {};

          fields.forEach(field => {
            filteredPayload[field] = datum.payload[field];
          })

          datum.payload = filteredPayload;
          return datum;
        })
      }

      res.json(data);
    })
    .catch(err => {
      next(err);
    })
  } catch (err) {
    err.status = 400;
    next(err);
  }
})


module.exports = router;
