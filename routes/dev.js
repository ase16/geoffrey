"use strict";

// Third-party modules
var router = require('express').Router();

// Make a route available where we can test some "load" (using a blocking function for 1 second)
router.get('/loadtest', function(req, res) {
	function sleep(milliSeconds) {
		var startTime = new Date().getTime();
		while (new Date().getTime() < startTime + milliSeconds);
	}
	sleep(1000);
	res.json( { info: 'Geoffrey is under load!' } );
});

module.exports = router;