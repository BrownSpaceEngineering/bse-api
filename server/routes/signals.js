var router = require('express').Router();
var CurrentInfo = require('../db/models/currentInfo');
var Data = require('../db/models/data');

function separateArray(arr) {
	var toReturn = {timestamps: [], values: []}
	for (var i = 0; i < arr.length; i++) {
	    toReturn.timestamps[i] = arr[i].timestamp;
	    toReturn.values[i] = arr[i].value;
	}
	return toReturn;
}

/*
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
*/
router.get('/', function (req, res, next) {
  try {
    var curInfoQuery = CurrentInfo.find();
    var dataQuery = Data.find();

    // Check if end date property exists
    if (req.query.end_date) {
      var end_date = Number(req.query.end_date);
      curInfoQuery = curInfoQuery.where({
        created: {
          $lte: new Date(end_date)  // created property is less than that date
        }
      });
      dataInfoQuery = dataQuery.where({
        created: {
          $lte: new Date(end_date)  // created property is less than that date
        }
      })
    }

    // Check if start date property exists
    if (req.query.start_date) {
      var start_date = Number(req.query.start_date);
      curInfoQuery = curInfoQuery.where({
        created: {
          $gte: new Date(start_date)  // created property is greater than that date
        }
      });
      dataQuery = dataQuery.where({
        created: {
          $gte: new Date(start_date)  // created property is greater than that date
        }
      });
    }

    curInfoQuery = curInfoQuery.sort('+created'); // ascending order
    dataQuery = dataQuery.sort('+created'); // ascending order

    Promise.all([
  		curInfoQuery,
  		dataQuery
	]).then(([ currentInfos, data ]) => {
		if (req.query.fields) {
	    	var toReturn = {};

	    	var fields = req.query.fields.split(',');
	    	currentInfos.forEach(currentInfo => {
	    		fields.forEach(field => {
		        	if (!(field in toReturn)) {
		        		toReturn[field] = [];
		        	}
		        	if (field in currentInfo) {
		        		var curEntry = {
            				timestamp: currentInfo.created.getTime(),
	            			value: currentInfo[field]
          				};
          				toReturn[field].push(curEntry);
		        	}
	        	});
	    	});
	    	data.forEach(datum => {
	    		fields.forEach(field => {
		        	if (!(field in toReturn)) {
		        		toReturn[field] = [];
		        	}
		        	if (field in datum.payload) {
		        		var curEntry = {
	            			timestamp: datum.created.getTime(),
            				value: datum.payload[field]
          				};
          				toReturn[field].push(curEntry);
          			}
	        	});
	    	});
	    	for (var field in toReturn) {
	    		toReturn[field].sort(function(a,b) {
					return new Date(a.timestamp) - new Date(b.timestamp);
				});
	    		toReturn[field] = separateArray(toReturn[field]);
	    	}
	    	res.json(toReturn);
        } else {
        	res.statusMessage = "Must specify at least one signal field";
    		res.status(400).end();
        }
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
  fields: comma delimited String, default everything
*/
router.get('/latest', function (req, res, next) {
  try {
  	var curInfoQuery = CurrentInfo.find().sort('-created');
    var dataQuery = Data.find().sort('-created');

    /*if (req.query.limit) {
      query = query.limit(+req.query.limit) // cast to number
    }*/
    Promise.all([
  		curInfoQuery,
  		dataQuery
	]).then(([ currentInfos, data ]) => {
		if (req.query.fields) {
    	var toReturn = {};

    	var fields = req.query.fields.split(',');
    	currentInfos.forEach(currentInfo => {
    		fields.forEach(field => {
        	if (!(field in toReturn)) {
        		toReturn[field] = [];
        	}
        	if (field in currentInfo) {
        		var curEntry = {
        				timestamp: currentInfo.created.getTime(),
          			value: currentInfo[field]
      				};
      				toReturn[field].push(curEntry);
        	}
        });
    	});
    	data.forEach(datum => {
    		fields.forEach(field => {
        	if (!(field in toReturn)) {
        		toReturn[field] = [];
        	}
        	if (field in datum.payload) {
        		var curEntry = {
        			timestamp: datum.created.getTime(),
      				value: datum.payload[field]
    				};
    				toReturn[field].push(curEntry);
    			}
        });
    	});
    	//sort arrays by timestamp
    	for (var field in toReturn) {
    		toReturn[field].sort(function(a,b) {
					return new Date(b.timestamp) - new Date(a.timestamp);
			  });
 			 if (req.query.limit) {
				 toReturn[field] = toReturn[field].slice(0, req.query.limit);
			  }
			 toReturn[field] = separateArray(toReturn[field]);
    	}
    	res.json(toReturn);
    } else {
      res.statusMessage = "Must specify at least one signal field";
  		res.status(400).end();
    }
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
  fields: comma delimited String, default everything
*/
router.get('/latest_single', function (req, res, next) {
  try {
    var curInfoQuery = CurrentInfo.find().sort('-created');
    var dataQuery = Data.find().sort('-created');

    /*if (req.query.limit) {
      query = query.limit(+req.query.limit) // cast to number
    }*/
    Promise.all([
      curInfoQuery,
      dataQuery
  ]).then(([ currentInfos, data ]) => {
    if (req.query.fields) {
      var toReturn = {};

      var fields = req.query.fields.split(',');
      currentInfos.forEach(currentInfo => {
        fields.forEach(field => {
          if (!(field in toReturn)) {
            toReturn[field] = [];
          }
          if (field in currentInfo) {
            var curEntry = {
              timestamp: currentInfo.created.getTime(),
              value: currentInfo[field]
            };
            toReturn[field].push(curEntry);
          }
        });
      });
      data.forEach(datum => {
        fields.forEach(field => {
          if (!(field in toReturn)) {
            toReturn[field] = [];
          }
          if (field in datum.payload) {
            var curEntry = {
              timestamp: datum.created.getTime(),
              value: datum.payload[field]
            };
              toReturn[field].push(curEntry);
          }
        });
      });
      //sort arrays by timestamp
      for (var field in toReturn) {
        toReturn[field].sort(function(a,b) {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        toReturn[field] = toReturn[field][0];
      }
      res.json(toReturn);
    } else {
      res.statusMessage = "Must specify at least one signal field";
      res.status(400).end();
    }
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
