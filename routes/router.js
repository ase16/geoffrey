// Dependencies for 3rd-Party modules (do not forget to npm install them)
var express = require('express');
var stormpath = require('express-stormpath');

var router = express.Router();

// ToDo: This is really bad code. It is sufficient for a demo, but refactor the switch point properly as soon as possible (with forwarding and role restrictions on distinct paths)
router.get('/switchPoint', stormpath.loginRequired, function(req, res, next) {

	var groupNames = [];

	req.user.getGroups(function(err, groups) {

		for (var i = 0, len = groups.items.length; i < len; i++) {
			groupNames.push(groups.items[i].name);
		}

		if (groupNames.indexOf("admins") > -1) {

			res.render('dashboard', {
				title: 'Admin Dashboard',
				text: 'Geoffrey - A company name sentiment analysis application doped with the GCE and some elastic computing'
			});
		}
		else {

			res.render('dashboard', {
				title: 'Company Dashboard',
				text: 'Geoffrey - A company name sentiment analysis application doped with the GCE and some elastic computing'
			});
		}
	});
});

module.exports = router;