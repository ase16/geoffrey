"use strict";

// Third-party modules
var router = require('express').Router();
var stormpath = require('express-stormpath');


router.get('/*', stormpath.groupsRequired(['admins']), function(req, res, next) {
	next();
});

router.get('/geoffrey', function(req, res) {
	res.render('admin/monitoring/geoffrey', {
		title: 'Monitoring - Geoffrey Nodes',
		email: req.user.email,
		user: req.user,
		admin: true
	});
});

router.get('/carlton', function(req, res) {
	res.render('admin/monitoring/carlton', {
		title: 'Monitoring - Carlton Nodes',
		email: req.user.email,
		user: req.user,
		admin: true
	});
});

router.get('/jazz', function(req, res) {
	res.render('admin/monitoring/jazz', {
		title: 'Monitoring - Jazz Nodes',
		email: req.user.email,
		user: req.user,
		admin: true
	});
});

router.get('/will', function(req, res) {
	res.render('admin/monitoring/will', {
		title: 'Monitoring - Will Nodes',
		email: req.user.email,
		user: req.user,
		admin: true
	});
});


module.exports = router;
