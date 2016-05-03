"use strict";

// Third-party modules
var router = require('express').Router();
var request = require('request');
var carltonURL = require('config').get('proxy.carlton');

router.all( '/*', function(req, res) {										// Proxy request --> http://stackoverflow.com/questions/20196223/error-handling-on-request-piping/20198377#20198377
	console.log("Got a carlton request with method =", req.method, req.url);
	req.pipe( request({														// Using request module --> https://github.com/request/request
		url: carltonURL + req.url,								// Request is an object of Class: http.IncomingMessage --> https://nodejs.org/api/http.html#http_class_http_incomingmessage
		qs: req.query,
		method: req.method
	}, function(error, response, body) {
		if (error && error.code === 'ECONNREFUSED') {
			console.error('Refused connection');
		} else if (error) {
			console.error(error);
		} else {
			console.log('Proxy received the following data =', body);
		}
	})).pipe( res );
});

module.exports = router;
