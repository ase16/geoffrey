"use strict";

// Third-party modules
var router = require('express').Router();
var stormpath = require('express-stormpath');

// Custom modules
var vms = require('./admin/vms');
var monitoring = require('./admin/monitoring')

router.get('/*', stormpath.groupsRequired(['admins']), function(req, res, next) {
	next();
});

router.get('/main', function(req, res, next) {
	res.render('admin/main', {
		title: 'Admin Space - Main Screen',
		email: req.user.email,
		user: req.user,
		admin: true
	});
});


/*
router.get('/fetcherlog', function(req, res, next) {
	res.render('admin/fetcherlog', {
		title: 'Admin Space - Twitter Fetcher Log',
		email: req.user.email,
		admin: true
	});
});

router.get('/vm-management', function(req, res, next) {
	res.render('admin/vmManagement', {
		title: 'Admin Space - VM Management Screen',
		email: req.user.email,
		admin: true
	});
});
*/

router.use('/monitoring', monitoring)


/* Oli, do we still need this??*/

router.route('/vms')

	.get(function(req, res, next) {
		vms.read(req, function(err, data) {
			if (!err) {
				res.json( { vms: data } );
			}
			else {
				res.json( { err: err } );
			}
		});
	})

	.post(function(req, res, next) {
		vms.resize(req, function(err, data) {
			if (!err) {
				res.json( { vms: data } );
			}
			else {
				res.json( { err: err } );
			}
		});
	})
;

module.exports = router;
