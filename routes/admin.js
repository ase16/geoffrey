"use strict";

// Third-party modules
var router = require('express').Router();
var stormpath = require('express-stormpath');

router.get('/*', stormpath.groupsRequired(['admins']), function(req, res, next) {
	next();
});

router.get('/main', function(req, res, next) {
	res.render('admin/main', {
		title: 'Welcome to the Admin Dashboard ' + req.user.email,
		text: 'Geoffrey - A company name sentiment analysis application doped with the GCE and some elastic computing'
	});
});

module.exports = router;