"use strict";

// Third-party modules
var router = require('express').Router();
var stormpath = require('express-stormpath');

// Custom modules
var vms = require('./admin/vms');
var monitoring = require('./admin/monitoring');

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

router.use('/monitoring', monitoring);


/* Oli, do we still need this??*/
/* Jupp, at least in a certain way, I'll update you tomorrow */
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
