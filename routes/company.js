"use strict";

// Third-party modules
var router = require('express').Router();
var stormpath = require('express-stormpath');

// Custom modules
var terms = require('./company/terms');
var viz = require('./company/viz');

// Nod define all routes that are handled after "/company"
router.all('/*', stormpath.groupsRequired(['companies']), function(req, res, next) {
	next();
});

router.get('/main', function(req, res, next) {
	res.render('company/main', {
		title: 'Company Space - Main Screen',
		email: req.user.email,
		user: req.user
	});
});

router.get('/term-management', function(req, res, next) {
	res.render('company/termManagement', {
		title: 'Company Space - Term Management Screen',
		email: req.user.email
	});
});

// In stormpath.js we make sure via extend that we do not have to manually request the terms from the custom-data via the REST API
router.route('/terms')

	.get(function(req, res, next) {
		terms.read(req, function(err, data) {
			if (!err) {
				res.json( { terms: data } );
			}
			else {
				res.json( { err: err } );
			}
		});
	})

	.post(function(req, res, next) {
		terms.create(req, function(err, data) {
			if (!err) {
				res.json( { terms: data } );
			}
			else {
				res.json( { err: err } );
			}
		});
	})
;

router.route('/terms/:id')

	.put(function(req, res) {
		terms.update(req, function(err, data) {
			if (!err) {
				res.json( { terms: data } );
			}
			else {
				res.json( { err: err } );
			}
		});
	})

	.delete(function(req, res) {
		terms.delete(req, function(err, data) {
			if (!err) {
				res.json( { terms: data } );
			}
			else {
				res.json( { err: err } );
			}
		});
	})
;

router.get('/viz', function(req, res, next) {
	res.render('company/viz', {
		title: 'Company Space - Sentiment Visualization Screen',
		email: req.user.email
	});
});

// Handle post requests when user clicked on search-button
router.post('/viz/fetch-tweets', function(req, res, next) {
	var term = req.body.term;
	viz.fetchTweets(term, (err, sentiments) => res.json(sentiments));
});

module.exports = router;
