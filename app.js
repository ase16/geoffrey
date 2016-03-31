"use strict";

// NodeJS core modules
var path = require('path');												// This module contains utilities for handling and transforming file paths --> https://nodejs.org/dist/latest-v5.x/docs/api/path.html

// Third-party modules
require('dotenv').config({path: '.env.stormpath'});						// Automatically reads in .env files and sets environment variables --> https://github.com/motdotla/dotenv#usage
var express = require('express');
var expressStormpath = require('express-stormpath');					// Our "Tenant" for Stormpath is "majestic-panther" --> https://api.stormpath.com/login

// Express modules
var bodyParser = require('body-parser');								// --> https://github.com/expressjs/body-parser

// Custom modules
var stormpath = require('./routes/stormpath');
var authentication = require('./routes/authentication');
var admin = require('./routes/admin');
var company = require('./routes/company');

// Create express application
var app = express();													// --> http://expressjs.com/en/4x/api.html#app

// Set up view/template engine and make static files accessible
app.set('view engine', 'jade');											// Specify which template-engine to use (we do not need to "require" it since it is handled via ExpressJS)
app.set('views', path.join(__dirname, 'views'));						// Specify where the templates can be found ("__dirname" returns absolute path of current file)
app.use(bodyParser.json());												// --> https://github.com/expressjs/body-parser#bodyparserjsonoptions
app.use(bodyParser.urlencoded({ extended: false }));					// --> https://github.com/expressjs/body-parser#bodyparserurlencodedoptions
app.use(express.static(path.join(__dirname, 'public')));				// --> http://expressjs.com/en/starter/static-files.html

// Must be defined as the last middleware, but before our routes
app.use(expressStormpath.init(app, stormpath));							// --> http://docs.stormpath.com/nodejs/express/latest/configuration.html#initialize-express-stormpath

// Routes
app.use('/', authentication);
app.use('/admin', admin);
app.use('/company', company);

// Our server can start listening as soon as the Stormpath SDK has been initialized
app.on('stormpath.ready', function() {
	app.listen(3000, function () {
		console.log('Geoffrey is listening on port 3000!');
	});
});