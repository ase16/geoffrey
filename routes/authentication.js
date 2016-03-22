"use strict";

// Third-party modules
var router = require('express').Router();
var expressStormpath = require('express-stormpath');

router.get('/authentication', expressStormpath.loginRequired, function(req, res, next) {

	var groupNames = [];

	req.user.getGroups(function(err, groups) {

		for (var i = 0, len = groups.items.length; i < len; i++) {
			groupNames.push(groups.items[i].name);
		}

		if (groupNames.indexOf("admins") > -1) {
			res.redirect('/admin/main');
		}
		else {
			res.redirect('/company/main');
		}
	});
});

module.exports = router;