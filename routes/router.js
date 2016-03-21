// Dependencies for 3rd-Party modules (do not forget to npm install them)
var express = require('express');
var stormpath = require('express-stormpath');

var router = express.Router();

router.get('/switchPoint', stormpath.loginRequired, function(req, res, next) {

	var groupNames = [];

	req.user.getGroups(function(err, groups) {

		for (var i = 0, len = groups.items.length; i < len; i++) {
			groupNames.push(groups.items[i].name);
		}

		if (groupNames.indexOf("admins") > -1) {	// http://expressjs.com/en/4x/api.html#res.redirect http://expressjs.com/en/guide/routing.html#response-methods
			res.redirect('/admin/main');
		}
		else {
			res.redirect('/company/main');
		}
	});
});

router.get('/admin/*', stormpath.groupsRequired(['admins']), function(req, res, next) {
	next();
});

router.get('/admin/main', function(req, res, next) {
	res.render('admin/main', {
		title: 'Welcome to the Admin Dashboard ' + req.user.email,
		text: 'Geoffrey - A company name sentiment analysis application doped with the GCE and some elastic computing'
	});
});

router.get('/company/*', stormpath.groupsRequired(['companies']), function(req, res, next) {
	next();
});

router.get('/company/main', function(req, res, next) {
	res.render('company/main', {
		title: 'Welcome to the Company Dashboard ' + req.user.email,
		text: 'Geoffrey - A company name sentiment analysis application doped with the GCE and some elastic computing'
	});
});

module.exports = router;