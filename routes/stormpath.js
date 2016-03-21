// Dependencies for NodeJS core modules
var path = require('path');								// https://nodejs.org/dist/latest-v5.x/docs/api/path.html (This module contains utilities for handling and transforming file paths)

// Dependencies for 3rd-Party modules
var express = require('express');
var stormpath = require('express-stormpath');

// Dependency to make settings of the config files available
var config = require('config');							// https://github.com/lorenwest/node-config

var stormpathConfig = {									// https://github.com/stormpath/express-stormpath/blob/master/lib/config.yml
	web: {
		register: {
			enabled: true,
				form: {
				fields: {
					givenName: {
						enabled: false
					},
					surname: {
						enabled: false
					}
				}
			}
			// https://github.com/stormpath/stormpath-express/tree/master/lib/views
			// view: path.join(__dirname,'views/stormpath','register.jade')
		},
		login: {
			enabled: true,
				uri: '/',
				nextUri: '/switchPoint'
			// view: path.join(__dirname,'views/stormpath','login.jade')
		},
		// http://docs.stormpath.com/nodejs/express/latest/logout.html#configuration-options
		logout: {
			enabled: true,
				uri: '/logout',			// Needs a POST request on this URI that it can work successfully
				nextUri: '/'
		},
		// http://docs.stormpath.com/nodejs/express/latest/password_reset.html#customizing-the-ux
		forgotPassword: {
			enabled: true,
				uri: "/forgotPassword",
				nextUri: "/?status=forgot"
			// view: path.join(__dirname,'views/stormpath','forgotPassword.jade')
		},
		changePassword: {
			enabled: false,
				uri: "/changePassword",
				nextUri: "/?status=reset",
			// view: path.join(__dirname,'views/stormpath','changePassword.jade')
		}
	},
	// custom code after a user registers for your site? --> http://docs.stormpath.com/nodejs/express/latest/registration.html#post-registration-handler
	postRegistrationHandler: function (account, req, res, next) {
		console.log('User:', account.email, 'just registered!');

		// Add user to the admin group if it's the email of one of us four (else add the user to the companies group)
		var adminEmails = config.get('admin-emails');
		var client = req.app.get('stormpathClient');
		if (adminEmails.indexOf(account.email) > -1) {														// https://docs.stormpath.com/nodejs/express/latest/configuration.html#stormpath-client-options
			client.getGroup('https://api.stormpath.com/v1/groups/4gHx0Bs8h2paAflbgXcTkr', function(err, group) {	// http://docs.stormpath.com/nodejs/api/home (Retrieve a Specific Resource)
				account.addToGroup(group, function(err, membership) {												// http://docs.stormpath.com/nodejs/api/account#addToGroup
					console.log('User:', account.email, 'has been added to the following group', membership);
				});
			});
		}
		else {														// https://docs.stormpath.com/nodejs/express/latest/configuration.html#stormpath-client-options
			client.getGroup('https://api.stormpath.com/v1/groups/5naotEFls8d1AyAZ8oYhRd', function(err, group) {	// http://docs.stormpath.com/nodejs/api/home (Retrieve a Specific Resource)
				account.addToGroup(group, function(err, membership) {												// http://docs.stormpath.com/nodejs/api/account#addToGroup
					console.log('User:', account.email, 'has been added to the following group', membership);
				});
			});
		}

		next();
	},
	// custom code after a user logs into our app? --> http://docs.stormpath.com/nodejs/express/latest/login.html#post-login-handler
	postLoginHandler: function (account, req, res, next) {
		console.log('User:', account.email, 'just logged in!');
		next();
	}
}

// module.exports = router;
module.exports = stormpathConfig;