// Dependencies for NodeJS core modules
var path = require('path');										// This module contains utilities for handling and transforming file paths --> https://nodejs.org/dist/latest-v5.x/docs/api/path.html

// Dependencies for 3rd-Party modules
var express = require('express');
var stormpath = require('express-stormpath');

// Dependencies for self-made modules
var stormpathConfig = require('./routes/stormpath');
var router = require('./routes/router');

var app = express();

// Set up view/template engine
app.set('view engine', 'jade');									// Specify which template-engine to use (do not forget to: "npm install jade --save") (we do not need to require it since it is handled via ExpressJS)
app.set('views', path.join(__dirname, 'views'));				// Specfiy where the templates can be found (__dirname returns absolute path of current file)

app.use(express.static(path.join(__dirname, 'public')));		// http://expressjs.com/en/starter/static-files.html

// Must be defined as the last middleware, but before custom routes
app.use(stormpath.init(app, stormpathConfig));					// http://docs.stormpath.com/nodejs/express/latest/configuration.html#initialize-express-stormpath

// Custom routes
app.use('/', router);

app.on('stormpath.ready', function() {
	app.listen(3000, function () {
		console.log('Geoffrey is listening on port 3000!');
	});
});