"use strict";

// Third-party modules
var router = require('express').Router();
var stormpath = require('express-stormpath');
var request = require('request');

// Custom modules
var viz = require('./company/viz');

// Nod define all routes that are handled after "/company"
router.all('/*', stormpath.groupsRequired(['companies']), function(req, res, next) {
	next();
});

router.get('/main', function(req, res) {
	res.render('company/main', {
		title: 'Company Space - Main Screen',
		email: req.user.email,
		user: req.user
	});
});

router.get('/term-management', function(req, res) {
	res.render('company/termManagement', {
		title: 'Company Space - Term Management Screen',
		email: req.user.email
	});
});

router.get('/viz', function(req, res, next) {
	res.render('company/viz', {
		title: 'Company Space - Sentiment Visualization Screen',
		email: req.user.email
	});
});

// Handle post requests when user requests a visualization for a term
router.post('/viz/load-data', function(req, res, next) {
	var term = req.body.term;
	var sd = req.body.startDay;
	var ed = req.body.endDay;

	viz.loadAndAggregate(term, sd, ed, (err, hrlyAggr) => {
		if (!err) res.json(hrlyAggr)
		else res.json({ err: err })
	})
});

module.exports = router;
