"use strict";

// Third-party modules
var router = require('express').Router();
var stormpath = require('express-stormpath');

router.get('/*', stormpath.groupsRequired(['admins']), function(req, res, next) {
	next();
});

router.get('/main', function(req, res, next) {
	res.render('admin/main', {
		title: 'Admin Space - Main Screen',
		email: req.user.email,
		user: req.user
	});
});

router.get('/fetcherlog', function(req, res, next) {
	res.render('admin/fetcherlog', {
		title: 'Admin Space - Twitter Fetcher Log',
		email: req.user.email
	});
});

module.exports = router;
